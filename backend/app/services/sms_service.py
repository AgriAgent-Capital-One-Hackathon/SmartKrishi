import httpx
import logging
from typing import Optional, Dict, Any
from urllib.parse import quote
import asyncio
import json
import os

logger = logging.getLogger(__name__)
class SMSService:
    """Service to interact with external SMS API"""
    
    def __init__(self):
        # Use environment variable or default (disabled)
        self.base_url = os.getenv("SMS_API_BASE_URL", "https://00cb6ef1abec.ngrok-free.app")
        self.headers = {
            "ngrok-skip-browser-warning": "true",
            "Content-Type": "application/json"
        }
        self.timeout = 35.0  # Slightly longer than long polling timeout
        self.enabled = self.base_url is not None
        
        if not self.enabled:
            logger.info("📱 SMS Service disabled - Set SMS_API_BASE_URL environment variable to enable")
        else:
            logger.info(f"📱 SMS Service enabled - Base URL: {self.base_url}")
    
    async def health_check(self) -> bool:
        """Check if SMS API server is running"""
        if not self.enabled:
            logger.debug("SMS service is disabled")
            return False
            
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"{self.base_url}/",
                    headers=self.headers
                )
                return response.status_code == 200
        except Exception as e:
            logger.warning(f"SMS API health check failed: {e}")
            return False
    
    async def send_sms(self, phone_number: str, message: str) -> bool:
        """Send SMS message"""
        if not self.enabled:
            logger.warning(f"📱 SMS service disabled - Cannot send SMS to {phone_number}")
            return False
            
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/send",
                    json={
                        "phone_number": phone_number,
                        "message": message
                    },
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    logger.info(f"📱 SMS sent successfully to {phone_number}")
                    return True
                else:
                    logger.warning(f"📱 Failed to send SMS: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.warning(f"📱 Error sending SMS to {phone_number}: {e}")
            return False
    
    async def register_phone(self, phone_number: str) -> bool:
        """Register phone number for AI-powered replies"""
        if not self.enabled:
            logger.warning(f"📱 SMS service disabled - Cannot register phone {phone_number}")
            return False
            
        try:
            encoded_phone = quote(phone_number, safe='')
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.base_url}/register/{encoded_phone}",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    logger.info(f"📱 Phone {phone_number} registered successfully")
                    return True
                else:
                    logger.warning(f"📱 Failed to register phone: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.warning(f"📱 Error registering phone {phone_number}: {e}")
            return False
    
    async def receive_sms(self) -> Optional[Dict[str, Any]]:
        """Wait for incoming SMS using long polling"""
        if not self.enabled:
            logger.debug("📱 SMS service disabled - No SMS to receive")
            return None
            
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/receive",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "no_new_messages":
                        return None
                    return data
                else:
                    logger.warning(f"📱 Failed to receive SMS: {response.status_code} - {response.text}")
                    return None
                    
        except httpx.TimeoutException:
            # This is normal for long polling
            logger.debug("📱 SMS polling timeout (normal)")
            return None
        except Exception as e:
            logger.warning(f"📱 Error receiving SMS: {e}")
            return None
    
    async def get_chat_history(self, phone_number: str, limit: int = 100) -> Optional[Dict[str, Any]]:
        """Get chat history for a phone number"""
        if not self.enabled:
            logger.warning(f"📱 SMS service disabled - Cannot get chat history for {phone_number}")
            return None
            
        try:
            encoded_phone = quote(phone_number, safe='')
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/history/{encoded_phone}?limit={limit}",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"📱 Failed to get chat history: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.warning(f"📱 Error getting chat history for {phone_number}: {e}")
            return None
    
    async def clear_chat_history(self, phone_number: str) -> bool:
        """Clear chat history for a phone number"""
        if not self.enabled:
            logger.warning(f"📱 SMS service disabled - Cannot clear chat history for {phone_number}")
            return False
            
        try:
            encoded_phone = quote(phone_number, safe='')
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.delete(
                    f"{self.base_url}/history/{encoded_phone}",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    logger.info(f"📱 Chat history cleared for {phone_number}")
                    return True
                else:
                    logger.warning(f"📱 Failed to clear chat history: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.warning(f"📱 Error clearing chat history for {phone_number}: {e}")
            return False
    
    async def get_system_status(self) -> Optional[Dict[str, Any]]:
        """Get SMS system status"""
        if not self.enabled:
            return {
                "status": "disabled",
                "message": "SMS service is disabled - set SMS_API_BASE_URL environment variable to enable"
            }
            
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/status",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.warning(f"📱 Failed to get system status: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.warning(f"📱 Error getting system status: {e}")
            return None
    
    async def get_registered_numbers(self) -> Optional[list]:
        """Get list of registered phone numbers"""
        if not self.enabled:
            logger.warning("📱 SMS service disabled - Cannot get registered numbers")
            return []
            
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/numbers",
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Failed to get registered numbers: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting registered numbers: {e}")
            return None


# Global instance
sms_service = SMSService()
