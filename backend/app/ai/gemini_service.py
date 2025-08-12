import google.generativeai as genai
from decouple import config
import logging
from typing import Optional, List, Dict, Any

logger=logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        api_key=config("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment variables")
        genai.configure(api_key=api_key)
        self.model=genai.GenerativeModel('gemini-2.5-flash')
        
    async def generate_response(
        self,
        message: str,
        chat_history: Optional[List[Dict[str,str]]]=None,
        system_prompt: Optional[str]=None,
    ) -> str:
        """Generate response using Gemini API"""
        try:
            conversation=[]
            
            if system_prompt:
                conversation.append(f"System: {system_prompt}")
                
            if chat_history:
                for chat in chat_history[-10:]:
                    role="User" if chat.get("role")=="user" else "Assistant"
                    conversation.append(f"{role}:{chat.get('content','')}")
                    
            conversation.append(f"User: {message}")
            
            prompt="\n".join(conversation)
            response=await self.model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return "I'm sorry, I'm having trouble processing your request right now. Please try again."
        
    async def generate_response_with_image(
        self, 
        message: str, 
        image_data: bytes,
        image_mime_type: str = "image/jpeg"
    ) -> str:
        """Generate response with image analysis"""
        try:
            import PIL.Image
            import io
            
            # Convert bytes to PIL Image
            image = PIL.Image.open(io.BytesIO(image_data))
            
            # Generate response with image
            response = await self.model.generate_content_async([message, image])
            return response.text
            
        except Exception as e:
            logger.error(f"Gemini image analysis error: {e}")
            return "I'm sorry, I couldn't analyze the image. Please try again."