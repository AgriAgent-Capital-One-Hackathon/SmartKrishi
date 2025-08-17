from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base
import enum


class AuthProvider(enum.Enum):
    email = "email"
    mobile = "mobile"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    auth_provider = Column(Enum(AuthProvider), nullable=False, default=AuthProvider.email)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # SMS Fallback fields
    auto_fallback_enabled = Column(Boolean, default=False)
    fallback_mode = Column(String(20), default="manual")  # manual, auto
    fallback_active = Column(Boolean, default=False)
    fallback_phone = Column(String, nullable=True)  # SMS fallback phone (can be different from login phone)
    fallback_phone_verified = Column(Boolean, default=False)
    whatsapp_user_id = Column(String, unique=True, nullable=True)
    
    # Relationships
    chats = relationship("Chat", back_populates="user")
    fallback_sessions = relationship("FallbackSession", back_populates="user")
