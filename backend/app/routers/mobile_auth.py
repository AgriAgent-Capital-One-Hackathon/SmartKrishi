from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.db.database import get_db
from app.core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.models.user import User, AuthProvider
from app.schemas.user import MobileAuthInit, MobileAuthVerify, Token
from app.services.firebase_service import firebase_service


router = APIRouter()


@router.post("/mobile-init")
async def mobile_auth_init(
    mobile_data: MobileAuthInit, 
    db: Session = Depends(get_db)
):
    """
    Initialize mobile authentication - prepare for OTP verification.
    This endpoint validates the phone number and checks user existence.
    OTP is sent via Firebase on the frontend.
    """
    try:
        # Validate phone number format
        if not mobile_data.phone_number.startswith('+'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number must include country code (e.g., +91xxxxxxxxxx)"
            )
        
        # Additional phone number validation
        if len(mobile_data.phone_number) < 10 or len(mobile_data.phone_number) > 15:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number format"
            )
        
        # Check if this is a new user or existing user
        existing_user = db.query(User).filter(
            User.phone_number == mobile_data.phone_number
        ).first()
        
        if existing_user:
            # Existing user - no username required
            return {
                "message": "Ready to send OTP",
                "is_new_user": False,
                "phone_number": mobile_data.phone_number,
                "status": "ready"
            }
        else:
            # New user - username is required
            if not mobile_data.username or len(mobile_data.username.strip()) < 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username is required for new users and must be at least 2 characters"
                )
            
            return {
                "message": "Ready to send OTP",
                "is_new_user": True,
                "phone_number": mobile_data.phone_number,
                "status": "ready"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        # Debug print removed
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize mobile auth: {str(e)}"
        )


@router.post("/mobile-verify", response_model=Token)
async def mobile_auth_verify(
    verify_data: MobileAuthVerify,
    db: Session = Depends(get_db)
):
    """
    Verify Firebase ID token and authenticate user.
    For existing users, logs them in.
    """
    try:
        # Always verify Firebase ID token - no demo mode
        # Debug print removed
        firebase_user = firebase_service.verify_id_token(verify_data.otp)
        if not firebase_user:
            # Debug print removed
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Firebase token. Please try again with a fresh OTP."
            )
        
        # Extract phone number from Firebase user
        firebase_phone = firebase_user.get('phone_number')
        if not firebase_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number not found in Firebase token"
            )
        
        # Verify that the phone number matches the request
        if firebase_phone != verify_data.phone_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number mismatch"
            )
        
        # Check if user exists in our database
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
    Complete mobile signup after Firebase OTP verification.
    Expects: {"phone_number": "+91xxxxxxxxxx", "username": "John Doe", "firebase_token": "..."}
    """
    try:
        phone_number = signup_data.get("phone_number")
        username = signup_data.get("username")
        firebase_token = signup_data.get("firebase_token") or signup_data.get("otp")
        
        if not all([phone_number, username, firebase_token]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number, username, and Firebase token are required"
            )
        
        # Always verify Firebase token - no demo mode
        # Debug print removed
        firebase_user = firebase_service.verify_id_token(firebase_token)
        if not firebase_user:
            # Debug print removed
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Firebase token. Please try again with a fresh OTP."
            )
        
        # Extract phone number from Firebase user
        firebase_phone = firebase_user.get('phone_number')
        # Debug print removed
        if firebase_phone != phone_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Phone number mismatch: Firebase has {firebase_phone}, request has {phone_number}"
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
