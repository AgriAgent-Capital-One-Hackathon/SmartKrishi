from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.user import User, AuthProvider
from app.schemas.user import MobileAuthInit, MobileAuthVerify, Token


router = APIRouter()

# For development, we'll use a simple OTP verification
# In production, integrate with Firebase Admin SDK or SMS service
DEMO_OTP = "123456"


@router.post("/mobile-init")
async def mobile_auth_init(
    mobile_data: MobileAuthInit, 
    db: Session = Depends(get_db)
):
    """
    Initialize mobile authentication - send OTP to phone number.
    This endpoint prepares for OTP verification.
    In production, integrate with Firebase Admin SDK or SMS provider.
    """
    try:
        # Validate phone number format
        if not mobile_data.phone_number.startswith('+'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number must include country code (e.g., +91xxxxxxxxxx)"
            )
        
        # Check if this is a new user or existing user
        existing_user = db.query(User).filter(
            User.phone_number == mobile_data.phone_number
        ).first()
        
        if existing_user:
            # Existing user - no username required
            return {
                "message": "OTP sent successfully",
                "is_new_user": False,
                "phone_number": mobile_data.phone_number,
                "demo_otp": DEMO_OTP  # Remove in production
            }
        else:
            # New user - username is required
            if not mobile_data.username:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username is required for new users"
                )
            
            return {
                "message": "OTP sent successfully",
                "is_new_user": True,
                "phone_number": mobile_data.phone_number,
                "demo_otp": DEMO_OTP  # Remove in production
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send OTP: {str(e)}"
        )


@router.post("/mobile-verify", response_model=Token)
async def mobile_auth_verify(
    verify_data: MobileAuthVerify,
    db: Session = Depends(get_db)
):
    """
    Verify OTP and authenticate user.
    For existing users, logs them in. For new users, you need to call mobile-signup.
    """
    try:
        # Verify OTP
        if verify_data.otp != DEMO_OTP:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP"
            )
        
        # Check if user exists
        user = db.query(User).filter(
            User.phone_number == verify_data.phone_number
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please complete signup first."
            )
            
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is disabled"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token_data = {"sub": user.phone_number, "auth_provider": "mobile"}
        access_token = create_access_token(
            data=token_data, 
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )


@router.post("/mobile-signup", response_model=Token)
async def mobile_signup(
    signup_data: dict,
    db: Session = Depends(get_db)
):
    """
    Complete mobile signup after OTP verification.
    Expects: {"phone_number": "+91xxxxxxxxxx", "username": "John Doe", "otp": "123456"}
    """
    try:
        phone_number = signup_data.get("phone_number")
        username = signup_data.get("username")
        otp = signup_data.get("otp")
        
        if not all([phone_number, username, otp]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number, username, and OTP are required"
            )
        
        # Verify OTP
        if otp != DEMO_OTP:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP"
            )
        
        # Check if user already exists
        existing_user = db.query(User).filter(
            User.phone_number == phone_number
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already exists with this phone number"
            )
        
        # Create new user
        new_user = User(
            name=username,
            phone_number=phone_number,
            auth_provider=AuthProvider.mobile,
            email=None,
            hashed_password=None
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token_data = {"sub": new_user.phone_number, "auth_provider": "mobile"}
        access_token = create_access_token(
            data=token_data,
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signup failed: {str(e)}"
        )
