from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional, Dict, Any
from uuid import UUID
import logging
from datetime import datetime
from pydantic import BaseModel

from ..deps import get_current_user, get_db
from ..schemas.user import User
from ..schemas.fallback import (
    FallbackSettings, FallbackSettingsUpdate, FallbackSession,
    FallbackMessage, FallbackHealthStatus, SMSSendRequest, SMSReceiveResponse
)
from ..schemas.chat import EditMessageRequest, EditMessageResponse
from ..services.fallback_service import fallback_service
from ..services.sms_service import sms_service
from ..services.chat_service import ChatService
from ..services.firebase_service import firebase_service
from ..models.chat import ChatMessage

logger = logging.getLogger(__name__)
router = APIRouter()

class PhoneVerificationRequest(BaseModel):
    firebase_token: str


@router.get("/settings", response_model=FallbackSettings)
async def get_fallback_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's fallback settings"""
    settings = await fallback_service.get_fallback_settings(db, current_user.id)
    return FallbackSettings(**settings)


@router.put("/settings")
async def update_fallback_settings(
    settings: FallbackSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's fallback settings"""
    settings_dict = settings.dict(exclude_unset=True)
    success = await fallback_service.update_fallback_settings(db, current_user.id, settings_dict)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update fallback settings")
    
    return {"message": "Fallback settings updated successfully"}


@router.post("/verify-phone")
async def verify_fallback_phone(
    verification_data: PhoneVerificationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify fallback phone using Firebase ID token"""
    try:
        logger.info(f"Verifying phone for user {current_user.id} with token: {verification_data.firebase_token[:50]}...")
        
        # Verify Firebase token
        decoded_token = firebase_service.verify_id_token(verification_data.firebase_token)
        if not decoded_token:
            logger.error("Firebase token verification failed")
            raise HTTPException(status_code=400, detail="Invalid Firebase token")
        
        logger.info(f"Firebase token verified successfully: {decoded_token}")
        
        # Get phone number from token
        verified_phone = decoded_token.get('phone_number')
        if not verified_phone:
            logger.error("No phone number found in Firebase token")
            raise HTTPException(status_code=400, detail="Phone number not found in token")
        
        logger.info(f"Token phone: {verified_phone}, User fallback phone: {current_user.fallback_phone}")
        
        # Verify this matches user's fallback phone
        if current_user.fallback_phone != verified_phone:
            logger.error(f"Phone mismatch: token={verified_phone}, user={current_user.fallback_phone}")
            raise HTTPException(
                status_code=400, 
                detail="Phone number in token does not match your fallback phone number"
            )
        
        # Mark phone as verified
        success = await fallback_service.mark_phone_verified(db, current_user.id)
        if not success:
            logger.error("Failed to mark phone as verified in database")
            raise HTTPException(status_code=400, detail="Failed to verify phone number")
        
        logger.info(f"Phone verification successful for user {current_user.id}")
        return {"message": "Phone number verified successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying fallback phone: {e}")
        raise HTTPException(status_code=400, detail="Failed to verify phone number")


@router.post("/activate")
async def activate_fallback(
    chat_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually activate SMS fallback"""
    session = await fallback_service.activate_fallback(
        db, current_user.id, "manual", chat_id
    )
    
    if not session:
        raise HTTPException(
            status_code=400, 
            detail="Failed to activate fallback. Ensure you have a verified fallback phone number."
        )
    
    return {"message": "SMS fallback activated successfully", "session_id": session.id}


@router.post("/deactivate")
async def deactivate_fallback(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manually deactivate SMS fallback"""
    success = await fallback_service.deactivate_fallback(db, current_user.id)
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to deactivate fallback")
    
    return {"message": "SMS fallback deactivated successfully"}


@router.get("/chats")
async def get_fallback_chats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all fallback chats for the current user"""
    chats = await fallback_service.get_fallback_chats(db, current_user.id)
    return {"fallback_chats": chats}


@router.get("/health", response_model=FallbackHealthStatus)
async def get_fallback_health(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current fallback health status"""
    return await fallback_service.get_health_status(db, current_user.id)


@router.post("/sms/send")
async def send_sms_direct(
    request: SMSSendRequest,
    current_user: User = Depends(get_current_user)
):
    """Send SMS directly (for testing)"""
    success = await sms_service.send_sms(request.phone_number, request.message)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send SMS")
    
    return {"message": "SMS sent successfully"}


@router.get("/sms/receive", response_model=SMSReceiveResponse)
async def receive_sms_direct(
    current_user: User = Depends(get_current_user)
):
    """Receive SMS directly using long polling (for testing)"""
    sms_data = await sms_service.receive_sms()
    
    if not sms_data:
        return SMSReceiveResponse(status="no_new_messages")
    
    return SMSReceiveResponse(**sms_data)


@router.get("/sms/status")
async def get_sms_system_status(
    current_user: User = Depends(get_current_user)
):
    """Get SMS system status"""
    status = await sms_service.get_system_status()
    
    if not status:
        raise HTTPException(status_code=503, detail="SMS system unavailable")
    
    return status


@router.get("/sms/health")
async def check_sms_health(
    current_user: User = Depends(get_current_user)
):
    """Check SMS API health"""
    is_healthy = await sms_service.health_check()
    
    return {
        "healthy": is_healthy,
        "message": "SMS API is healthy" if is_healthy else "SMS API is not responding"
    }


@router.post("/sms/webhook")
async def sms_webhook(
    sms_data: dict,
    db: Session = Depends(get_db)
):
    """Webhook endpoint for incoming SMS messages (if needed)"""
    try:
        # This endpoint can be used if the SMS API supports webhooks
        # For now, we're using long polling, so this is just a placeholder
        logger.info(f"Received SMS webhook: {sms_data}")
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Error processing SMS webhook: {e}")
        raise HTTPException(status_code=500, detail="Failed to process SMS webhook")


# Message editing functionality
@router.put("/messages/{message_id}/edit", response_model=EditMessageResponse)
async def edit_message(
    message_id: UUID,
    request: EditMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit a user message and clear subsequent AI responses"""
    try:
        # Get the message
        message = db.query(ChatMessage).filter(
            ChatMessage.id == message_id,
            ChatMessage.user_id == current_user.id,
            ChatMessage.role == "user"  # Only allow editing user messages
        ).first()
        
        if not message:
            raise HTTPException(status_code=404, detail="Message not found or not editable")
        
        # Store original content if not already stored
        if not message.original_content:
            message.original_content = message.content
        
        # Update message content
        message.content = request.content
        message.is_edited = True
        message.edited_at = datetime.utcnow()
        
        # Delete all messages that come after this one in the chat
        # This ensures the conversation resets from this point
        messages_to_delete = db.query(ChatMessage).filter(
            ChatMessage.chat_id == message.chat_id,
            ChatMessage.created_at > message.created_at
        ).all()
        
        for msg in messages_to_delete:
            db.delete(msg)
        
        db.commit()
        
        # Return updated message
        updated_message = ChatService.get_message_by_id(db, message_id, current_user.id)
        
        return EditMessageResponse(
            success=True,
            message="Message edited successfully. Conversation reset from this point.",
            updated_message=updated_message
        )
        
    except Exception as e:
        logger.error(f"Error editing message {message_id}: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to edit message")


@router.get("/normal-chats")
async def get_normal_chats(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get normal (non-fallback) chats for the current user"""
    normal_chats = ChatService.get_user_normal_chats(db, current_user.id, skip, limit)
    return {"normal_chats": normal_chats}
