from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_
from typing import List, Optional
from uuid import UUID
import uuid
import logging

from ..models.chat import Chat, ChatMessage
from ..models.user import User
from ..schemas.chat import ChatCreate, ChatUpdate, ChatMessageCreate, ChatSummary

logger = logging.getLogger(__name__)

class ChatService:
    
    @staticmethod
    async def create_chat(db: Session, user_id: int, title: str) -> Chat:
        """Create a new chat and sync with Agent API"""
        from .agent_api_service import AgentAPIService
        
        # Create local chat first
        db_chat = Chat(
            user_id=user_id,
            title=title
        )
        db.add(db_chat)
        db.commit()
        db.refresh(db_chat)
        
        # Create corresponding chat in Agent API
        try:
            agent_api = AgentAPIService()
            agent_result = await agent_api.create_chat(str(user_id), title)
            
            # Save the agent chat ID
            db_chat.agent_chat_id = agent_result.get("chat_id")
            db.commit()
            db.refresh(db_chat)
            
            logger.info(f"Created chat {db_chat.id} with agent_chat_id: {db_chat.agent_chat_id}")
            
        except Exception as e:
            logger.error(f"Failed to create agent chat for {db_chat.id}: {e}")
            # We still return the local chat, agent_chat_id will be None
        
        return db_chat
    
    @staticmethod
    async def ensure_agent_chat(db: Session, chat: Chat) -> str:
        """Ensure a chat has an agent_chat_id, create one if missing"""
        from .agent_api_service import AgentAPIService
        
        if chat.agent_chat_id:
            return chat.agent_chat_id
        
        try:
            agent_api = AgentAPIService()
            agent_result = await agent_api.create_chat(str(chat.user_id), chat.title)
            
            # Save the agent chat ID
            chat.agent_chat_id = agent_result.get("chat_id")
            db.commit()
            
            logger.info(f"Created missing agent_chat_id for chat {chat.id}: {chat.agent_chat_id}")
            return chat.agent_chat_id
            
        except Exception as e:
            logger.error(f"Failed to create agent chat for existing chat {chat.id}: {e}")
            raise e
    
    @staticmethod
    def get_user_chats(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[ChatSummary]:
        """Get all chats for a user with summary info"""
        chats_query = db.query(
            Chat.id,
            Chat.title,
            Chat.created_at,
            Chat.updated_at,
            Chat.is_fallback_chat,
            Chat.fallback_phone_number,
            func.count(ChatMessage.id).label('message_count'),
            func.max(ChatMessage.content).label('last_message')
        ).outerjoin(ChatMessage).filter(
            Chat.user_id == user_id,
            Chat.is_deleted == False
        ).group_by(
            Chat.id, Chat.title, Chat.created_at, Chat.updated_at, 
            Chat.is_fallback_chat, Chat.fallback_phone_number
        ).order_by(desc(Chat.updated_at)).offset(skip).limit(limit)
        
        results = chats_query.all()
        
        return [
            ChatSummary(
                id=chat.id,
                title=chat.title,
                created_at=chat.created_at,
                updated_at=chat.updated_at,
                message_count=chat.message_count or 0,
                last_message=chat.last_message or "",
                is_fallback_chat=chat.is_fallback_chat or False,
                fallback_phone_number=chat.fallback_phone_number
            )
            for chat in results
        ]
    
    @staticmethod
    def get_chat_by_id(db: Session, chat_id: UUID, user_id: int) -> Optional[Chat]:
        """Get a specific chat with all messages"""
        return db.query(Chat).filter(
            Chat.id == chat_id,
            Chat.user_id == user_id,
            Chat.is_deleted == False
        ).first()
    
    @staticmethod
    def update_chat(db: Session, chat_id: UUID, user_id: int, update_data: ChatUpdate) -> Optional[Chat]:
        """Update chat title"""
        chat = db.query(Chat).filter(
            Chat.id == chat_id,
            Chat.user_id == user_id,
            Chat.is_deleted == False
        ).first()
        
        if not chat:
            return None
            
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(chat, field, value)
        
        db.commit()
        db.refresh(chat)
        return chat
    
    @staticmethod
    def delete_chat(db: Session, chat_id: UUID, user_id: int) -> bool:
        """Soft delete a chat"""
        chat = db.query(Chat).filter(
            Chat.id == chat_id,
            Chat.user_id == user_id,
            Chat.is_deleted == False
        ).first()
        
        if not chat:
            return False
            
        chat.is_deleted = True
        db.commit()
        return True
    
    @staticmethod
    def add_message(db: Session, chat_id: UUID, user_id: int, message_data: ChatMessageCreate) -> ChatMessage:
        """Add a message to a chat"""
        db_message = ChatMessage(
            chat_id=chat_id,
            user_id=user_id,
            **message_data.dict()
        )
        db.add(db_message)
        
        # Update chat's updated_at timestamp
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if chat:
            chat.updated_at = func.now()
        
        db.commit()
        db.refresh(db_message)
        return db_message
    
    @staticmethod
    def get_chat_messages(db: Session, chat_id: UUID, user_id: int) -> List[ChatMessage]:
        """Get all messages for a chat"""
        return db.query(ChatMessage).join(Chat).filter(
            Chat.id == chat_id,
            Chat.user_id == user_id,
            Chat.is_deleted == False
        ).order_by(ChatMessage.created_at).all()
    
    @staticmethod
    def generate_chat_title(first_message: str) -> str:
        """Generate a title from the first message"""
        # Simple title generation - take first 50 chars
        title = first_message.strip()[:50]
        if len(first_message) > 50:
            title += "..."
        return title or "New Chat"
    
    @staticmethod
    def get_user_normal_chats(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[ChatSummary]:
        """Get normal (non-fallback) chats for a user"""
        chats_query = db.query(
            Chat.id,
            Chat.title,
            Chat.created_at,
            Chat.updated_at,
            Chat.is_fallback_chat,
            Chat.fallback_phone_number,
            func.count(ChatMessage.id).label('message_count'),
            func.max(ChatMessage.content).label('last_message')
        ).outerjoin(ChatMessage).filter(
            Chat.user_id == user_id,
            Chat.is_deleted == False,
            Chat.is_fallback_chat == False
        ).group_by(
            Chat.id, Chat.title, Chat.created_at, Chat.updated_at,
            Chat.is_fallback_chat, Chat.fallback_phone_number
        ).order_by(desc(Chat.updated_at)).offset(skip).limit(limit)
        
        results = chats_query.all()
        
        return [
            ChatSummary(
                id=chat.id,
                title=chat.title,
                created_at=chat.created_at,
                updated_at=chat.updated_at,
                message_count=chat.message_count or 0,
                last_message=chat.last_message or "",
                is_fallback_chat=chat.is_fallback_chat or False,
                fallback_phone_number=chat.fallback_phone_number
            )
            for chat in results
        ]
    
    @staticmethod
    def get_message_by_id(db: Session, message_id: UUID, user_id: int) -> Optional[ChatMessage]:
        """Get a specific message by ID"""
        return db.query(ChatMessage).join(Chat).filter(
            ChatMessage.id == message_id,
            Chat.user_id == user_id,
            Chat.is_deleted == False
        ).first()
