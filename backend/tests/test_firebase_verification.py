#!/usr/bin/env python3
"""
Direct test for Firebase token verification in SMS fallback
"""

import requests
import json
import sys

def test_firebase_verification():
    """Test Firebase verification with a mock token"""
    
    # First login to get auth token
    print("1. Logging in...")
    login_response = requests.post("http://127.0.0.1:8000/api/v1/auth/login", json={
        "email": "fallback.test@smartkrishi.com", 
        "password": "FallbackTest123!"
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return False
    
    access_token = login_response.json()["access_token"]
    print("✅ Login successful")
    
    # Test phone verification with invalid token (to see what error we get)
    print("2. Testing phone verification endpoint...")
    verify_response = requests.post(
        "http://127.0.0.1:8000/api/v1/fallback/verify-phone",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"firebase_token": "invalid_token_for_testing"}
    )
    
    print(f"Status: {verify_response.status_code}")
    if verify_response.headers.get('content-type', '').startswith('application/json'):
        print(f"Response: {json.dumps(verify_response.json(), indent=2)}")
    else:
        print(f"Response text: {verify_response.text}")
    
    return True

if __name__ == "__main__":
    test_firebase_verification()
