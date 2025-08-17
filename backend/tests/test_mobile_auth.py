#!/usr/bin/env python3
"""
Test script for Firebase OTP authentication
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_URL = "http://localhost:8000"

def test_mobile_auth_flow():
    """Test the complete mobile authentication flow"""
    
    # Test data
    phone_number = "+919876543210"  # Test phone number
    username = "Test User"
    demo_otp = "123456"
    
    print("🧪 Testing Mobile Authentication Flow")
    print("=" * 50)
    
    # Step 1: Initialize mobile auth
    print("1. Initializing mobile auth...")
    init_response = requests.post(
        f"{BASE_URL}/api/v1/auth/mobile-init",
        json={
            "phone_number": phone_number,
            "username": username
        }
    )
    
    print(f"Status: {init_response.status_code}")
    print(f"Response: {init_response.json()}")
    
    if init_response.status_code != 200:
        print("❌ Mobile auth init failed")
        return
    
    init_data = init_response.json()
    is_new_user = init_data.get("is_new_user", True)
    
    # Step 2: Verify OTP / Complete signup
    if is_new_user:
        print("\n2. Testing signup flow...")
        endpoint = f"{BASE_URL}/api/v1/auth/mobile-signup"
        payload = {
            "phone_number": phone_number,
            "username": username,
            "firebase_token": demo_otp
        }
    else:
        print("\n2. Testing login flow...")
        endpoint = f"{BASE_URL}/api/v1/auth/mobile-verify"
        payload = {
            "phone_number": phone_number,
            "otp": demo_otp
        }
    
    verify_response = requests.post(endpoint, json=payload)
    print(f"Status: {verify_response.status_code}")
    print(f"Response: {verify_response.json()}")
    
    if verify_response.status_code != 200:
        print("❌ OTP verification failed")
        return
    
    # Step 3: Test authenticated endpoint
    verify_data = verify_response.json()
    access_token = verify_data.get("access_token")
    
    if access_token:
        print("\n3. Testing authenticated endpoint...")
        me_response = requests.get(
            f"{BASE_URL}/api/v1/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        print(f"Status: {me_response.status_code}")
        print(f"Response: {me_response.json()}")
        
        if me_response.status_code == 200:
            print("✅ Mobile authentication flow completed successfully!")
        else:
            print("❌ Authentication verification failed")
    else:
        print("❌ No access token received")

if __name__ == "__main__":
    test_mobile_auth_flow()
