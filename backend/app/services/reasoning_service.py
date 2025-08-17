from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from typing import List, Optional, Dict, Any
from uuid import UUID
import json
import logging

from app.models.reasoning import ReasoningStep, AgentApiConfig
from app.schemas.reasoning import (
    ReasoningStepCreate, 
    AgentApiConfigCreate, 
    AgentApiConfigUpdate,
    StreamingEvent
)

logger = logging.getLogger(__name__)

class ReasoningService:
    
    @staticmethod
    def create_reasoning_step(db: Session, step_data: ReasoningStepCreate) -> ReasoningStep:
        """Create a new reasoning step"""
        db_step = ReasoningStep(**step_data.dict())
        db.add(db_step)
        db.commit()
        db.refresh(db_step)
        return db_step
    
    @staticmethod
    def create_reasoning_step_from_event(
        db: Session, 
        message_id: UUID, 
        chat_id: UUID, 
        user_id: int, 
        event: StreamingEvent,
        step_order: int
    ) -> ReasoningStep:
        """Create reasoning step from streaming event"""
        try:
            # Extract relevant information from event
            event_data = event.data or {}
            
            step_data = ReasoningStepCreate(
                message_id=message_id,
                chat_id=chat_id,
                user_id=user_id,
                step_type=event.type,
                step_order=step_order,
                stage=event_data.get("stage"),
                content=event_data.get("content") or event_data.get("message"),
                tool_name=event_data.get("tool"),
                tool_args=event_data.get("args"),
                tool_result=event_data.get("result"),
                step_metadata=event_data
            )
            
            return ReasoningService.create_reasoning_step(db, step_data)
            
        except Exception as e:
            logger.error(f"Failed to create reasoning step from event: {e}")
            raise
    
    @staticmethod
    def get_reasoning_steps_for_message(
        db: Session, 
        message_id: UUID, 
        user_id: int
    ) -> List[ReasoningStep]:
        """Get all reasoning steps for a specific message"""
        return db.query(ReasoningStep).filter(
            and_(
                ReasoningStep.message_id == message_id,
                ReasoningStep.user_id == user_id
            )
        ).order_by(ReasoningStep.step_order).all()
    
    @staticmethod
    def get_reasoning_steps_for_chat(
        db: Session, 
        chat_id: UUID, 
        user_id: int
    ) -> List[ReasoningStep]:
        """Get all reasoning steps for a chat"""
        return db.query(ReasoningStep).filter(
            and_(
                ReasoningStep.chat_id == chat_id,
                ReasoningStep.user_id == user_id
            )
        ).order_by(ReasoningStep.created_at, ReasoningStep.step_order).all()
    
    @staticmethod
    def delete_reasoning_steps_for_message(
        db: Session, 
        message_id: UUID, 
        user_id: int
    ) -> bool:
        """Delete all reasoning steps for a message"""
        try:
            db.query(ReasoningStep).filter(
                and_(
                    ReasoningStep.message_id == message_id,
                    ReasoningStep.user_id == user_id
                )
            ).delete()
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to delete reasoning steps: {e}")
            db.rollback()
            return False
    
    # Agent API Config methods
    @staticmethod
    def get_user_agent_config(db: Session, user_id: int) -> Optional[AgentApiConfig]:
        """Get agent API configuration for a user"""
        return db.query(AgentApiConfig).filter(AgentApiConfig.user_id == user_id).first()
    
    @staticmethod
    def create_user_agent_config(db: Session, config_data: AgentApiConfigCreate) -> AgentApiConfig:
        """Create agent API configuration for a user"""
        db_config = AgentApiConfig(**config_data.dict())
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
        return db_config
    
    @staticmethod
    def update_user_agent_config(
        db: Session, 
        user_id: int, 
        update_data: AgentApiConfigUpdate
    ) -> Optional[AgentApiConfig]:
        """Update agent API configuration for a user"""
        db_config = ReasoningService.get_user_agent_config(db, user_id)
        if not db_config:
            return None
        
        update_dict = update_data.dict(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(db_config, field, value)
        
        db.commit()
        db.refresh(db_config)
        return db_config
    
    @staticmethod
    def get_or_create_user_agent_config(db: Session, user_id: int) -> AgentApiConfig:
        """Get or create agent API configuration for a user"""
        config = ReasoningService.get_user_agent_config(db, user_id)
        if not config:
            config_data = AgentApiConfigCreate(user_id=user_id)
            config = ReasoningService.create_user_agent_config(db, config_data)
        return config
