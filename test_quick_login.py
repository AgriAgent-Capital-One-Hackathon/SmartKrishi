#!/usr/bin/env python3
"""
Quick test to verify that login works and create demo user if needed
"""

import asyncio
import aiohttp
import json
from datetime import datetime


async def test_login():
    """Test login with demo credentials"""
    base_url = "http://127.0.0.1:8000/api/v1"
    
    async with aiohttp.ClientSession() as session:
        # Try to login with demo user
        print("🔐 Testing login with demo@example.com...")
        
        login_data = {
            "email": "demo@example.com",
            "password": "password"
        }
        
        try:
            async with session.post(
                f"{base_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Login successful!")
                    print(f"Token: {data.get('access_token', 'N/A')[:20]}...")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Login failed: {response.status}")
                    print(f"Error: {error_text}")
                    
                    # Try to create user by signing up
                    print("\n📝 Trying to create demo user via signup...")
                    
                    signup_data = {
                        "name": "Demo User",
                        "email": "demo@example.com",
                        "password": "password"
                    }
                    
                    async with session.post(
                        f"{base_url}/auth/signup",
                        json=signup_data,
                        headers={"Content-Type": "application/json"}
                    ) as signup_response:
                        if signup_response.status == 200:
                            signup_data = await signup_response.json()
                            print("✅ Demo user created via signup!")
                            print(f"Token: {signup_data.get('access_token', 'N/A')[:20]}...")
                            return True
                        else:
                            signup_error = await signup_response.text()
                            print(f"❌ Signup also failed: {signup_response.status}")
                            print(f"Error: {signup_error}")
                            return False
                            
        except Exception as e:
            print(f"❌ Connection error: {e}")
            print("💡 Make sure the backend server is running!")
            return False


async def test_health():
    """Test health endpoint"""
    base_url = "http://127.0.0.1:8000/api/v1"
    
    # First login
    async with aiohttp.ClientSession() as session:
        login_data = {
            "email": "demo@example.com",
            "password": "password"
        }
        
        async with session.post(f"{base_url}/auth/login", json=login_data) as response:
            if response.status != 200:
                print("❌ Cannot test health - login failed")
                return False
                
            data = await response.json()
            token = data.get("access_token")
            
        # Test health endpoint
        headers = {"Authorization": f"Bearer {token}"}
        async with session.get(f"{base_url}/fallback/health", headers=headers) as response:
            if response.status == 200:
                health_data = await response.json()
                print("✅ Health check successful!")
                print(json.dumps(health_data, indent=2))
                return True
            else:
                error_text = await response.text()
                print(f"❌ Health check failed: {response.status}")
                print(f"Error: {error_text}")
                return False


async def main():
    """Main test function"""
    print("🚀 Quick Login and Health Test")
    print("=" * 40)
    
    # Test login
    login_success = await test_login()
    
    if login_success:
        print("\n🏥 Testing health endpoint...")
        await test_health()
    else:
        print("\n💡 Fix the login issue first, then test health endpoint")
        

if __name__ == "__main__":
    asyncio.run(main())
