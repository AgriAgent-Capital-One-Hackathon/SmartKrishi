#!/usr/bin/env python3
"""
Quick test script to verify file upload functionality
"""

import requests
import json
import io

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_PHONE = "+1234567890"  # Demo user phone number

def test_file_upload():
    print("🧪 Testing file upload functionality...")
    
    # Step 1: Create a test user first
    print("1. Creating test user...")
    signup_response = requests.post(
        f"{BASE_URL}/api/v1/auth/signup",
        json={
            "name": "Test User",
            "email": "test@example.com", 
            "password": "testpass123"
        }
    )
    
    if signup_response.status_code == 200:
        print("✅ User created successfully")
        auth_data = signup_response.json()
        token = auth_data.get("access_token")
        user_id = auth_data.get("user", {}).get("id")
    elif signup_response.status_code == 400 and "already registered" in signup_response.text:
        # User exists, try to login
        print("User exists, logging in...")
        login_response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "testpass123"
            }
        )
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
            return False
            
        auth_data = login_response.json()
        token = auth_data.get("access_token")
        user_id = auth_data.get("user", {}).get("id")
    else:
        print(f"❌ User creation failed: {signup_response.status_code} - {signup_response.text}")
        return False
    
    if not token:
        print("❌ No token received")
        return False
        
    print(f"✅ Got token for user {user_id}")
    
    # Step 2: Create a chat
    print("2. Creating a chat...")
    headers = {"Authorization": f"Bearer {token}"}
    
    chat_response = requests.post(
        f"{BASE_URL}/api/v1/chat/",
        headers=headers,
        json={"title": "File Upload Test"}
    )
    
    if chat_response.status_code != 200:
        print(f"❌ Chat creation failed: {chat_response.status_code} - {chat_response.text}")
        return False
        
    chat_data = chat_response.json()
    chat_id = chat_data.get("id")
    print(f"✅ Created chat {chat_id}")
    
    # Step 3: Create a test file
    print("3. Creating test file...")
    test_content = b"This is a test file content for upload testing."
    test_file = io.BytesIO(test_content)
    test_file.name = "test.txt"
    
    # Step 4: Upload file
    print("4. Uploading file...")
    files = {
        'file': ('test.txt', test_file, 'text/plain')
    }
    
    upload_response = requests.post(
        f"{BASE_URL}/api/v1/chat/{chat_id}/upload-file",
        headers=headers,
        files=files
    )
    
    if upload_response.status_code != 200:
        print(f"❌ File upload failed: {upload_response.status_code} - {upload_response.text}")
        return False
        
    upload_data = upload_response.json()
    print(f"✅ File uploaded successfully: {upload_data}")
    
    # Step 5: Send message with file reference
    print("5. Sending message with file...")
    message_response = requests.post(
        f"{BASE_URL}/api/v1/chat/{chat_id}/messages/stream",
        headers=headers,
        json={
            "content": "Please analyze this uploaded file",
            "file_ids": [upload_data.get("id")]
        }
    )
    
    if message_response.status_code != 200:
        print(f"❌ Message sending failed: {message_response.status_code} - {message_response.text}")
        return False
        
    print("✅ Message sent successfully")
    return True

if __name__ == "__main__":
    success = test_file_upload()
    if success:
        print("\n🎉 All file upload tests passed!")
    else:
        print("\n💥 File upload tests failed!")
