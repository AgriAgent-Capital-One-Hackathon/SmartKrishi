import asyncio
import uuid
import logging
from typing import AsyncGenerator, Dict, Any, Optional, List
from sqlalchemy.orm import Session
from uuid import UUID

from app.services.agent_api_service import AgentAPIService
from app.services.reasoning_service import ReasoningService
from app.services.chat_service import ChatService
from app.schemas.reasoning import StreamingEvent, StreamingStatus
from app.schemas.chat import ChatMessageCreate
from app.models.chat import ChatMessage

logger = logging.getLogger(__name__)

class IntegratedChatService:
    def __init__(self):
        self.agent_api = AgentAPIService()
    
    async def send_message_stream(
        self,
        db: Session,
        user_id: int,
        chat_id: UUID,
        message: str,
        model: Optional[str] = None,
        tools: Optional[List[str]] = None,
        include_logs: Optional[bool] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Send message to agent API and stream response while persisting everything
        """
        try:
            # Get or create user agent config
            agent_config = ReasoningService.get_or_create_user_agent_config(db, user_id)
            
            # Use provided parameters or fall back to user config
            final_model = model or agent_config.preferred_model
            final_tools = tools or agent_config.default_tools
            final_include_logs = include_logs if include_logs is not None else agent_config.include_logs
            
            # Get the chat and ensure it has an agent_chat_id
            logger.info(f"Getting chat {chat_id} for user {user_id}")
            chat = ChatService.get_chat_by_id(db, chat_id, user_id)
            if not chat:
                logger.error(f"Chat {chat_id} not found for user {user_id}")
                raise ValueError(f"Chat {chat_id} not found")
            
            logger.info(f"Found chat: {chat.id}, current agent_chat_id: {chat.agent_chat_id}")
            
            # Ensure agent chat exists
            logger.info("Calling ChatService.ensure_agent_chat...")
            try:
                agent_chat_id = await ChatService.ensure_agent_chat(db, chat)
                logger.info(f"✅ Got agent_chat_id: {agent_chat_id}")
            except Exception as e:
                logger.error(f"❌ Failed to ensure agent chat: {e}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
                yield {
                    "type": "error",
                    "error": f"Failed to create agent chat: {str(e)}",
                    "chat_id": str(chat_id)
                }
                return
            
            # Check if user message already exists to avoid duplicates
            existing_user_message = db.query(ChatMessage).filter(
                ChatMessage.chat_id == chat_id,
                ChatMessage.role == "user",
                ChatMessage.content == message,
                ChatMessage.user_id == user_id
            ).order_by(ChatMessage.created_at.desc()).first()
            
            if existing_user_message:
                logger.info(f"Using existing user message: {existing_user_message.id}")
                user_message = existing_user_message
            else:
                # Create user message in database
                user_message_data = ChatMessageCreate(
                    role="user",
                    content=message,
                    message_type="text"
                )
                user_message = ChatService.add_message(db, chat_id, user_id, user_message_data)
                logger.info(f"Created new user message: {user_message.id}")
            
            # Create assistant message placeholder
            assistant_message_data = ChatMessageCreate(
                role="assistant",
                content="",  # Will be built incrementally
                message_type="text"
            )
            assistant_message = ChatService.add_message(db, chat_id, user_id, assistant_message_data)
            logger.info(f"Created assistant message placeholder: {assistant_message.id}")
            
            # Stream from agent API - Forward events directly
            accumulated_response = ""
            step_order = 0
            
            logger.info(f"Starting Agent API stream for user {user_id}, agent_chat_id {agent_chat_id}")
            
            # Add timeout and error handling for the agent stream
            async def timeout_wrapper():
                try:
                    count = 0
                    async for event in self.agent_api.stream_message(
                        user_id=str(user_id),
                        chat_id=agent_chat_id,  # Use the proper agent chat ID
                        message=message,
                        model=final_model,
                        tools=final_tools,
                        include_logs=final_include_logs
                    ):
                        count += 1
                        logger.debug(f"Got event {count}: {event.type}")
                        yield event
                        
                        # Safety limit
                        if count > 1000:
                            logger.warning("Reached safety limit of 1000 events")
                            break
                except Exception as e:
                    logger.error(f"Error in agent API stream: {e}")
                    import traceback
                    logger.error(f"Traceback: {traceback.format_exc()}")
                    yield type('Event', (), {'type': 'error', 'data': {'error': str(e)}})()
            
            async for event in timeout_wrapper():
                step_order += 1
                logger.debug(f"Received Agent API event [{step_order}]: {event.type}")
                
                # Store reasoning step for all events
                try:
                    reasoning_step = ReasoningService.create_reasoning_step_from_event(
                        db, assistant_message.id, chat_id, user_id, event, step_order
                    )
                    logger.debug(f"Stored reasoning step: {reasoning_step.step_type}")
                except Exception as e:
                    logger.warning(f"Failed to store reasoning step: {e}")
                
                # Handle different event types and forward them directly
                if event.type == "response_chunk":
                    # Accumulate response content
                    chunk_content = event.data.get("content", "")
                    accumulated_response += chunk_content
                    
                    # Update assistant message in database
                    assistant_message.content = accumulated_response
                    db.commit()
                    
                    # Forward the Agent API event directly with additional info
                    agent_event = event.data.copy()
                    agent_event.update({
                        "type": "response_chunk",
                        "content": chunk_content,
                        "message_id": str(assistant_message.id),
                        "chat_id": str(chat_id)
                    })
                    yield agent_event
                
                elif event.type == "response":
                    # Final response
                    final_response = event.data.get("response", "")
                    if final_response:
                        accumulated_response = final_response
                        assistant_message.content = accumulated_response
                        db.commit()
                    
                    # Forward the Agent API event directly
                    agent_event = event.data.copy()
                    agent_event.update({
                        "type": "response",
                        "content": final_response,
                        "message_id": str(assistant_message.id),
                        "chat_id": str(chat_id)
                    })
                    yield agent_event
                
                elif event.type == "error":
                    # Handle errors
                    error_message = event.data.get("error", "An error occurred")
                    assistant_message.content = f"I apologize, but an error occurred: {error_message}"
                    db.commit()
                    
                    # Forward the Agent API error event
                    agent_event = event.data.copy()
                    agent_event.update({
                        "type": "error",
                        "error": error_message,
                        "message_id": str(assistant_message.id),
                        "chat_id": str(chat_id)
                    })
                    yield agent_event
                    break
                
                else:
                    # Forward all other Agent API events directly (log, plan, thinking, tool_call, etc.)
                    agent_event = event.data.copy()
                    agent_event.update({
                        "type": event.type,
                        "message_id": str(assistant_message.id),
                        "chat_id": str(chat_id)
                    })
                    yield agent_event
            
            # Ensure final content is saved
            if accumulated_response:
                assistant_message.content = accumulated_response
                db.commit()
                logger.info(f"Final assistant message saved: {len(accumulated_response)} characters")
            
            # Send final end event
            yield {
                "type": "end",
                "message_id": str(assistant_message.id),
                "chat_id": str(chat_id),
                "final_content": accumulated_response
            }
                    
        except Exception as e:
            logger.error(f"Error in send_message_stream: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            yield {
                "type": "error",
                "error": f"Service error: {str(e)}",
                "chat_id": str(chat_id)
            }
    
    async def upload_file_and_analyze(
        self,
        db: Session,
        user_id: int,
        chat_id: UUID,
        file_data: bytes,
        filename: str,
        message: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Upload file to agent API and optionally analyze it
        """
        try:
            # Get or ensure agent chat exists
            logger.info(f"Getting chat {chat_id} for user {user_id}")
            chat = ChatService.get_chat_by_id(db, chat_id, user_id)
            if not chat:
                raise ValueError(f"Chat {chat_id} not found")
            
            logger.info(f"Found chat: {chat_id}, current agent_chat_id: {chat.agent_chat_id}")
            
            # Get the agent chat ID
            logger.info("Calling ChatService.ensure_agent_chat...")
            agent_chat_id = await ChatService.ensure_agent_chat(db, chat)
            logger.info(f"✅ Got agent_chat_id: {agent_chat_id}")
            
            # Determine file type
            file_extension = filename.lower().split('.')[-1] if '.' in filename else 'unknown'
            logger.info(f"📄 File extension extracted: '{file_extension}' from filename: '{filename}'")
            
            # Upload file to agent API using the correct agent_chat_id
            upload_result = await self.agent_api.upload_file(
                user_id=str(user_id),
                chat_id=agent_chat_id,  # Use agent_chat_id instead of chat_id
                file_data=file_data,
                filename=filename,
                file_type=file_extension
            )
            
            # Save file to local database (without duplicate upload)
            from app.services.file_service import FileService
            
            file_service = FileService(db)
            saved_file = await file_service.save_file_to_database(
                user_id=user_id,
                chat_id=chat_id,
                file_data=file_data,
                filename=filename,
                mime_type=f"application/{file_extension}",
                agent_file_id=upload_result.get("file_id", ""),
                message_id=None
            )
            
            yield {
                "type": "file_uploaded",
                "file_id": upload_result.get("file_id"),
                "filename": filename,
                "status": upload_result.get("status"),
                "chat_id": str(chat_id)  # Return local chat_id for frontend
            }
            
            # If there's a message, analyze the file
            if message:
                async for event in self.send_message_stream(
                    db, user_id, chat_id, message
                ):
                    yield event
                    
        except Exception as e:
            logger.error(f"Error in upload_file_and_analyze: {e}")
            yield {
                "type": "error",
                "error": f"File upload error: {str(e)}",
                "chat_id": str(chat_id)
            }
    
    def get_message_with_reasoning(
        self,
        db: Session,
        message_id: UUID,
        user_id: int
    ) -> Optional[ChatMessage]:
        """
        Get a message with its reasoning steps
        """
        message = ChatService.get_message_by_id(db, message_id, user_id)
        if not message:
            return None
        
        # Load reasoning steps
        reasoning_steps = ReasoningService.get_reasoning_steps_for_message(db, message_id, user_id)
        
        # Attach reasoning steps (this would require updating the model relationship)
        # For now, we'll fetch them separately when needed
        return message
    
    async def get_available_tools(self) -> List[str]:
        """Get available tools from agent API"""
        try:
            tools_response = await self.agent_api.get_available_tools()
            return tools_response.get("tools", [])
        except Exception as e:
            logger.error(f"Failed to get available tools: {e}")
            return []
