from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class UploadedFileBase(BaseModel):
    original_filename: str
    file_type: str
    file_size: int
    mime_type: Optional[str] = None

class UploadedFileCreate(UploadedFileBase):
    user_id: int
    chat_id: UUID
    message_id: Optional[UUID] = None

class UploadedFileUpdate(BaseModel):
    agent_file_id: Optional[str] = None
    processing_status: Optional[str] = None
    summary: Optional[str] = None
    file_metadata: Optional[str] = None

class UploadedFile(UploadedFileBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: int
    chat_id: UUID
    message_id: Optional[UUID] = None
    agent_file_id: Optional[str] = None
    processing_status: str
    summary: Optional[str] = None
    file_metadata: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool

class FileUploadResponse(BaseModel):
    file_id: UUID
    original_filename: str
    file_type: str
    file_size: int
    processing_status: str
    agent_file_id: Optional[str] = None
    message: str

class ChatFilesResponse(BaseModel):
    user_id: int
    chat_id: UUID
    files: List[UploadedFile]
    total_count: int
