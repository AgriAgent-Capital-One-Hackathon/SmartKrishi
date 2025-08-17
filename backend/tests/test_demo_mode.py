#!/usr/bin/env python3
"""
Quick test to verify mobile authentication demo mode
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_complete_mobile_auth_flow():
    """Test complete mobile authentication flow"""
    print("🧪 Testing Complete Mobile Authentication Flow")
    print("=" * 60)
    
    # Test data
    phone_number = "+919123456789"
    username = "Demo User"
    demo_otp = "123456"
    
    # Step 1: Initialize mobile auth
    print("Step 1: Initializing mobile authentication...")
    init_response = requests.post(f"{BASE_URL}/api/v1/auth/mobile-init", json={
        "phone_number": phone_number,
        "username": username
    })
    
    print(f"Init Response: {init_response.status_code}")
    if init_response.status_code == 200:
        init_data = init_response.json()
        print(f"✅ Is new user: {init_data.get('is_new_user')}")
        print(f"✅ Demo OTP: {init_data.get('demo_otp')}")
        
        is_new_user = init_data.get('is_new_user', True)
        
        # Step 2: Verify/Signup based on user status
        if is_new_user:
            print("\nStep 2: Testing mobile signup...")
            signup_response = requests.post(f"{BASE_URL}/api/v1/auth/mobile-signup", json={
                "phone_number": phone_number,
                "username": username,
                "firebase_token": demo_otp
            })
            
            print(f"Signup Response: {signup_response.status_code}")
            if signup_response.status_code == 200:
                signup_data = signup_response.json()
                print(f"✅ Signup successful! Token: {signup_data.get('access_token', 'N/A')[:50]}...")
                return True
            else:
                print(f"❌ Signup failed: {signup_response.json()}")
                return False
        else:
            print("\nStep 2: Testing mobile verification...")
            verify_response = requests.post(f"{BASE_URL}/api/v1/auth/mobile-verify", json={
                "phone_number": phone_number,
                "otp": demo_otp
            })
            
            print(f"Verify Response: {verify_response.status_code}")
            if verify_response.status_code == 200:
                verify_data = verify_response.json()
                print(f"✅ Verification successful! Token: {verify_data.get('access_token', 'N/A')[:50]}...")
                return True
            else:
                print(f"❌ Verification failed: {verify_response.json()}")
                return False
    else:
        print(f"❌ Initialization failed: {init_response.json()}")
        return False

if __name__ == "__main__":
    success = test_complete_mobile_auth_flow()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 Mobile authentication demo mode is working!")
        print("📱 Frontend should now work with OTP: 123456")
        print("🌐 Test at: http://localhost:5173/mobile-auth")
    else:
        print("🚨 Mobile authentication test failed!")
        
    print("\n💡 Instructions for frontend testing:")
    print("1. Go to http://localhost:5173/mobile-auth")
    print("2. Enter phone number: +919123456789")
    print("3. Enter name: Demo User")
    print("4. Click 'Send OTP'")
    print("5. Enter OTP: 123456")
    print("6. Should successfully authenticate!")
