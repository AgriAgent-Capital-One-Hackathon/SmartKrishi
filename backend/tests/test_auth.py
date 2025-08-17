#!/usr/bin/env python3
"""
Simple test script to verify authentication endpoints
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_signup():
    """Test user signup"""
    print("Testing signup...")
    data = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/signup", json=data)
    print(f"Signup Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Signup Response: {response.json()}")
        return response.json()
    else:
        print(f"Signup Error: {response.text}")
        return None

def test_login():
    """Test user login"""
    print("\nTesting login...")
    data = {
        "email": "test@example.com",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=data)
    print(f"Login Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Login Response: {response.json()}")
        return response.json()
    else:
        print(f"Login Error: {response.text}")
        return None

def test_me(token):
    """Test /auth/me endpoint"""
    print("\nTesting /auth/me...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    print(f"Me Status: {response.status_code}")
    if response.status_code == 200:
        print(f"Me Response: {response.json()}")
        return response.json()
    else:
        print(f"Me Error: {response.text}")
        return None

if __name__ == "__main__":
    print("🌱 SmartKrishi Authentication Test")
    print("=" * 40)
    
    # Test signup (this might fail if user already exists)
    signup_result = test_signup()
    
    # Test login
    login_result = test_login()
    
    if login_result and "access_token" in login_result:
        # Test /auth/me endpoint
        test_me(login_result["access_token"])
    
    print("\n" + "=" * 40)
    print("Authentication test completed!")
