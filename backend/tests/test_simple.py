#!/usr/bin/env python3
"""
Simple non-streaming test to verify backend flow
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_simple_message():
    """Test a simple non-streaming message to verify basic functionality"""
    
    # First, let's test the health endpoint
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health: {response.status_code} - {response.json()}")
    
    # Test suggestions (this should work without auth)
    response = requests.get(f"{BASE_URL}/api/v1/chat/suggestions")
    print(f"Suggestions: {response.status_code} - {len(response.json())} items")
    
    # For the streaming endpoint, we need to check if it requires auth
    # Let's try without auth first to see the error
    payload = {
        "message": "Hello, test message",
        "chat_id": None,
        "model": "gemini-2.0-flash-exp",
        "tools": None,
        "include_logs": True
    }
    
    response = requests.post(
        f"{BASE_URL}/api/v1/chat/send-stream", 
        json=payload,
        headers={"Accept": "text/event-stream"}
    )
    
    print(f"Streaming endpoint (no auth): {response.status_code}")
    if response.status_code == 401:
        print("✅ Endpoint correctly requires authentication")
    else:
        print(f"Response: {response.text[:200]}")

if __name__ == "__main__":
    test_simple_message()
