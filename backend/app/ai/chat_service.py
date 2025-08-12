from typing import List, Dict, Optional
from .gemini_service import GeminiService
from .prompts.agriculture_prompts import AGRICULTURE_SYSTEM_PROMPT, IMAGE_ANALYSIS_PROMPT
import logging

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.gemini_service = GeminiService()
        
    async def process_text_message(
        self, 
        message: str, 
        user_id: str,
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """Process text-based farming question"""
        try:
            response = await self.gemini_service.generate_response(
                message=message,
                chat_history=chat_history,
                system_prompt=AGRICULTURE_SYSTEM_PROMPT
            )
            
            # Log for analytics (optional)
            logger.info(f"User {user_id} asked: {message[:100]}...")
            
            return response
            
        except Exception as e:
            logger.error(f"Chat service error: {e}")
            return "I apologize, but I'm experiencing technical difficulties. Please try asking your question again."
    
    async def process_image_message(
        self, 
        message: str, 
        image_data: bytes,
        image_mime_type: str,
        user_id: str
    ) -> str:
        """Process image-based crop analysis"""
        try:
            # Combine user message with image analysis prompt
            full_prompt = f"{IMAGE_ANALYSIS_PROMPT}\n\nUser Question: {message}"
            
            response = await self.gemini_service.generate_response_with_image(
                message=full_prompt,
                image_data=image_data,
                image_mime_type=image_mime_type
            )
            
            logger.info(f"User {user_id} uploaded image for analysis")
            
            return response
            
        except Exception as e:
            logger.error(f"Image analysis error: {e}")
            return "I couldn't analyze the image properly. Please ensure it's a clear photo of your crop or farming concern and try again."