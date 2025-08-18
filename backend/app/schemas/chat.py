from pydantic import BaseModel
from typing import List, Optional, Any, TYPE_CHECKING
from datetime import datetime
from uuid import UUID

if TYPE_CHECKING:
    from .file import UploadedFile

class ReasoningStepBase(BaseModel):
    step_type: str
    step_order: int
    stage: Optional[str] = None
    content: Optional[str] = None
    tool_name: Optional[str] = None
    tool_args: Optional[str] = None
    tool_result: Optional[Any] = None
    step_metadata: Optional[Any] = None

class ReasoningStep(ReasoningStepBase):
    id: UUID
    message_id: UUID
    chat_id: UUID
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    role: str
    content: str
    message_type: str = 'text'
    file_url: Optional[str] = None
    is_edited: bool = False
    original_content: Optional[str] = None
    fallback_type: Optional[str] = None
    fallback_phone_number: Optional[str] = None

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessage(ChatMessageBase):
    id: UUID
    chat_id: UUID
    user_id: int
    created_at: datetime
    edited_at: Optional[datetime] = None
    reasoning_steps: List[ReasoningStep] = []
    files: List['UploadedFile'] = []
    
    class Config:
        from_attributes = True

class ChatBase(BaseModel):
    title: str
    is_fallback_chat: bool = False
    fallback_phone_number: Optional[str] = None

class ChatCreate(ChatBase):
    pass

class ChatUpdate(BaseModel):
    title: Optional[str] = None

class Chat(ChatBase):
    id: UUID
    user_id: int
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False
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
    is_fallback_chat: bool = False
    fallback_phone_number: Optional[str] = None
    
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

class EditMessageRequest(BaseModel):
    content: str

class EditMessageResponse(BaseModel):
    success: bool
    message: str
    updated_message: ChatMessage

class CreateChatRequest(BaseModel):
    title: str
    is_fallback_chat: bool = False
    fallback_phone_number: Optional[str] = None

class UpdateChatRequest(BaseModel):
    title: str


# Import and rebuild models to resolve forward references
def rebuild_chat_models():
    from .file import UploadedFile
    ChatMessage.model_rebuild()
    Chat.model_rebuild()

# Call rebuild function
rebuild_chat_models()