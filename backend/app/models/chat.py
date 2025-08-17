from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.database import Base

class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    is_fallback_chat = Column(Boolean, nullable=False, default=False, server_default='false')  # Indicates if this chat is from SMS fallback
    fallback_phone_number = Column(String(20), nullable=True)  # Phone used for fallback
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    is_deleted = Column(Boolean, nullable=False, default=False, server_default='false')
    
    # Relationship
    user = relationship("User", back_populates="chats")
    messages = relationship("ChatMessage", back_populates="chat", cascade="all, delete-orphan")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    message_type = Column(String(20), nullable=False, default='text', server_default='text')  # 'text', 'image', 'file'
    file_url = Column(String(500), nullable=True)  # For uploaded files
    is_edited = Column(Boolean, nullable=False, default=False, server_default='false')  # Track if message was edited
    original_content = Column(Text, nullable=True)  # Store original content if edited
    fallback_type = Column(String(20), nullable=True)  # sms, whatsapp if from fallback
    fallback_phone_number = Column(String(20), nullable=True)  # Phone number for fallback messages
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    edited_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    chat = relationship("Chat", back_populates="messages")
    user = relationship("User")
