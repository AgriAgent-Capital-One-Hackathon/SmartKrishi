import httpx
import logging
from typing import Optional, Dict, Any
from decouple import config

logger = logging.getLogger(__name__)

class TelegramClient:
    """Client to communicate with Telegram Bot Microservice"""
    
    def __init__(self):
        self.telegram_service_url = config('TELEGRAM_SERVICE_URL', default='http://localhost:8001')
        self.timeout = 30.0
    
    async def send_message(self, smartkrishi_user_id: int, message: str) -> bool:
        """Send message to user via Telegram bot"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.telegram_service_url}/api/v1/send-message",
                    json={
                        "smartkrishi_user_id": smartkrishi_user_id,
                        "message": message
                    }
                )
                
                if response.status_code == 200:
                    logger.info(f"Telegram message sent to user {smartkrishi_user_id}")
                    return True
                else:
                    logger.error(f"Failed to send Telegram message: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Failed to send Telegram message: {e}")
            return False
    
    async def verify_registration(self, registration_code: str, smartkrishi_user_id: int) -> bool:
        """Verify user registration"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.telegram_service_url}/api/v1/verify-registration",
                    json={
                        "registration_code": registration_code,
                        "smartkrishi_user_id": smartkrishi_user_id
                    }
                )
                
                if response.status_code == 200:
                    logger.info(f"Telegram registration verified for user {smartkrishi_user_id}")
                    return True
                else:
                    logger.error(f"Failed to verify Telegram registration: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Failed to verify Telegram registration: {e}")
            return False
    
    async def activate_fallback(self, smartkrishi_user_id: int, trigger: str = "auto") -> bool:
        """Activate fallback session"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.telegram_service_url}/api/v1/activate-fallback",
                    json={
                        "smartkrishi_user_id": smartkrishi_user_id,
                        "trigger": trigger
                    }
                )
                
                if response.status_code == 200:
                    logger.info(f"Telegram fallback activated for user {smartkrishi_user_id}")
                    return True
                else:
                    logger.error(f"Failed to activate Telegram fallback: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Failed to activate Telegram fallback: {e}")
            return False
    
    async def deactivate_fallback(self, smartkrishi_user_id: int) -> bool:
        """Deactivate fallback session"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.telegram_service_url}/api/v1/deactivate-fallback",
                    json={
                        "smartkrishi_user_id": smartkrishi_user_id
                    }
                )
                
                if response.status_code == 200:
                    logger.info(f"Telegram fallback deactivated for user {smartkrishi_user_id}")
                    return True
                else:
                    logger.error(f"Failed to deactivate Telegram fallback: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Failed to deactivate Telegram fallback: {e}")
            return False
    
    async def get_user_info(self, smartkrishi_user_id: int) -> Optional[Dict[str, Any]]:
        """Get Telegram user information"""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.telegram_service_url}/api/v1/users/{smartkrishi_user_id}"
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to get Telegram user info: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Failed to get Telegram user info: {e}")
            return None
    
    async def health_check(self) -> bool:
        """Check if Telegram service is healthy"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.telegram_service_url}/api/v1/health")
                return response.status_code == 200 and response.json().get("status") == "healthy"
        except Exception as e:
            logger.error(f"Telegram service health check failed: {e}")
            return False
    
    async def get_service_stats(self) -> Optional[Dict[str, Any]]:
        """Get service statistics"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.telegram_service_url}/api/v1/stats")
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            logger.error(f"Failed to get Telegram service stats: {e}")
            return None

# Global instance
telegram_client = TelegramClient()
