import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from ..models.user import User
from ..models.fallback import FallbackSession, FallbackMessage
from ..models.chat import Chat, ChatMessage
from ..schemas.fallback import (
    FallbackSessionCreate, FallbackMessageCreate, FallbackHealthStatus
)
from .sms_service import sms_service
from .telegram_client import telegram_client
from ..ai.chat_service import ChatService as AIService
from ..services.chat_service import ChatService

logger = logging.getLogger(__name__)


class NetworkHealthMonitor:
    """Monitor network health for automatic fallback activation"""
    
    def __init__(self):
        self.network_checks = {}  # user_id -> check history
        self.poor_network_threshold = 3  # consecutive failures
        
    def record_network_check(self, user_id: int, is_healthy: bool):
        """Record a network health check for a user"""
        if user_id not in self.network_checks:
            self.network_checks[user_id] = []
        
        # Keep only last 10 checks
        self.network_checks[user_id].append({
            'timestamp': datetime.utcnow(),
            'healthy': is_healthy
        })
        self.network_checks[user_id] = self.network_checks[user_id][-10:]
    
    def get_network_quality(self, user_id: int) -> str:
        """Get current network quality assessment"""
        if user_id not in self.network_checks or not self.network_checks[user_id]:
            return "unknown"
        
        recent_checks = self.network_checks[user_id][-5:]  # Last 5 checks
        healthy_count = sum(1 for check in recent_checks if check['healthy'])
        
        if healthy_count >= 4:
            return "good"
        elif healthy_count >= 2:
            return "fair"
        else:
            return "poor"
    
    def should_activate_fallback(self, user_id: int) -> bool:
        """Determine if fallback should be auto-activated"""
        if user_id not in self.network_checks:
            return False
        
        recent_checks = self.network_checks[user_id][-self.poor_network_threshold:]
        return (len(recent_checks) >= self.poor_network_threshold and
                all(not check['healthy'] for check in recent_checks))


