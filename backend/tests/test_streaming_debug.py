#!/usr/bin/env python3
"""
Comprehensive test for authenticated streaming endpoints.
This script will test the complete streaming flow with real authentication.
"""
import asyncio
import json
import getpass
import httpx
from typing import Optional

BASE_URL = "http://localhost:8000"

class StreamingTester:
    def __init__(self):
        self.token: Optional[str] = None
        self.headers: dict = {}
    
    async def login(self, email: str, password: str) -> bool:
        """Login and get authentication token"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{BASE_URL}/api/v1/auth/login",
                    json={
                        "email": email,
                        "password": password
                    },
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.token = data.get("access_token")
                    self.headers = {"Authorization": f"Bearer {self.token}"}
                    print(f"✅ Login successful! Token: {self.token[:20]}...")
                    return True
                else:
                    print(f"❌ Login failed: {response.status_code} {response.text}")
                    return False
            except Exception as e:
                print(f"❌ Login error: {e}")
                return False
    
    async def test_streaming_detailed(self, message: str):
        """Test streaming chat endpoint with detailed debugging"""
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                payload = {
                    "message": message,
                    "chat_id": None,
                    "model": "gemini-2.0-flash-exp",
                    "tools": None,
                    "include_logs": True
                }
                
                print(f"\n🧪 Testing streaming with message: '{message}'")
                print(f"📨 Payload: {json.dumps(payload, indent=2)}")
                print(f"🔐 Headers: {self.headers}")
                
                # Make the streaming request
                async with client.stream(
                    "POST",
                    f"{BASE_URL}/api/v1/chat/send-stream",
                    json=payload,
                    headers={**self.headers, "Accept": "text/event-stream"}
                ) as response:
                    print(f"📡 Stream response status: {response.status_code}")
                    print(f"📋 Response headers: {dict(response.headers)}")
                    
                    if response.status_code != 200:
                        error_text = await response.aread()
                        print(f"❌ Error body: {error_text.decode()}")
                        return
                    
                    print(f"🎯 Starting to read streaming events...")
                    event_count = 0
                    buffer = ""
                    
                    async for chunk in response.aiter_bytes():
                        chunk_str = chunk.decode('utf-8', errors='ignore')
                        buffer += chunk_str
                        print(f"📦 Raw chunk ({len(chunk_str)} bytes): {repr(chunk_str[:200])}")
                        
                        # Process complete lines
                        while '\n' in buffer:
                            line, buffer = buffer.split('\n', 1)
                            if line.strip():
                                print(f"📝 Processing line: {repr(line)}")
                                
                                if line.startswith('data: '):
                                    event_count += 1
                                    data_str = line[6:].strip()
                                    print(f"🎉 Event [{event_count}] data: {data_str}")
                                    
                                    try:
                                        event_data = json.loads(data_str)
                                        event_type = event_data.get('type', 'unknown')
                                        print(f"  ✅ Parsed event type: {event_type}")
                                        print(f"  📄 Full event: {json.dumps(event_data, indent=4)}")
                                        
                                        if event_type == "error":
                                            print(f"  ❌ Error event: {event_data.get('error')}")
                                        elif event_type == "end":
                                            print(f"  🏁 Stream completed")
                                            return
                                            
                                    except json.JSONDecodeError as e:
                                        print(f"  ❌ JSON Parse Error: {e}")
                                        print(f"  📄 Raw data: {repr(data_str)}")
                        
                        # Safety check - don't run forever
                        if event_count > 100:
                            print("⚠️ Too many events, stopping for safety")
                            break
                    
                    print(f"🏆 Streaming completed. Total events: {event_count}")
                        
            except Exception as e:
                print(f"💥 Stream exception: {type(e).__name__}: {e}")
                import traceback
                traceback.print_exc()

    async def test_non_streaming_endpoints(self):
        """Test related endpoints that should work"""
        async with httpx.AsyncClient() as client:
            # Test suggestions
            try:
                response = await client.get(f"{BASE_URL}/api/v1/chat/suggestions", headers=self.headers)
                print(f"📋 Suggestions: {response.status_code} - {len(response.json())} items")
            except Exception as e:
                print(f"❌ Suggestions error: {e}")
            
            # Test chats
            try:
                response = await client.get(f"{BASE_URL}/api/v1/chat/chats", headers=self.headers)
                chats = response.json()
                print(f"💬 Chats: {response.status_code} - {len(chats)} chats")
                return chats
            except Exception as e:
                print(f"❌ Chats error: {e}")
                return []

    async def test_reasoning_endpoints(self, chats):
        """Test reasoning endpoints for existing chats"""
        if not chats:
            print("⚠️ No chats to test reasoning endpoints")
            return
            
        chat_id = chats[0].get('id')
        if not chat_id:
            print("⚠️ No chat ID found")
            return
            
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{BASE_URL}/api/v1/chat/chats/{chat_id}/reasoning", 
                    headers=self.headers
                )
                print(f"🧠 Chat reasoning: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    steps = data.get('reasoning_steps', [])
                    print(f"  📊 Reasoning steps found: {len(steps)}")
                    for i, step in enumerate(steps[:3]):  # Show first 3
                        print(f"    [{i+1}] {step.get('step_type', 'unknown')} - {step.get('content', '')[:50]}...")
                else:
                    print(f"  ❌ Error: {response.text}")
            except Exception as e:
                print(f"❌ Reasoning error: {e}")

async def main():
    print("🧪 SmartKrishi Comprehensive Streaming Test")
    print("=" * 60)
    
    # Get credentials from user
    email = input("Enter your email: ").strip()
    if not email:
        print("❌ Email is required")
        return
        
    password = input("Enter your password: ")
    if not password:
        print("❌ Password is required") 
        return
    
    tester = StreamingTester()
    
    # Test login
    print("\n1️⃣ Testing authentication...")
    if not await tester.login(email, password):
        print("❌ Authentication failed. Cannot continue.")
        return
    
    # Test non-streaming endpoints first
    print("\n2️⃣ Testing non-streaming endpoints...")
    chats = await tester.test_non_streaming_endpoints()
    
    # Test reasoning endpoints
    print("\n3️⃣ Testing reasoning endpoints...")
    await tester.test_reasoning_endpoints(chats)
    
    # Test streaming
    print("\n4️⃣ Testing streaming chat...")
    test_message = input("Enter a test message (or press Enter for default): ").strip()
    if not test_message:
        test_message = "Hello, can you tell me about crop rotation?"
    
    await tester.test_streaming_detailed(test_message)
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    asyncio.run(main())
