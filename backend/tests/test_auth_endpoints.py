#!/usr/bin/env python3
"""
Test script for authenticated endpoints with real user credentials.
This script will test the streaming chat endpoints with proper authentication.
"""
import asyncio
import json
import getpass
import httpx
from typing import Optional

BASE_URL = "http://localhost:8000"

class AuthenticatedTester:
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
                    print(f"✅ Login successful!")
                    return True
                else:
                    print(f"❌ Login failed: {response.status_code} {response.text}")
                    return False
            except Exception as e:
                print(f"❌ Login error: {e}")
                return False
    
    async def test_health(self):
        """Test health endpoint"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/health")
            print(f"Health check: {response.status_code} - {response.json()}")
    
    async def test_agent_tools(self):
        """Test agent-tools endpoint"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{BASE_URL}/api/v1/chat/agent-tools",
                    headers=self.headers
                )
                print(f"Agent tools: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"  Tools available: {len(data.get('tools', []))}")
                else:
                    print(f"  Error: {response.text}")
            except Exception as e:
                print(f"  Exception: {e}")
    
    async def test_agent_config(self):
        """Test agent-config endpoint"""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{BASE_URL}/api/v1/chat/agent-config",
                    headers=self.headers
                )
                print(f"Agent config: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    print(f"  Model: {data.get('preferred_model', 'N/A')}")
                    print(f"  Tools: {data.get('default_tools', [])}")
                else:
                    print(f"  Error: {response.text}")
            except Exception as e:
                print(f"  Exception: {e}")
    
    async def test_streaming_chat(self, message: str):
        """Test streaming chat endpoint"""
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                payload = {
                    "message": message,
                    "chat_id": None,
                    "model": "gemini-2.0-flash-exp",
                    "tools": None,
                    "include_logs": True
                }
                
                print(f"Testing streaming chat with message: '{message}'")
                print("Payload:", json.dumps(payload, indent=2))
                
                async with client.stream(
                    "POST",
                    f"{BASE_URL}/api/v1/chat/send-stream",
                    json=payload,
                    headers={**self.headers, "Accept": "text/event-stream"}
                ) as response:
                    print(f"Stream response status: {response.status_code}")
                    
                    if response.status_code != 200:
                        error_text = await response.aread()
                        print(f"  Error body: {error_text.decode()}")
                        return
                    
                    print("Streaming events:")
                    event_count = 0
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            event_count += 1
                            data_str = line[6:]
                            try:
                                event_data = json.loads(data_str)
                                event_type = event_data.get('type', 'unknown')
                                print(f"  [{event_count}] {event_type}: {data_str[:100]}...")
                                
                                if event_type == "error":
                                    print(f"    ❌ Error: {event_data.get('error')}")
                                elif event_type == "end":
                                    print("    ✅ Stream completed")
                                    break
                            except json.JSONDecodeError as e:
                                print(f"  [JSON Error] {data_str[:100]}... (Error: {e})")
                    
                    print(f"Total events received: {event_count}")
                        
            except Exception as e:
                print(f"  Stream exception: {e}")

async def main():
    print("🧪 SmartKrishi Authentication & Streaming Test")
    print("=" * 50)
    
    # Get credentials
    email = input("Enter your email: ")
    password = input("Enter your password: ")
    
    tester = AuthenticatedTester()
    
    # Test login
    print("\n1. Testing login...")
    if not await tester.login(email, password):
        print("❌ Login failed. Exiting.")
        return
    
    # Test health
    print("\n2. Testing health endpoint...")
    await tester.test_health()
    
    # Test agent tools
    print("\n3. Testing agent tools endpoint...")
    await tester.test_agent_tools()
    
    # Test agent config  
    print("\n4. Testing agent config endpoint...")
    await tester.test_agent_config()
    
    # Test streaming
    print("\n5. Testing streaming chat...")
    test_message = input("Enter a test message (or press Enter for default): ").strip()
    if not test_message:
        test_message = "Hello, can you help me with farming advice?"
    
    await tester.test_streaming_chat(test_message)
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    asyncio.run(main())
