#!/usr/bin/env python3
"""
Quick SMS Test - Manual test for the specific phone number
"""

import requests
import json

# Configuration
API_BASE_URL = "http://127.0.0.1:8000/api/v1"
PHONE_NUMBER = "+919933526787"
EMAIL = "test@example.com"
PASSWORD = "password123"

def main():
    print("🚀 Quick SMS Fallback Test")
    print(f"📱 Testing with phone: {PHONE_NUMBER}")
    print("="*50)
    
    # Get token first
    print("1. 🔐 Getting authentication token...")
    token_response = requests.post(f"{API_BASE_URL}/auth/token", data={
        "username": EMAIL,
        "password": PASSWORD
    }, headers={"Content-Type": "application/x-www-form-urlencoded"})
    
    if token_response.status_code != 200:
        print(f"❌ Authentication failed: {token_response.status_code}")
        return
    
    token = token_response.json()["access_token"]
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("✅ Got token successfully")
    
    # Test health endpoint
    print("\n2. 🏥 Testing health endpoint...")
    health_response = requests.get(f"{API_BASE_URL}/fallback/health", headers=headers)
    
    if health_response.status_code == 200:
        print("✅ Health check successful")
        print(json.dumps(health_response.json(), indent=2))
    else:
        print(f"❌ Health check failed: {health_response.status_code}")
        print(health_response.text)
    
    # Update settings with your phone number
    print(f"\n3. ⚙️ Setting up fallback phone ({PHONE_NUMBER})...")
    settings_response = requests.put(f"{API_BASE_URL}/fallback/settings", 
                                     json={
                                         "fallback_phone": PHONE_NUMBER,
                                         "auto_fallback_enabled": True
                                     },
                                     headers=headers)
    
    if settings_response.status_code == 200:
        print("✅ Settings updated successfully")
    else:
        print(f"❌ Settings update failed: {settings_response.status_code}")
        print(settings_response.text)
    
    # Try to send a test SMS (this might fail due to SMS service configuration)
    print(f"\n4. 📱 Testing SMS send to {PHONE_NUMBER}...")
    sms_response = requests.post(f"{API_BASE_URL}/fallback/sms/send",
                                 json={
                                     "phone_number": PHONE_NUMBER,
                                     "message": "🧪 Test SMS from SmartKrishi Fallback System"
                                 },
                                 headers=headers)
    
    if sms_response.status_code == 200:
        print("✅ SMS sent successfully!")
        print("📱 Check your phone for the test message")
    else:
        print(f"⚠️ SMS send failed: {sms_response.status_code}")
        print(f"📝 This is expected if SMS service is not configured")
        print(sms_response.text)
    
    # Test fallback activation
    print("\n5. 🔄 Testing fallback activation...")
    activation_response = requests.post(f"{API_BASE_URL}/fallback/activate", headers=headers)
    
    if activation_response.status_code == 200:
        result = activation_response.json()
        print("✅ Fallback activated successfully")
        print(f"📋 Session ID: {result.get('session_id')}")
    else:
        print(f"⚠️ Fallback activation failed: {activation_response.status_code}")
        print(activation_response.text)
    
    print("\n🎉 Test completed!")
    print(f"💡 Your phone number {PHONE_NUMBER} is now configured for SMS fallback")

if __name__ == "__main__":
    main()
