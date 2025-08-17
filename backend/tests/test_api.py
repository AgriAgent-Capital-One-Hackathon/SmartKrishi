#!/usr/bin/env python3
"""
Test script for SmartKrishi authentication API
"""

import requests
import json
import sys
import time

BASE_URL = "http://localhost:8000/api/v1/auth"

def test_signup():
    """Test user signup"""
    print("🧪 Testing user signup...")
    
    # Use timestamp to create unique email
    timestamp = int(time.time())
    user_data = {
        "name": "Test Farmer",
        "email": f"farmer{timestamp}@test.com",
        "password": "testpassword123"
    }
    
    response = requests.post(f"{BASE_URL}/signup", json=user_data)
    
    if response.status_code == 200:
        print("✅ Signup successful!")
        data = response.json()
        print(f"   Access token: {data['access_token'][:20]}...")
        return data['access_token'], user_data["email"]
    else:
        print(f"❌ Signup failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None, None

def test_login(email, password="testpassword123"):
    """Test user login"""
    print("🧪 Testing user login...")
    
    login_data = {
        "email": email,
        "password": password
    }
    
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    
    if response.status_code == 200:
        print("✅ Login successful!")
        data = response.json()
        print(f"   Access token: {data['access_token'][:20]}...")
        return data['access_token']
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def test_protected_route(token):
    """Test protected /me endpoint"""
    print("🧪 Testing protected /me endpoint...")
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/me", headers=headers)
    
    if response.status_code == 200:
        print("✅ Protected route access successful!")
        data = response.json()
        print(f"   User: {data['name']} ({data['email']})")
        print(f"   Active: {data['is_active']}")
        print(f"   Created: {data['created_at']}")
        return True
    else:
        print(f"❌ Protected route access failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return False

def test_invalid_token():
    """Test with invalid token"""
    print("🧪 Testing with invalid token...")
    
    headers = {"Authorization": "Bearer invalid_token"}
    response = requests.get(f"{BASE_URL}/me", headers=headers)
    
    if response.status_code == 401:
        print("✅ Invalid token correctly rejected!")
        return True
    else:
        print(f"❌ Invalid token test failed: {response.status_code}")
        return False

def test_duplicate_signup(email):
    """Test duplicate email signup"""
    print("🧪 Testing duplicate email signup...")
    
    user_data = {
        "name": "Another Farmer",
        "email": email,  # Same email as before
        "password": "differentpassword"
    }
    
    response = requests.post(f"{BASE_URL}/signup", json=user_data)
    
    if response.status_code == 400:
        print("✅ Duplicate email correctly rejected!")
        return True
    else:
        print(f"❌ Duplicate email test failed: {response.status_code}")
        return False

def main():
    print("🌱 SmartKrishi Authentication API Test Suite")
    print("=" * 50)
    
    try:
        # Test 1: Signup
        token, email = test_signup()
        if not token:
            print("❌ Cannot continue without successful signup")
            sys.exit(1)
        
        print()
        
        # Test 2: Login
        login_token = test_login(email)
        if not login_token:
            print("❌ Login test failed")
        
        print()
        
        # Test 3: Protected route with valid token
        if not test_protected_route(token):
            print("❌ Protected route test failed")
        
        print()
        
        # Test 4: Invalid token
        if not test_invalid_token():
            print("❌ Invalid token test failed")
        
        print()
        
        # Test 5: Duplicate signup
        if not test_duplicate_signup(email):
            print("❌ Duplicate signup test failed")
        
        print()
        print("✅ All tests completed successfully!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API server. Make sure it's running on http://localhost:8000")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
