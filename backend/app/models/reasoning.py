from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.database import Base

class ReasoningStep(Base):
    """Model to store AI reasoning steps for each message"""
    __tablename__ = "reasoning_steps"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("chat_messages.id"), nullable=False)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Reasoning step details
    step_type = Column(String(50), nullable=False)  # 'log', 'plan', 'tool_call', 'thinking', 'response_chunk', etc.
    step_order = Column(Integer, nullable=False)  # Order of this step in the reasoning process
    stage = Column(String(50), nullable=True)  # For log events: 'initialization', 'planner_start', etc.
    content = Column(Text, nullable=True)  # Text content for thinking, response_chunk
    tool_name = Column(String(100), nullable=True)  # For tool_call events
    tool_args = Column(Text, nullable=True)  # Tool arguments as string
    tool_result = Column(JSON, nullable=True)  # Tool result as JSON
    step_metadata = Column(JSON, nullable=True)  # Additional metadata (plan, grounding, etc.)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    message = relationship("ChatMessage", back_populates="reasoning_steps")
    chat = relationship("Chat")
    user = relationship("User")

class AgentApiConfig(Base):
    """Model to store agent API integration configuration per user"""
    __tablename__ = "agent_api_configs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Agent API settings
    preferred_model = Column(String(100), default="gemini-2.5-flash")
    default_tools = Column(JSON, nullable=True)  # List of tool names
    include_logs = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationship
    user = relationship("User")
