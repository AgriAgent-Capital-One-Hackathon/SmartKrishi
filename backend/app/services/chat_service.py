from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from uuid import UUID
import uuid

from ..models.chat import Chat, ChatMessage
from ..models.user import User
from ..schemas.chat import ChatCreate, ChatUpdate, ChatMessageCreate, ChatSummary

class ChatService:
    
    @staticmethod
    def create_chat(db: Session, user_id: int, title: str) -> Chat:
        """Create a new chat"""
        db_chat = Chat(
            user_id=user_id,
            title=title
        )
        db.add(db_chat)
        db.commit()
        db.refresh(db_chat)
        return db_chat
    
    @staticmethod
    def get_user_chats(db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[ChatSummary]:
        """Get all chats for a user with summary info"""
        chats_query = db.query(
            Chat.id,
            Chat.title,
            Chat.created_at,
            Chat.updated_at,
            func.count(ChatMessage.id).label('message_count'),
            func.max(ChatMessage.content).label('last_message')
        ).outerjoin(ChatMessage).filter(
            Chat.user_id == user_id,
            Chat.is_deleted == False
        ).group_by(
            Chat.id, Chat.title, Chat.created_at, Chat.updated_at
        ).order_by(desc(Chat.updated_at)).offset(skip).limit(limit)
        
        results = chats_query.all()
        
        return [
            ChatSummary(
                id=chat.id,
                title=chat.title,
                created_at=chat.created_at,
                updated_at=chat.updated_at,
                message_count=chat.message_count or 0,
                last_message=chat.last_message or ""
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
