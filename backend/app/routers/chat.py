from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from ..deps import get_current_user, get_db
from ..ai.chat_service import ChatService
from ..schemas.user import User
from pydantic import BaseModel


logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()


class ChatMessage(BaseModel):
    message: str
    chat_history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    response: str
    message_id: Optional[str] = None
    
    
chat_service = ChatService()

@router.post("/ask", response_model=ChatResponse)
async def ask_question(
    chat_data: ChatMessage,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process text-based farming question"""
    try:
        if not chat_data.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        response = await chat_service.process_text_message(
            message=chat_data.message,
            user_id=str(current_user.id),
            chat_history=chat_data.chat_history
        )
        
        return ChatResponse(response=response)
        
    except Exception as e:
        logger.error(f"Chat error for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to process your question")
    
    
@router.post("/analyze-image", response_model=ChatResponse)
async def analyze_crop_image(
    file: UploadFile = File(...),
    message: str = Form("Analyze this crop image"),
    current_user: User = Depends(get_current_user)
):
    """Analyze uploaded crop/farm image"""
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Only image files are allowed")
        
        # Read image data
        image_data = await file.read()
        
        # Process with Gemini
        response = await chat_service.process_image_message(
            message=message,
            image_data=image_data,
            image_mime_type=file.content_type,
            user_id=str(current_user.id)
        )
        
        return ChatResponse(response=response)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image analysis error for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze image")
    
@router.get("/suggestions")
async def get_chat_suggestions(current_user: User = Depends(get_current_user)):
    """Get suggested questions for farmers"""
    suggestions = [
        {
            "id": "weather-advice",
            "text": "Weather Forecast Impact",
            "prompt": "How will the current weather conditions affect my farming activities?"
        },
        {
            "id": "crop-diseases",
            "text": "Disease Identification",
            "prompt": "Help me identify diseases affecting my crops and suggest treatments."
        },
        {
            "id": "soil-health",
            "text": "Soil Management",
            "prompt": "How can I improve my soil health for better crop yields?"
        },
        {
            "id": "market-prices",
            "text": "Market Insights",
            "prompt": "What are the current market trends for my crops?"
        },
        {
            "id": "pest-control",
            "text": "Pest Management",
            "prompt": "Suggest organic pest control methods for my crops."
        },
        {
            "id": "irrigation",
            "text": "Water Management",
            "prompt": "What's the best irrigation schedule for my current crops?"
        }
    ]
    
    return {"suggestions": suggestions}