from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class FallbackSettingsBase(BaseModel):
    auto_fallback_enabled: bool = False
    fallback_phone: Optional[str] = None
    fallback_phone_verified: bool = False


class FallbackSettingsUpdate(FallbackSettingsBase):
    pass


class FallbackSettings(FallbackSettingsBase):
    class Config:
        from_attributes = True


class FallbackSessionBase(BaseModel):
    phone_number: str
    fallback_type: str = "sms"
    activation_trigger: str  # auto, manual, network_failure


class FallbackSessionCreate(FallbackSessionBase):
    chat_id: Optional[UUID] = None


class FallbackSession(FallbackSessionBase):
    id: int
    user_id: int
    chat_id: Optional[UUID] = None
    is_active: bool
    activated_at: datetime
    deactivated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class FallbackMessageBase(BaseModel):
    phone_number: str
    message_type: str  # inbound, outbound, system
    content: str
    fallback_type: str = "sms"


class FallbackMessageCreate(FallbackMessageBase):
    session_id: int


class FallbackMessage(FallbackMessageBase):
    id: int
    session_id: int
    user_id: int
    sms_id: Optional[str] = None
    is_delivered: bool
    delivered_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# SMS API Integration Schemas
class SMSSendRequest(BaseModel):
    phone_number: str
    message: str


class SMSReceiveResponse(BaseModel):
    id: Optional[str] = None
    phone_number: Optional[str] = None
    message: Optional[str] = None
    timestamp: Optional[str] = None
    direction: Optional[str] = None
    status: Optional[str] = None


class FallbackHealthStatus(BaseModel):
    auto_fallback_enabled: bool
    fallback_active: bool
    network_quality: str  # good, poor, disconnected
    last_network_check: datetime