class FallbackService:
    """Service to manage SMS fallback functionality"""
    
    def __init__(self):
        self.ai_service = AIService()
        self.chat_service = ChatService()
        self.network_monitor = NetworkHealthMonitor()
        self.active_listeners = {}  # user_id -> asyncio task
    
    async def get_fallback_settings(self, db: Session, user_id: int) -> Dict[str, Any]:
        """Get user's fallback settings"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {}
        
        return {
            "auto_fallback_enabled": user.auto_fallback_enabled or False,
            "fallback_phone": user.fallback_phone,
            "fallback_phone_verified": user.fallback_phone_verified or False,
            "fallback_active": user.fallback_active or False,
            "fallback_mode": user.fallback_mode or "manual"
        }
    
    async def update_fallback_settings(
        self, 
        db: Session, 
        user_id: int, 
        settings: Dict[str, Any]
    ) -> bool:
        """Update user's fallback settings"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return False
            
            # Store original phone for comparison
            original_phone = user.fallback_phone
            
            if "auto_fallback_enabled" in settings:
                user.auto_fallback_enabled = settings["auto_fallback_enabled"]
            
            if "fallback_phone" in settings:
                new_phone = settings["fallback_phone"]
                user.fallback_phone = new_phone
                # Reset verification if phone number actually changes
                if original_phone and original_phone != new_phone:
                    user.fallback_phone_verified = False
            
            if "fallback_phone_verified" in settings:
                user.fallback_phone_verified = settings["fallback_phone_verified"]
            
            if "fallback_mode" in settings:
                user.fallback_mode = settings["fallback_mode"]
            
            db.commit()
            
            # Start/stop monitoring based on settings
            if user.auto_fallback_enabled:
                await self.start_network_monitoring(db, user_id)
            else:
                await self.stop_network_monitoring(user_id)
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating fallback settings: {e}")
            db.rollback()
            return False
    
    async def verify_fallback_phone(self, db: Session, user_id: int) -> bool:
        """Send verification SMS and mark phone as verified"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.fallback_phone:
                return False
            
            # Send verification SMS
            message = f"SmartKrishi SMS fallback verified for {user.name}. You'll receive farming assistance via SMS when your connection is poor."
            success = await sms_service.send_sms(user.fallback_phone, message)
            
            if success:
                user.fallback_phone_verified = True
                db.commit()
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error verifying fallback phone: {e}")
            return False
    
    async def mark_phone_verified(self, db: Session, user_id: int) -> bool:
        """Mark user's fallback phone as verified after Firebase verification"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.fallback_phone:
                return False
            
            user.fallback_phone_verified = True
            db.commit()
            logger.info(f"Phone {user.fallback_phone} marked as verified for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error marking phone as verified: {e}")
            db.rollback()
            return False
    
    async def activate_fallback(
        self,
        db: Session,
        user_id: int,
        trigger: str = "manual",
        chat_id: Optional[str] = None
    ) -> Optional[FallbackSession]:
        """Activate SMS fallback for a user"""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.fallback_phone or not user.fallback_phone_verified:
                logger.warning(f"Cannot activate fallback for user {user_id}: no verified phone")
                return None
            
            # Check if already active
            active_session = db.query(FallbackSession).filter(
                and_(FallbackSession.user_id == user_id, FallbackSession.is_active == True)
            ).first()
            
            if active_session:
                logger.info(f"Fallback already active for user {user_id}")
                return active_session
            
            # Create new fallback session
            session = FallbackSession(
                user_id=user_id,
                chat_id=chat_id,
                phone_number=user.fallback_phone,
                fallback_type="sms",
                is_active=True,
                activation_trigger=trigger,
                activated_at=datetime.utcnow()
            )
            
            db.add(session)
            
            # Update user status
            user.fallback_active = True
            
            db.commit()
            
            # Register phone with SMS API for AI responses
            await sms_service.register_phone(user.fallback_phone)
            
            # Send activation notification
            await sms_service.send_sms(
                user.fallback_phone,
                "SmartKrishi SMS fallback activated due to poor connection. Continue your farming conversation via SMS."
            )
            
            # Start listening for SMS messages
            await self.start_sms_listener(db, user_id, session.id)
            
            logger.info(f"Fallback activated for user {user_id} with trigger {trigger}")
            return session
            
        except Exception as e:
            logger.error(f"Error activating fallback: {e}")
            db.rollback()
            return None
    
    async def deactivate_fallback(self, db: Session, user_id: int) -> bool:
        """Deactivate SMS fallback for a user"""
        try:
            # Get active session
            session = db.query(FallbackSession).filter(
                and_(FallbackSession.user_id == user_id, FallbackSession.is_active == True)
            ).first()
            
            if not session:
                logger.info(f"No active fallback session for user {user_id}")
                return True
            
            # Deactivate session
            session.is_active = False
            session.deactivated_at = datetime.utcnow()
            
            # Update user status
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.fallback_active = False
            
            db.commit()
            
            # Stop SMS listener
            await self.stop_sms_listener(user_id)
            
            # Send deactivation notification
            if user and user.fallback_phone:
                await sms_service.send_sms(
                    user.fallback_phone,
                    "SmartKrishi connection restored. Continue your conversation in the app."
                )
            
            logger.info(f"Fallback deactivated for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deactivating fallback: {e}")
            db.rollback()
            return False
    
    async def start_network_monitoring(self, db: Session, user_id: int):
        """Start monitoring network health for a user"""
        if user_id in self.active_listeners:
            return  # Already monitoring
        
        async def monitor_task():
            while True:
                try:
                    # Simulate network check (in real implementation, this would check actual connectivity)
                    # For now, we'll use SMS API health as a proxy
                    is_healthy = await sms_service.health_check()
                    
                    self.network_monitor.record_network_check(user_id, is_healthy)
                    
                    # Check if fallback should be activated
                    user = db.query(User).filter(User.id == user_id).first()
                    if (user and user.auto_fallback_enabled and not user.fallback_active and
                        self.network_monitor.should_activate_fallback(user_id)):
                        
                        await self.activate_fallback(db, user_id, "auto")
                    
                    # Check every 30 seconds
                    await asyncio.sleep(30)
                    
                except Exception as e:
                    logger.error(f"Error in network monitoring for user {user_id}: {e}")
                    await asyncio.sleep(30)
        
        task = asyncio.create_task(monitor_task())
        self.active_listeners[user_id] = task
        logger.info(f"Started network monitoring for user {user_id}")
    
    async def stop_network_monitoring(self, user_id: int):
        """Stop monitoring network health for a user"""
        if user_id in self.active_listeners:
            self.active_listeners[user_id].cancel()
            del self.active_listeners[user_id]
            logger.info(f"Stopped network monitoring for user {user_id}")
    
    async def start_sms_listener(self, db: Session, user_id: int, session_id: int):
        """Start listening for SMS messages for a user"""
        async def listen_task():
            while True:
                try:
                    # Check if session is still active
                    session = db.query(FallbackSession).filter(
                        and_(FallbackSession.id == session_id, FallbackSession.is_active == True)
                    ).first()
                    
                    if not session:
                        logger.info(f"SMS listener stopped - session {session_id} no longer active")
                        break
                    
                    # Wait for incoming SMS
                    sms_data = await sms_service.receive_sms()
                    
                    if sms_data and sms_data.get('phone_number') == session.phone_number:
                        await self.process_incoming_sms(db, session_id, sms_data)
                    
                    await asyncio.sleep(1)  # Small delay to prevent tight loop
                    
                except Exception as e:
                    logger.error(f"Error in SMS listener for session {session_id}: {e}")
                    await asyncio.sleep(5)
        
        if f"sms_{session_id}" not in self.active_listeners:
            task = asyncio.create_task(listen_task())
            self.active_listeners[f"sms_{session_id}"] = task
            logger.info(f"Started SMS listener for session {session_id}")
    
    async def stop_sms_listener(self, user_id: int):
        """Stop SMS listener for a user"""
        # Find and cancel SMS listener tasks
        keys_to_remove = []
        for key, task in self.active_listeners.items():
            if key.startswith(f"sms_") and key.endswith(f"_{user_id}"):
                task.cancel()
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self.active_listeners[key]
    
    async def process_incoming_sms(self, db: Session, session_id: int, sms_data: Dict[str, Any]):
        """Process an incoming SMS message"""
        try:
            session = db.query(FallbackSession).filter(FallbackSession.id == session_id).first()
            if not session:
                return
            
            # Save incoming message
            incoming_msg = FallbackMessage(
                session_id=session_id,
                user_id=session.user_id,
                phone_number=sms_data['phone_number'],
                message_type="inbound",
                content=sms_data['message'],
                fallback_type="sms",
                sms_id=sms_data.get('id'),
                is_delivered=True,
                delivered_at=datetime.utcnow()
            )
            
            db.add(incoming_msg)
            
            # Create or get fallback chat
            chat = None
            if session.chat_id:
                chat = db.query(Chat).filter(Chat.id == session.chat_id).first()
            
            if not chat:
                # Create fallback chat
                chat_title = f"SMS Fallback – {datetime.now().strftime('%Y-%m-%d')}"
                chat = Chat(
                    user_id=session.user_id,
                    title=chat_title,
                    is_fallback_chat=True,
                    fallback_phone_number=session.phone_number
                )
                db.add(chat)
                db.flush()  # Get the ID
                
                # Update session with chat_id
                session.chat_id = chat.id
            
            # Add user message to chat
            user_message = ChatMessage(
                chat_id=chat.id,
                user_id=session.user_id,
                role="user",
                content=sms_data['message'],
                message_type="text",
                fallback_type="sms",
                fallback_phone_number=session.phone_number
            )
            
            db.add(user_message)
            db.commit()
            
            # Get AI response (this happens automatically via SMS API's AI integration)
            # No need to process AI response here as SMS API handles it
            
            logger.info(f"Processed incoming SMS for session {session_id}")
            
        except Exception as e:
            logger.error(f"Error processing incoming SMS: {e}")
            db.rollback()
    
    async def get_fallback_chats(self, db: Session, user_id: int) -> List[Dict[str, Any]]:
        """Get all fallback chats for a user"""
        try:
            chats = db.query(Chat).filter(
                and_(Chat.user_id == user_id, Chat.is_fallback_chat == True, Chat.is_deleted == False)
            ).order_by(Chat.created_at.desc()).all()
            
            return [
                {
                    "id": str(chat.id),
                    "title": chat.title,
                    "created_at": chat.created_at.isoformat(),
                    "fallback_phone_number": chat.fallback_phone_number,
                    "message_count": len(chat.messages)
                }
                for chat in chats
            ]
            
        except Exception as e:
            logger.error(f"Error getting fallback chats: {e}")
            return []
    
    async def get_health_status(self, db: Session, user_id: int) -> FallbackHealthStatus:
        """Get current fallback health status"""
        user = db.query(User).filter(User.id == user_id).first()
        network_quality = self.network_monitor.get_network_quality(user_id)
        
        # Handle None values by providing defaults
        auto_fallback_enabled = False
        fallback_active = False
        
        if user:
            auto_fallback_enabled = user.auto_fallback_enabled if user.auto_fallback_enabled is not None else False
            fallback_active = user.fallback_active if user.fallback_active is not None else False
        
        return FallbackHealthStatus(
            auto_fallback_enabled=auto_fallback_enabled,
            fallback_active=fallback_active,
            network_quality=network_quality,
            last_network_check=datetime.utcnow()
        )
    
    # Telegram Integration Methods
    
    async def verify_telegram_registration(
        self,
        db: Session,
        user_id: int,
        registration_code: str
    ) -> bool:
        """Verify Telegram bot registration"""
        try:
            success = await telegram_client.verify_registration(registration_code, user_id)
            if success:
                logger.info(f"Telegram registration verified for user {user_id}")
                # Update user fallback method to telegram if they want
                user = db.query(User).filter(User.id == user_id).first()
                if user and hasattr(user, 'fallback_method'):
                    user.fallback_method = "telegram"
                    db.commit()
                return True
            return False
        except Exception as e:
            logger.error(f"Error verifying Telegram registration: {e}")
            return False
    
    async def activate_telegram_fallback(
        self,
        db: Session,
        user_id: int,
        trigger: str = "manual"
    ) -> bool:
        """Activate Telegram fallback for a user"""
        try:
            success = await telegram_client.activate_fallback(user_id, trigger)
            if success:
                # Update user status
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    user.fallback_active = True
                    if hasattr(user, 'fallback_method'):
                        user.fallback_method = "telegram"
                    db.commit()
                
                logger.info(f"Telegram fallback activated for user {user_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error activating Telegram fallback: {e}")
            return False
    
    async def deactivate_telegram_fallback(
        self,
        db: Session,
        user_id: int
    ) -> bool:
        """Deactivate Telegram fallback for a user"""
        try:
            success = await telegram_client.deactivate_fallback(user_id)
            if success:
                # Update user status
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    user.fallback_active = False
                    db.commit()
                
                logger.info(f"Telegram fallback deactivated for user {user_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error deactivating Telegram fallback: {e}")
            return False
    
    async def send_telegram_message(
        self,
        user_id: int,
        message: str
    ) -> bool:
        """Send a message to user via Telegram"""
        try:
            return await telegram_client.send_message(user_id, message)
        except Exception as e:
            logger.error(f"Error sending Telegram message: {e}")
            return False
    
    async def get_telegram_user_info(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get Telegram user information"""
        try:
            return await telegram_client.get_user_info(user_id)
        except Exception as e:
            logger.error(f"Error getting Telegram user info: {e}")
            return None


# Global instance
fallback_service = FallbackService()
