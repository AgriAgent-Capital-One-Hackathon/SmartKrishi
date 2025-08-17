import httpx
import json
import asyncio
import logging
from typing import AsyncGenerator, Dict, Any, Optional, List
from decouple import config
from uuid import UUID

from app.schemas.reasoning import StreamingEvent, StreamingStatus

logger = logging.getLogger(__name__)

class AgentAPIService:
    def __init__(self):
        self.base_url = config("AGENT_API_BASE_URL")
        if not self.base_url:
            raise ValueError("AGENT_API_BASE_URL not set in environment variables")
        
        self.timeout = httpx.Timeout(60.0, connect=30.0)
        
    async def create_chat(self, user_id: str, chat_name: str) -> Dict[str, Any]:
        """Create a new chat in the agent API"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/users/{user_id}/chats",
                    data={"chat_name": chat_name}
                )
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Failed to create chat in agent API: {e}")
                raise

    async def get_user_chats(self, user_id: str) -> Dict[str, Any]:
        """Get all chats for a user from agent API"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(f"{self.base_url}/users/{user_id}/chats")
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Failed to get chats from agent API: {e}")
                raise

    async def delete_chat(self, user_id: str, chat_id: str) -> Dict[str, Any]:
        """Delete a chat in the agent API"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.delete(f"{self.base_url}/users/{user_id}/chats/{chat_id}")
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Failed to delete chat in agent API: {e}")
                raise

    async def stream_message(
        self,
        user_id: str,
        chat_id: str,
        message: str,
        model: str = "gemini-2.5-flash",
        tools: Optional[List[str]] = None,
        include_logs: bool = True
    ) -> AsyncGenerator[StreamingEvent, None]:
        """Stream a message to the agent API and yield events"""
        # Use shorter timeout for streaming to prevent hanging
        timeout = httpx.Timeout(30.0, connect=5.0, read=10.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            try:
                # Prepare form data
                form_data = {
                    "q": message,
                    "user_id": user_id,
                    "chat_id": chat_id,
                    "logs": str(include_logs).lower()
                }
                
                if tools:
                    form_data["include_tools"] = ",".join(tools)
                
                # Make streaming request
                logger.info(f"Starting streaming request to {self.base_url}/ask_stream with data: {form_data}")
                async with client.stream(
                    "POST",
                    f"{self.base_url}/ask_stream",
                    data=form_data
                ) as response:
                    logger.info(f"Got streaming response: {response.status_code}, headers: {dict(response.headers)}")
                    response.raise_for_status()
                    
                    # Check content type
                    content_type = response.headers.get('content-type', '')
                    logger.info(f"Response content-type: {content_type}")
                    
                    if 'application/json' in content_type:
                        # Handle as NDJSON (newline-delimited JSON) streaming response
                        logger.info("Detected JSON response, reading as NDJSON stream...")
                        
                        line_count = 0
                        async for line in response.aiter_lines():
                            line_count += 1
                            logger.debug(f"Received NDJSON line {line_count}: {repr(line)}")
                            
                            if not line.strip():
                                continue
                                
                            try:
                                # Parse each line as a separate JSON object
                                event_data = json.loads(line)
                                logger.debug(f"Parsed NDJSON event: {event_data.get('type', 'unknown')}")
                                
                                yield StreamingEvent(
                                    type=event_data.get("type", "unknown"),
                                    data=event_data
                                )
                                
                                # Check for completion
                                if event_data.get('type') == 'response':
                                    logger.info("Received final response event")
                                    break
                                    
                            except json.JSONDecodeError as e:
                                logger.warning(f"Failed to parse NDJSON line {line_count}: {e}, data: {repr(line)}")
                                continue
                        
                        logger.info(f"Completed NDJSON streaming after {line_count} lines")
                        return
                    
                    line_count = 0
                    logger.info("Starting to iterate over response lines...")
                    
                    async for line in response.aiter_lines():
                        line_count += 1
                        logger.info(f"Received line {line_count}: {repr(line)}")
                        
                        if not line.strip():
                            logger.debug(f"Skipping empty line {line_count}")
                            continue
                        
                        # Parse SSE format
                        if line.startswith("data: "):
                            data_str = line[6:]  # Remove "data: " prefix
                            logger.debug(f"Processing SSE data: {data_str}")
                            
                            if data_str.strip() == "[DONE]":
                                logger.info("Received [DONE] marker, ending stream")
                                break
                                
                            try:
                                event_data = json.loads(data_str)
                                logger.debug(f"Parsed event: {event_data.get('type', 'unknown')}")
                                yield StreamingEvent(
                                    type=event_data.get("type", "unknown"),
                                    data=event_data
                                )
                            except json.JSONDecodeError as e:
                                logger.warning(f"Failed to parse streaming event: {e}, data: {data_str}")
                                continue
                        else:
                            logger.debug(f"Non-SSE line: {line}")
                    
                    logger.info(f"Completed streaming request after {line_count} lines")
                                
            except httpx.HTTPError as e:
                logger.error(f"HTTP error in agent API streaming: {e}")
                yield StreamingEvent(
                    type="error",
                    data={"error": f"Network error: {str(e)}"}
                )
            except Exception as e:
                logger.error(f"Unexpected error in agent API streaming: {e}")
                yield StreamingEvent(
                    type="error",
                    data={"error": f"Unexpected error: {str(e)}"}
                )

    async def upload_file(
        self,
        user_id: str,
        chat_id: str,
        file_data: bytes,
        filename: str,
        file_type: str
    ) -> Dict[str, Any]:
        """Upload a file to the agent API"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                # Determine upload endpoint based on file type
                if file_type.lower() in ['pdf']:
                    endpoint = f"{self.base_url}/upload/pdf"
                elif file_type.lower() in ['jpg', 'jpeg', 'png', 'gif']:
                    endpoint = f"{self.base_url}/upload/image"
                elif file_type.lower() in ['docx']:
                    endpoint = f"{self.base_url}/upload/docx"
                elif file_type.lower() in ['xlsx']:
                    endpoint = f"{self.base_url}/upload/xlsx"
                else:
                    raise ValueError(f"Unsupported file type: {file_type}")
                
                files = {"file": (filename, file_data)}
                data = {
                    "user_id": user_id,
                    "chat_id": chat_id
                }
                
                response = await client.post(endpoint, files=files, data=data)
                response.raise_for_status()
                return response.json()
                
            except Exception as e:
                logger.error(f"Failed to upload file to agent API: {e}")
                raise

    async def get_chat_files(self, user_id: str, chat_id: str) -> Dict[str, Any]:
        """Get files for a specific chat from agent API"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(f"{self.base_url}/users/{user_id}/chats/{chat_id}/files")
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Failed to get chat files from agent API: {e}")
                raise

    async def get_available_tools(self) -> Dict[str, Any]:
        """Get available tools from agent API"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(f"{self.base_url}/tools")
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.error(f"Failed to get tools from agent API: {e}")
                raise

    def get_status_from_event_type(self, event_type: str) -> StreamingStatus:
        """Convert event type to streaming status"""
        status_map = {
            "log": "initializing",
            "plan": "thinking",
            "thinking": "thinking",
            "tool_call": "thinking",
            "response_chunk": "responding",
            "code_execution": "thinking",
            "url_context": "thinking",
            "response": "responding",
            "end": "complete",
            "error": "error"
        }
        
        status = status_map.get(event_type, "thinking")
        return StreamingStatus(
            status=status,
            current_step=event_type,
            progress=None  # Could be calculated based on step sequence
        )
