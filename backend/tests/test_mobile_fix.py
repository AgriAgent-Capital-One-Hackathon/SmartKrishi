#!/usr/bin/env python3
"""
Test script for mobile authentication fixes
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_mobile_init():
    """Test mobile authentication initialization"""
    url = f"{BASE_URL}/api/v1/auth/mobile-init"
    
    # Test with new user
    data = {
        "phone_number": "+918927087113",
        "username": "Test User"
    }
    
    print("Testing mobile-init endpoint...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get("status") == "ready":
                print("✅ Mobile initialization successful!")
                return True
            else:
                print("❌ Unexpected response format")
                return False
        else:
            print("❌ Mobile initialization failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_mobile_verify():
    """Test mobile OTP verification"""
    url = f"{BASE_URL}/api/v1/auth/mobile-verify"
    
    # Test with demo OTP
    data = {
        "phone_number": "+918927087113",
        "otp": "123456"
    }
    
    print("\nTesting mobile-verify endpoint...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get("access_token"):
                print("✅ Mobile verification successful!")
                return True
            else:
                print("❌ No access token in response")
                return False
        elif response.status_code == 404:
            print("ℹ️  User not found (expected for new user)")
            return True
        else:
            print("❌ Mobile verification failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_mobile_signup():
    """Test mobile signup for new user"""
    url = f"{BASE_URL}/api/v1/auth/mobile-signup"
    
    # Test with demo OTP and new phone number
    data = {
        "phone_number": "+919876543210",  # Different phone number
        "username": "New Test User",
        "firebase_token": "123456"
    }
    
    print("\nTesting mobile-signup endpoint...")
    print(f"URL: {url}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get("access_token"):
                print("✅ Mobile signup successful!")
                return True
            else:
                print("❌ No access token in response")
                return False
        else:
            print("❌ Mobile signup failed!")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔥 Testing Mobile Authentication Fixes")
    print("=" * 50)
    
    # Test mobile initialization
    init_success = test_mobile_init()
    
    # Test mobile verification (should fail for new user)
    verify_success = test_mobile_verify()
    
    # Test mobile signup
    signup_success = test_mobile_signup()
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"Mobile Init: {'✅ PASS' if init_success else '❌ FAIL'}")
    print(f"Mobile Verify: {'✅ PASS' if verify_success else '❌ FAIL'}")
    print(f"Mobile Signup: {'✅ PASS' if signup_success else '❌ FAIL'}")
    
    if all([init_success, verify_success, signup_success]):
        print("\n🎉 All tests passed! Mobile authentication is working.")
    else:
        print("\n🚨 Some tests failed. Check the output above for details.")
