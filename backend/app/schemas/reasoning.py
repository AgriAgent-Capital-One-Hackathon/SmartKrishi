from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class ReasoningStepBase(BaseModel):
    step_type: str
    step_order: int
    stage: Optional[str] = None
    content: Optional[str] = None
    tool_name: Optional[str] = None
    tool_args: Optional[str] = None
    tool_result: Optional[Dict[str, Any]] = None
    step_metadata: Optional[Dict[str, Any]] = None

class ReasoningStepCreate(ReasoningStepBase):
    message_id: UUID
    chat_id: UUID
    user_id: int

class ReasoningStep(ReasoningStepBase):
    id: UUID
    message_id: UUID
    chat_id: UUID
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AgentApiConfigBase(BaseModel):
    preferred_model: str = "gemini-2.5-flash"
    default_tools: Optional[List[str]] = None
    include_logs: bool = True

class AgentApiConfigCreate(AgentApiConfigBase):
    user_id: int

class AgentApiConfigUpdate(BaseModel):
    preferred_model: Optional[str] = None
    default_tools: Optional[List[str]] = None
    include_logs: Optional[bool] = None

class AgentApiConfig(AgentApiConfigBase):
    id: UUID
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Streaming event types from the agent API
class StreamingEvent(BaseModel):
    type: str
    data: Optional[Dict[str, Any]] = None

class LogEvent(StreamingEvent):
    stage: str
    message: Optional[str] = None

class PlanEvent(StreamingEvent):
    plan: Dict[str, Any]
    raw_response: Optional[str] = None

class ToolCallEvent(StreamingEvent):
    tool: str
    args: str
    result: Dict[str, Any]

class ThinkingEvent(StreamingEvent):
    content: str

class ResponseChunkEvent(StreamingEvent):
    content: str

class CodeExecutionEvent(StreamingEvent):
    code: str
    result: str
    output: Optional[str] = None

class UrlContextEvent(StreamingEvent):
    urls: List[str]
    content: str

class VisualizationEvent(StreamingEvent):
    image_data: str
    description: str

class GroundingEvent(StreamingEvent):
    queries: Optional[List[str]] = None
    sources: Optional[List[Dict[str, str]]] = None

class FinalResponseEvent(StreamingEvent):
    response: str
    grounding_metadata: Optional[Dict[str, Any]] = None

# Chat message with reasoning
class ChatMessageWithReasoning(BaseModel):
    id: UUID
    chat_id: UUID
    user_id: int
    role: str
    content: str
    message_type: str = 'text'
    file_url: Optional[str] = None
    created_at: datetime
    reasoning_steps: List[ReasoningStep] = []
    
    class Config:
        from_attributes = True

# Streaming response status
class StreamingStatus(BaseModel):
    status: str  # 'initializing', 'thinking', 'responding', 'complete', 'error'
    current_step: Optional[str] = None
    progress: Optional[float] = None
