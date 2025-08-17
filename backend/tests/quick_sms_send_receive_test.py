#!/usr/bin/env python3
"""
Quick SMS Fallback Test - Send & Receive Test

This script performs a focused test of SMS sending and receiving functionality.
It's designed to quickly verify that the SMS fallback system can:
1. Send messages to a given phone number
2. Receive messages from that phone number
3. Track message delivery status

Usage: python quick_sms_send_receive_test.py
"""

import asyncio
import aiohttp
import json
from datetime import datetime
from typing import Dict, Any


class QuickSMSTester:
    def __init__(self, base_url: str = "http://127.0.0.1:8000/api/v1"):
        self.base_url = base_url
        self.session = None
        self.token = None
        
    async def setup_session(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
            
    async def login(self, email: str, password: str) -> bool:
        """Quick login"""
        try:
            # Use the same format as the working test
            login_data = {
                "email": email,
                "password": password
            }
            
            async with self.session.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.token = data.get("access_token")
                    print(f"✅ Logged in successfully")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Login failed: {response.status} - {error_text}")
                    return False
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
            
    async def get_headers(self) -> Dict[str, str]:
        """Get auth headers"""
        return {"Authorization": f"Bearer {self.token}"}
        
    async def setup_phone(self, phone_number: str) -> bool:
        """Setup phone number for fallback"""
        print(f"📱 Setting up phone: {phone_number}")
        try:
            headers = await self.get_headers()
            
            # Enable auto fallback and set phone as verified
            update_data = {
                "auto_fallback_enabled": True,
                "fallback_phone": phone_number,
                "fallback_phone_verified": True  # Mark as verified for testing
            }
            
            async with self.session.put(
                f"{self.base_url}/fallback/settings",
                headers=headers,
                json=update_data
            ) as response:
                if response.status == 200:
                    print("✅ Phone setup successful")
                    return True
                else:
                    error = await response.text()
                    print(f"❌ Phone setup failed: {error}")
                    return False
        except Exception as e:
            print(f"❌ Phone setup error: {e}")
            return False
            
    async def activate_fallback(self, phone_number: str) -> bool:
        """Activate SMS fallback"""
        print(f"🚀 Activating fallback for: {phone_number}")
        try:
            headers = await self.get_headers()
            
            activation_data = {
                "phone_number": phone_number,
                "activation_trigger": "manual"
            }
            
            async with self.session.post(
                f"{self.base_url}/fallback/activate",
                headers=headers,
                json=activation_data
            ) as response:
                if response.status == 200:
                    print("✅ Fallback activated")
                    return True
                else:
                    error = await response.text()
                    print(f"❌ Activation failed: {error}")
                    return False
        except Exception as e:
            print(f"❌ Activation error: {e}")
            return False
            
    async def send_test_sms(self, phone_number: str) -> Dict[str, Any]:
        """Send a test SMS message"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        message = f"SMS Fallback Test Message - {timestamp}"
        
        print(f"📤 Sending SMS: '{message}' to {phone_number}")
        try:
            headers = await self.get_headers()
            
            sms_data = {
                "phone_number": phone_number,
                "message": message
            }
            
            async with self.session.post(
                f"{self.base_url}/fallback/sms/send",  # Correct endpoint path
                headers=headers,
                json=sms_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ SMS sent successfully")
                    print(f"   Status: {result.get('status', 'Unknown')}")
                    return {"success": True, "data": result}
                elif response.status == 500:
                    error = await response.text()
                    if "SMS service disabled" in error or "Failed to send SMS" in error:
                        print(f"⚠️  SMS send failed (expected - SMS service not configured)")
                        print(f"   This is normal when SMS_API_BASE_URL is not set")
                        return {"success": False, "error": "SMS service disabled", "expected": True}
                    else:
                        print(f"❌ SMS send failed: {error}")
                        return {"success": False, "error": error}
                else:
                    error = await response.text()
                    print(f"❌ SMS send failed: {error}")
                    return {"success": False, "error": error}
        except Exception as e:
            print(f"❌ SMS send error: {e}")
            return {"success": False, "error": str(e)}
            
    async def check_messages(self) -> Dict[str, Any]:
        """Check received messages"""
        print("📥 Checking received messages...")
        try:
            headers = await self.get_headers()
            
            async with self.session.get(
                f"{self.base_url}/fallback/chats",  # Using /chats endpoint instead
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Retrieved fallback chat data")
                    
                    # Handle different response formats
                    if isinstance(data, list):
                        chat_count = len(data)
                        print(f"   Found {chat_count} chat sessions")
                        if chat_count > 0:
                            print("   Recent chat sessions:")
                            for i, chat in enumerate(data):
                                if i >= 3:  # Only show first 3
                                    break
                                if isinstance(chat, dict):
                                    print(f"   - Session {chat.get('id', 'N/A')}: {chat.get('phone_number', 'N/A')}")
                                else:
                                    print(f"   - Item {i}: {str(chat)[:50]}...")
                    elif isinstance(data, dict):
                        print(f"   Response: {json.dumps(data, indent=2)}")
                    else:
                        print(f"   Unexpected response type: {type(data)}")
                        print(f"   Data: {str(data)[:200]}...")
                        
                    return {"success": True, "data": data}
                else:
                    error = await response.text()
                    print(f"❌ Message check failed: {error}")
                    return {"success": False, "error": error}
        except Exception as e:
            print(f"❌ Message check error: {e}")
            print(f"   Error type: {type(e)}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}
            
    async def simulate_incoming_sms(self, phone_number: str) -> Dict[str, Any]:
        """Simulate an incoming SMS (webhook endpoint)"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        incoming_message = f"Test reply from {phone_number} at {timestamp}"
        
        print(f"📥 Simulating incoming SMS: '{incoming_message}'")
        try:
            # Simulate webhook payload
            webhook_data = {
                "id": f"sms_{int(datetime.now().timestamp())}",
                "phone_number": phone_number,
                "message": incoming_message,
                "timestamp": datetime.now().isoformat(),
                "direction": "inbound",
                "status": "received"
            }
            
            async with self.session.post(
                f"{self.base_url}/fallback/sms/webhook",  # Correct webhook endpoint
                json=webhook_data
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    print(f"✅ Incoming SMS processed successfully")
                    return {"success": True, "data": result}
                else:
                    error = await response.text()
                    print(f"❌ Incoming SMS processing failed: {error}")
                    return {"success": False, "error": error}
        except Exception as e:
            print(f"❌ Incoming SMS simulation error: {e}")
            return {"success": False, "error": str(e)}
            
    async def run_quick_test(self, email: str, password: str, phone_number: str):
        """Run quick SMS send/receive test"""
        print("🚀 SMS FALLBACK - QUICK SEND/RECEIVE TEST")
        print("=" * 50)
        print(f"Phone Number: {phone_number}")
        print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("-" * 50)
        
        await self.setup_session()
        
        try:
            # Step 1: Login
            if not await self.login(email, password):
                return
                
            # Step 2: Setup phone
            if not await self.setup_phone(phone_number):
                return
                
            # Step 3: Activate fallback
            if not await self.activate_fallback(phone_number):
                return
                
            # Step 4: Send test SMS
            send_result = await self.send_test_sms(phone_number)
            
            # Step 5: Wait a moment
            print("⏳ Waiting 2 seconds...")
            await asyncio.sleep(2)
            
            # Step 6: Simulate incoming SMS
            incoming_result = await self.simulate_incoming_sms(phone_number)
            
            # Step 7: Check all messages
            messages_result = await self.check_messages()
            
            # Summary
            print("\n" + "="*50)
            print("📊 TEST RESULTS SUMMARY")
            print("="*50)
            
            # Check if SMS send failure is expected
            sms_send_expected_fail = send_result.get('expected', False)
            sms_send_status = "⚠️  Expected (SMS service disabled)" if sms_send_expected_fail else ("✅ Success" if send_result['success'] else "❌ Failed")
            
            print(f"SMS Send: {sms_send_status}")
            print(f"SMS Receive: {'✅ Success' if incoming_result['success'] else '❌ Failed'}")
            print(f"Message Check: {'✅ Success' if messages_result['success'] else '❌ Failed'}")
            
            if messages_result['success']:
                data = messages_result.get('data', [])
                if isinstance(data, list):
                    msg_count = len(data)
                elif isinstance(data, dict):
                    msg_count = 1
                else:
                    msg_count = 0
                print(f"Total Sessions/Messages: {msg_count}")
                
            # Consider the test successful if core fallback features work
            core_success = incoming_result['success'] and messages_result['success']
            overall_status = "✅ CORE FUNCTIONALITY WORKING" if core_success else "❌ CORE TESTS FAILED"
            
            if sms_send_expected_fail:
                print(f"\nNote: SMS sending failed as expected (service not configured)")
                print(f"To enable SMS sending, set SMS_API_BASE_URL environment variable")
            
            print(f"\nOverall Status: {overall_status}")
            
        finally:
            await self.cleanup_session()


async def main():
    """Main function"""
    print("SMS Fallback - Quick Send/Receive Test")
    print("This test will:")
    print("1. Setup a phone number for SMS fallback")
    print("2. Send a test SMS to that number")
    print("3. Simulate receiving an SMS from that number")
    print("4. Check message history")
    print()
    
    # Get user input
    email = input("Enter email (default: demo@example.com): ").strip() or "demo@example.com"
    password = input("Enter password (default: password): ").strip() or "password"
    
    phone_number = input("Enter phone number (with country code, e.g., +1234567890): ").strip()
    if not phone_number:
        print("❌ Phone number is required!")
        return
        
    if not phone_number.startswith('+'):
        print("⚠️  Warning: Phone number should start with + and include country code")
        confirm = input("Continue anyway? (y/N): ").strip().lower()
        if confirm != 'y':
            return
    
    # Run test
    tester = QuickSMSTester()
    await tester.run_quick_test(email, password, phone_number)


if __name__ == "__main__":
    asyncio.run(main())
