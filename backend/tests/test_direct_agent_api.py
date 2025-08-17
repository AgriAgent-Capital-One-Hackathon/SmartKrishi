#!/usr/bin/env python3

import httpx
import asyncio
import logging
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_direct_agent_api():
    """Test the Agent API directly to see what it returns"""
    
    print("🔧 Testing Direct Agent API")
    print("=" * 50)
    
    base_url = "https://0c05cd19c9d5.ngrok-free.app"
    
    # Use a real chat_id from the logs
    form_data = {
        "q": "What are the best summer crops?",
        "user_id": "27",
        "chat_id": "chat_f43b29956f424cf5b3c46e323ed29398",  # From the logs
        "logs": "true"
    }
    
    print(f"📨 Sending to: {base_url}/ask_stream")
    print(f"📋 Data: {form_data}")
    
    timeout = httpx.Timeout(15.0, connect=5.0, read=10.0)
    
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            print("\n🔄 Starting request...")
            
            response = await client.post(f"{base_url}/ask_stream", data=form_data)
            
            print(f"📡 Response status: {response.status_code}")
            print(f"📋 Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                content = response.content
                print(f"📦 Response size: {len(content)} bytes")
                print(f"📄 Response content preview:")
                print(content[:1000].decode('utf-8', errors='ignore'))
                print("..." if len(content) > 1000 else "")
                
                # Try to parse as JSON
                try:
                    data = json.loads(content)
                    print(f"\n✅ Valid JSON response:")
                    print(f"  Type: {data.get('type', 'unknown')}")
                    print(f"  Keys: {list(data.keys())}")
                except json.JSONDecodeError as e:
                    print(f"\n❌ Invalid JSON: {e}")
            else:
                print(f"❌ Error response: {response.text}")
                
    except Exception as e:
        logger.exception(f"❌ Direct API test failed: {e}")
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_direct_agent_api())
