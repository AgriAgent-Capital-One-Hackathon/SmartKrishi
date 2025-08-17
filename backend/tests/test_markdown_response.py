#!/usr/bin/env python3
"""
Test markdown responses from the chat API
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

def test_markdown_response():
    """Test that the chat API returns well-formatted markdown responses"""
    token = get_auth_token()
    if not token:
        print("❌ Failed to get authentication token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test with a question that should return markdown formatting
    print("🧪 Testing markdown response formatting...")
    chat_data = {
        "message": "Give me a detailed guide on wheat farming with proper formatting, headers, and bullet points",
        "chat_history": []
    }
    response = requests.post(f"{BASE_URL}/chat/ask", json=chat_data, headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        chat_response = response.json()["response"]
        print(f"✅ Chat response length: {len(chat_response)} characters")
        print("\n📋 Full Response (showing markdown formatting):")
        print("=" * 60)
        print(chat_response)
        print("=" * 60)
        
        # Check for markdown elements
        markdown_elements = {
            "Headers": any(line.startswith('#') for line in chat_response.split('\n')),
            "Bold text": '**' in chat_response,
            "Bullet points": '- ' in chat_response or '• ' in chat_response,
            "Numbered lists": any(line.strip().startswith(f"{i}.") for i in range(1, 10) for line in chat_response.split('\n')),
            "Emojis": any(ord(char) > 127 for char in chat_response if ord(char) < 1000),
        }
        
        print(f"\n🔍 Markdown Elements Found:")
        for element, found in markdown_elements.items():
            print(f"  {'✅' if found else '❌'} {element}")
            
    else:
        print(f"❌ Error: {response.text}")

if __name__ == "__main__":
    test_markdown_response()
