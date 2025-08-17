#!/usr/bin/env python3

import requests
import json
import time

def test_with_proper_auth():
    """Test streaming with proper authentication and see server logs"""
    
    print("🧪 Testing Agent Chat Synchronization Fix")
    print("=" * 50)
    
    # Step 1: Login
    print("1️⃣ Logging in...")
    login_response = requests.post(
        "http://localhost:8000/api/v1/auth/login",
        json={"email": "abcdefgh@gmail.com", "password": "abcdefgh"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        return
    
    token = login_response.json()["access_token"]
    print(f"✅ Login successful, token: {token[:20]}...")
    
    # Step 2: First create a chat normally (non-streaming) to establish sync
    print("\n2️⃣ Creating a chat to establish Agent API sync...")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    chat_payload = {
        "message": "Hello, this is a test message to create a chat",
        "include_logs": False
    }
    
    try:
        chat_response = requests.post(
            "http://localhost:8000/api/v1/chat/send",
            json=chat_payload,
            headers=headers,
            timeout=30
        )
        
        if chat_response.status_code == 200:
            chat_data = chat_response.json()
            chat_id = chat_data.get("chat_id")
            print(f"✅ Chat created successfully: {chat_id}")
            print(f"📝 AI response: {chat_data.get('response', '')[:100]}...")
        else:
            print(f"❌ Chat creation failed: {chat_response.status_code}")
            print(chat_response.text)
            return
            
    except Exception as e:
        print(f"❌ Chat creation error: {e}")
        return
    
    # Step 3: Now test streaming with the existing chat
    print("\n3️⃣ Testing streaming with existing chat...")
    
    stream_payload = {
        "message": "What are the best summer crops for organic farming?",
        "chat_id": chat_id,
        "include_logs": True
    }
    
    print(f"📨 Sending streaming request: {stream_payload}")
    
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/chat/send-stream",
            json=stream_payload,
            headers=headers,
            stream=True,
            timeout=15  # Moderate timeout for streaming
        )
        
        print(f"📡 Response status: {response.status_code}")
        print(f"📋 Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("\n🎯 Streaming events:")
            event_count = 0
            start_time = time.time()
            
            for line in response.iter_lines(decode_unicode=True, chunk_size=1):
                if line.strip():
                    event_count += 1
                    elapsed = time.time() - start_time
                    print(f"  [{event_count:03d}] ({elapsed:.1f}s) {line}")
                    
                    # Parse to check for end event
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            if data.get("type") == "end":
                                print(f"✅ Received end event after {elapsed:.1f}s")
                                break
                        except json.JSONDecodeError:
                            pass
                    
                    if event_count >= 50:  # Safety limit
                        print("  ... (truncated after 50 events)")
                        break
                        
            if event_count == 0:
                print("❌ No events received!")
            else:
                print(f"\n✅ Streaming test completed: {event_count} events received")
                
        else:
            print(f"❌ Streaming request failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Streaming request error: {e}")

if __name__ == "__main__":
    test_with_proper_auth()
