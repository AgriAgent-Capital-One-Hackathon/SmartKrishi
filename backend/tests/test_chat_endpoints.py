#!/usr/bin/env python3
"""
Test the chat API with authentication
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

def get_auth_token():
    """Get authentication token"""
    data = {
        "email": "test@example.com",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=data)
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def test_chat_endpoints():
    """Test chat API endpoints"""
    token = get_auth_token()
    if not token:
        print("❌ Failed to get authentication token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test suggestions endpoint
    print("🧪 Testing suggestions endpoint...")
    response = requests.get(f"{BASE_URL}/chat/suggestions", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        suggestions = response.json()["suggestions"]
        print(f"✅ Got {len(suggestions)} suggestions")
        for i, suggestion in enumerate(suggestions[:3]):
            print(f"  {i+1}. {suggestion['text']}")
    else:
        print(f"❌ Error: {response.text}")
    
    # Test chat ask endpoint
    print("\n🧪 Testing chat ask endpoint...")
    chat_data = {
        "message": "Hello! I'm a farmer from India. Can you help me with crop management?",
        "chat_history": []
    }
    response = requests.post(f"{BASE_URL}/chat/ask", json=chat_data, headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        chat_response = response.json()["response"]
        print(f"✅ Chat response length: {len(chat_response)} characters")
        print(f"Response preview: {chat_response[:200]}...")
    else:
        print(f"❌ Error: {response.text}")

if __name__ == "__main__":
    test_chat_endpoints()
