from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import verify_token
from app.models.user import User, AuthProvider
from app.schemas.user import User as UserSchema

# HTTP Bearer token scheme
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserSchema:
    """
    Dependency to get current authenticated user from JWT token.
    Supports both email and mobile authentication.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verify token and get payload
    token_data = verify_token(credentials.credentials)
    if token_data is None:
        raise credentials_exception
    
    # Handle both email and mobile authentication
    user = None
    if isinstance(token_data, dict):
        # New token format with auth_provider info
        subject = token_data.get("sub")
        auth_provider = token_data.get("auth_provider", "email")
        
        if auth_provider == "mobile":
            # Look up user by phone number
            user = db.query(User).filter(User.phone_number == subject).first()
        else:
            # Look up user by email (default)
            user = db.query(User).filter(User.email == subject).first()
    else:
        # Legacy token format (email only)
        user = db.query(User).filter(User.email == token_data).first()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return UserSchema.model_validate(user)


def get_current_active_user(
    current_user: UserSchema = Depends(get_current_user)
) -> UserSchema:
    """
    Dependency to get current active user.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user
