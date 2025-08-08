from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from app.models.user import AuthProvider


class UserBase(BaseModel):
    name: str


class UserCreate(UserBase):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserInDBBase(UserBase):
    id: int
    email: Optional[str] = None
    phone_number: Optional[str] = None
    auth_provider: AuthProvider
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class User(UserInDBBase):
    pass


class UserInDB(UserInDBBase):
    hashed_password: Optional[str] = None


# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
    phone_number: Optional[str] = None


# Login schema
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Mobile auth schemas
class MobileAuthInit(BaseModel):
    phone_number: str
    username: Optional[str] = None


class MobileAuthVerify(BaseModel):
    phone_number: str
    otp: str
