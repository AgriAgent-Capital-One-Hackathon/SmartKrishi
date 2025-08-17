#!/usr/bin/env python3
"""
Simple test script to verify the chat API is working
"""
import requests
import json

def test_chat_api():
    base_url = "http://localhost:8000/api/v1"
    
    # First, let's test if the server is running
    try:
        response = requests.get(f"{base_url}/../")
        print(f"✅ Server is running: {response.json()}")
    except Exception as e:
        print(f"❌ Server connection failed: {e}")
        return
    
    # Test if we can access the suggestions endpoint without auth
    try:
        response = requests.get(f"{base_url}/chat/suggestions")
        print(f"📋 Suggestions endpoint response: {response.status_code}")
        if response.status_code == 401:
            print("🔒 Authentication required (expected)")
        else:
            print(f"Response: {response.json()}")
    except Exception as e:
        print(f"❌ Suggestions test failed: {e}")

if __name__ == "__main__":
    test_chat_api()
