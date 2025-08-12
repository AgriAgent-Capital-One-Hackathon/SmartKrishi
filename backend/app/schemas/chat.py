from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class ChatMessageBase(BaseModel):
    role: str
    content: str
    message_type: str = 'text'
    file_url: Optional[str] = None

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessage(ChatMessageBase):
    id: UUID
    chat_id: UUID
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatBase(BaseModel):
    title: str

class ChatCreate(ChatBase):
    pass

class ChatUpdate(BaseModel):
    title: Optional[str] = None

class Chat(ChatBase):
    id: UUID
    user_id: int
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    messages: List[ChatMessage] = []
    
    class Config:
        from_attributes = True

class ChatSummary(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    last_message: Optional[str] = None
    message_count: int = 0
    
    class Config:
        from_attributes = True

# API Request/Response models
class SendMessageRequest(BaseModel):
    message: str
    chat_id: Optional[UUID] = None

class SendMessageResponse(BaseModel):
    response: str
    chat_id: UUID
    message_id: UUID

class CreateChatRequest(BaseModel):
    title: str

class UpdateChatRequest(BaseModel):
    title: str
