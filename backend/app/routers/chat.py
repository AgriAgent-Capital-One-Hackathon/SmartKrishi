from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import logging

from ..deps import get_current_user, get_db
from ..ai.chat_service import ChatService as AIService
from ..services.chat_service import ChatService
from ..schemas.user import User
from ..schemas.chat import (
    SendMessageRequest, SendMessageResponse, CreateChatRequest, 
    UpdateChatRequest, Chat, ChatSummary, ChatMessage, ChatMessageCreate
)
from pydantic import BaseModel


logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()

# Legacy models for backward compatibility
class ChatMessageLegacy(BaseModel):
    message: str
    chat_history: Optional[List[dict]] = []

class ChatResponseLegacy(BaseModel):
    response: str
    message_id: Optional[str] = None
    
    
ai_service = AIService()

@router.post("/ask", response_model=ChatResponseLegacy)
async def ask_question(
    chat_data: ChatMessageLegacy,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process text-based farming question"""
    try:
        if not chat_data.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        response = await ai_service.process_text_message(
            message=chat_data.message,
            user_id=str(current_user.id),
            chat_history=chat_data.chat_history
        )
        
        return ChatResponseLegacy(response=response)
        
    except Exception as e:
        logger.error(f"Chat error for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to process your question")
    
    
@router.post("/analyze-image", response_model=ChatResponseLegacy)
async def analyze_crop_image(
    file: UploadFile = File(...),
    message: str = Form("Analyze this crop image"),
    current_user: User = Depends(get_current_user)
):
    """Analyze uploaded crop/farm image"""
    try:
        if file.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")
        
        # Read file data
        file_data = await file.read()
        if len(file_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
        
        response = await ai_service.process_image_message(
            message=message,
            image_data=file_data,
            image_mime_type=file.content_type,
            user_id=str(current_user.id)
        )
        
        return ChatResponseLegacy(response=response)
        
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


# New Chat Persistence Endpoints
@router.post("/send", response_model=SendMessageResponse)
async def send_message(
    request: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message and get AI response"""
    try:
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Get or create chat
        if request.chat_id:
            chat = ChatService.get_chat_by_id(db, request.chat_id, current_user.id)
            if not chat:
                raise HTTPException(status_code=404, detail="Chat not found")
        else:
            # Create new chat with auto-generated title
            title = ChatService.generate_chat_title(request.message)
            chat = ChatService.create_chat(db, current_user.id, title)
        
        # Get chat history for AI context
        messages = ChatService.get_chat_messages(db, chat.id, current_user.id)
        chat_history = [
            {"role": msg.role, "content": msg.content}
            for msg in messages
        ]
        
        # Save user message
        user_message = ChatService.add_message(
            db, chat.id, current_user.id,
            ChatMessageCreate(role="user", content=request.message)
        )
        
        # Get AI response
        ai_response = await ai_service.process_text_message(
            message=request.message,
            user_id=str(current_user.id),
            chat_history=chat_history
        )
        
        # Save AI response
        ai_message = ChatService.add_message(
            db, chat.id, current_user.id,
            ChatMessageCreate(role="assistant", content=ai_response)
        )
        
        return SendMessageResponse(
            response=ai_response,
            chat_id=chat.id,
            message_id=ai_message.id
        )
        
    except Exception as e:
        logger.error(f"Send message error for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to process your message")

@router.post("/analyze-image-persistent", response_model=SendMessageResponse)
async def analyze_crop_image_persistent(
    file: UploadFile = File(...),
    message: str = Form("Analyze this crop image"),
    chat_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze uploaded crop image with persistence"""
    try:
        if file.content_type not in ["image/jpeg", "image/png", "image/jpg", "image/webp"]:
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")
        
        # Read file data
        file_data = await file.read()
        if len(file_data) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB.")
        
        # Get or create chat
        chat_uuid = None
        if chat_id:
            try:
                chat_uuid = UUID(chat_id)
                chat = ChatService.get_chat_by_id(db, chat_uuid, current_user.id)
                if not chat:
                    raise HTTPException(status_code=404, detail="Chat not found")
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid chat ID format")
        else:
            title = f"Image Analysis: {file.filename}"
            chat = ChatService.create_chat(db, current_user.id, title)
            chat_uuid = chat.id
        
        # Save user message with image info
        user_message_content = f"📷 {message}\n[Uploaded image: {file.filename}]"
        user_message = ChatService.add_message(
            db, chat_uuid, current_user.id,
            ChatMessageCreate(
                role="user", 
                content=user_message_content,
                message_type="image",
                file_url=file.filename
            )
        )
        
        # Get AI response
        ai_response = await ai_service.process_image_message(
            message=message,
            image_data=file_data,
            image_mime_type=file.content_type,
            user_id=str(current_user.id)
        )
        
        # Save AI response
        ai_message = ChatService.add_message(
            db, chat_uuid, current_user.id,
            ChatMessageCreate(role="assistant", content=ai_response)
        )
        
        return SendMessageResponse(
            response=ai_response,
            chat_id=chat_uuid,
            message_id=ai_message.id
        )
        
    except Exception as e:
        logger.error(f"Image analysis error for user {current_user.id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze image")

@router.get("/chats", response_model=List[ChatSummary])
async def get_user_chats(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all chats for the current user"""
    return ChatService.get_user_chats(db, current_user.id, skip, limit)

@router.get("/chats/{chat_id}", response_model=Chat)
async def get_chat(
    chat_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific chat with all messages"""
    chat = ChatService.get_chat_by_id(db, chat_id, current_user.id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

@router.post("/chats", response_model=Chat)
async def create_chat(
    request: CreateChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat"""
    chat = ChatService.create_chat(db, current_user.id, request.title)
    return chat

@router.put("/chats/{chat_id}", response_model=Chat)
async def update_chat(
    chat_id: UUID,
    request: UpdateChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update chat title"""
    from ..schemas.chat import ChatUpdate
    chat = ChatService.update_chat(
        db, chat_id, current_user.id, 
        ChatUpdate(title=request.title)
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

@router.delete("/chats/{chat_id}")
async def delete_chat(
    chat_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chat"""
    success = ChatService.delete_chat(db, chat_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Chat not found")
    return {"message": "Chat deleted successfully"}