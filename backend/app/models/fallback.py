from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.database import Base


class FallbackSession(Base):
    """Tracks SMS fallback sessions for users"""
    __tablename__ = "fallback_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=True)
    phone_number = Column(String(20), nullable=False)
    fallback_type = Column(String(20), nullable=False, default="sms")  # sms, whatsapp
    is_active = Column(Boolean, default=True)
    activation_trigger = Column(String(20), nullable=False)  # auto, manual, network_failure
    activated_at = Column(DateTime(timezone=True), server_default=func.now())
    deactivated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="fallback_sessions")
    chat = relationship("Chat")
    messages = relationship("FallbackMessage", back_populates="session", cascade="all, delete-orphan")


class FallbackMessage(Base):
    """Tracks messages sent/received via SMS fallback"""
    __tablename__ = "fallback_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("fallback_sessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    phone_number = Column(String(20), nullable=False)
    message_type = Column(String(20), nullable=False)  # inbound, outbound, system
    content = Column(Text, nullable=False)
    fallback_type = Column(String(20), nullable=False, default="sms")
    sms_id = Column(String, nullable=True)  # External SMS API message ID
    is_delivered = Column(Boolean, default=False)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    session = relationship("FallbackSession", back_populates="messages")
    user = relationship("User")
