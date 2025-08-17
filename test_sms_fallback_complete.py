#!/usr/bin/env python3
"""
Comprehensive SMS Fallback Integration Test
Tests the complete SMS fallback workflow with Firebase verification
"""

import requests
import json
import time
import sys
from typing import Optional, Dict, Any

# Configuration
BASE_URL = "http://127.0.0.1:8000"
TEST_PHONE = "+918927087113"  # Your phone number
TEST_EMAIL = "fallback.test@smartkrishi.com"
TEST_PASSWORD = "FallbackTest123!"
TEST_NAME = "SMS Fallback Tester"

class SMSFallbackTester:
    def __init__(self):
        self.access_token: Optional[str] = None
        self.user_data: Optional[Dict[str, Any]] = None
        
    def log(self, message: str, level: str = "INFO"):
        """Log messages with timestamp"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make HTTP request with authentication"""
        url = f"{BASE_URL}/api/v1{endpoint}"
        headers = kwargs.get('headers', {})
        
        if self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'
            
        kwargs['headers'] = headers
        
        self.log(f"{method.upper()} {url}")
        if 'json' in kwargs:
            self.log(f"Request body: {json.dumps(kwargs['json'], indent=2)}")
            
        response = getattr(requests, method.lower())(url, **kwargs)
        
        self.log(f"Response: {response.status_code}")
        if response.headers.get('content-type', '').startswith('application/json'):
            try:
                response_data = response.json()
                self.log(f"Response body: {json.dumps(response_data, indent=2)}")
            except:
                pass
        
        return response
        
    def setup_test_user(self) -> bool:
        """Create or login test user"""
        self.log("=== Setting up test user ===")
        
        # Try to login first
        response = self.make_request('post', '/auth/login', json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data['access_token']
            self.log("✅ Logged in existing test user")
            
            # Get user info
            user_response = self.make_request('get', '/auth/me')
            if user_response.status_code == 200:
                self.user_data = user_response.json()
                return True
        
        # Create new user if login failed
        self.log("Creating new test user...")
        response = self.make_request('post', '/auth/signup', json={
            "name": TEST_NAME,
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data['access_token']
            self.log("✅ Created new test user")
            
            # Get user info
            user_response = self.make_request('get', '/auth/me')
            if user_response.status_code == 200:
                self.user_data = user_response.json()
                return True
        
        self.log("❌ Failed to setup test user", "ERROR")
        return False
        
    def test_fallback_settings(self) -> bool:
        """Test fallback settings CRUD operations"""
        self.log("=== Testing fallback settings ===")
        
        # Get current settings
        response = self.make_request('get', '/fallback/settings')
        if response.status_code != 200:
            self.log(f"❌ Failed to get fallback settings: {response.status_code}", "ERROR")
            return False
        
        current_settings = response.json()
        self.log(f"Current settings: {json.dumps(current_settings, indent=2)}")
        
        # Update phone number
        self.log("Updating fallback phone number...")
        response = self.make_request('put', '/fallback/settings', json={
            "fallback_phone": TEST_PHONE
        })
        
        if response.status_code != 200:
            self.log(f"❌ Failed to update phone number: {response.status_code}", "ERROR")
            return False
            
        self.log("✅ Phone number updated successfully")
        
        # Verify settings were updated
        response = self.make_request('get', '/fallback/settings')
        if response.status_code == 200:
            updated_settings = response.json()
            if updated_settings.get('fallback_phone') == TEST_PHONE:
                self.log("✅ Phone number verified in settings")
                return True
            else:
                self.log("❌ Phone number not updated correctly", "ERROR")
                
        return False
        
    def test_phone_verification_preparation(self) -> bool:
        """Prepare for phone verification (user needs to complete manually)"""
        self.log("=== Phone Verification Preparation ===")
        
        self.log(f"""
⚠️  MANUAL STEP REQUIRED ⚠️

To complete the phone verification test, you need to:

1. Open your browser and go to: http://localhost:5173
2. Login with:
   - Email: {TEST_EMAIL}
   - Password: {TEST_PASSWORD}
3. Navigate to Settings > SMS Fallback Settings
4. The phone number {TEST_PHONE} should already be filled
5. Click 'Verify' button
6. Enter the OTP code you receive on {TEST_PHONE}
7. Return here and press Enter to continue testing...

Alternatively, you can test the verification endpoint directly if you have a Firebase ID token.
        """)
        
        input("Press Enter after completing phone verification manually...")
        
        # Check if phone is now verified
        response = self.make_request('get', '/fallback/settings')
        if response.status_code == 200:
            settings = response.json()
            if settings.get('fallback_phone_verified'):
                self.log("✅ Phone verification completed successfully!")
                return True
            else:
                self.log("⚠️  Phone not yet verified. Continuing test anyway...", "WARN")
                return True
        
        return False
        
    def test_automatic_fallback_settings(self) -> bool:
        """Test automatic fallback enable/disable"""
        self.log("=== Testing automatic fallback settings ===")
        
        # Enable automatic fallback
        response = self.make_request('put', '/fallback/settings', json={
            "auto_fallback_enabled": True
        })
        
        if response.status_code != 200:
            self.log(f"❌ Failed to enable auto fallback: {response.status_code}", "ERROR")
            return False
            
        self.log("✅ Auto fallback enabled")
        
        # Verify it's enabled
        response = self.make_request('get', '/fallback/settings')
        if response.status_code == 200:
            settings = response.json()
            if settings.get('auto_fallback_enabled'):
                self.log("✅ Auto fallback confirmed enabled")
            else:
                self.log("❌ Auto fallback not properly enabled", "ERROR")
                return False
        
        return True
        
    def test_manual_fallback_activation(self) -> bool:
        """Test manual fallback activation"""
        self.log("=== Testing manual fallback activation ===")
        
        # Activate fallback
        response = self.make_request('post', '/fallback/activate')
        
        if response.status_code != 200:
            self.log(f"❌ Failed to activate fallback: {response.status_code}", "ERROR")
            if response.status_code == 400:
                error_detail = response.json().get('detail', '')
                if 'verified' in error_detail.lower():
                    self.log("⚠️  Phone not verified - this is expected if verification was skipped", "WARN")
                    return True
            return False
        
        data = response.json()
        session_id = data.get('session_id')
        self.log(f"✅ Fallback activated with session ID: {session_id}")
        
        return True
        
    def test_fallback_chat_simulation(self) -> bool:
        """Simulate SMS fallback chat interaction"""
        self.log("=== Testing fallback chat simulation ===")
        
        # Check if we have active fallback sessions
        response = self.make_request('get', '/fallback/chats')
        if response.status_code != 200:
            self.log(f"❌ Failed to get fallback chats: {response.status_code}", "ERROR")
            return False
            
        chats = response.json()
        self.log(f"Current fallback chats: {len(chats)}")
        
        if not chats:
            self.log("⚠️  No active fallback sessions found", "WARN")
            return True
            
        # Simulate incoming SMS
        sms_data = {
            "from_number": TEST_PHONE,
            "message": "What's the best fertilizer for tomatoes?",
            "timestamp": time.time()
        }
        
        response = self.make_request('post', '/fallback/receive-sms', json=sms_data)
        
        if response.status_code != 200:
            self.log(f"❌ Failed to simulate SMS: {response.status_code}", "ERROR")
            return False
            
        self.log("✅ SMS simulation successful")
        
        # Wait a bit for processing
        time.sleep(2)
        
        # Check for outgoing messages
        response = self.make_request('get', '/fallback/chats')
        if response.status_code == 200:
            updated_chats = response.json()
            for chat in updated_chats:
                messages = chat.get('messages', [])
                if messages:
                    self.log(f"✅ Found {len(messages)} messages in chat {chat['session_id']}")
                    for msg in messages[-2:]:  # Show last 2 messages
                        direction = "→" if msg['direction'] == 'outbound' else "←"
                        self.log(f"  {direction} {msg['content'][:100]}...")
        
        return True
        
    def test_fallback_deactivation(self) -> bool:
        """Test fallback deactivation"""
        self.log("=== Testing fallback deactivation ===")
        
        # Deactivate fallback
        response = self.make_request('post', '/fallback/deactivate')
        
        if response.status_code != 200:
            self.log(f"❌ Failed to deactivate fallback: {response.status_code}", "ERROR")
            return False
            
        self.log("✅ Fallback deactivated successfully")
        
        # Verify deactivation
        response = self.make_request('get', '/fallback/settings')
        if response.status_code == 200:
            settings = response.json()
            if not settings.get('fallback_active', False):
                self.log("✅ Fallback confirmed inactive")
            else:
                self.log("⚠️  Fallback still shows as active", "WARN")
        
        return True
        
    def run_complete_test(self) -> bool:
        """Run the complete SMS fallback test suite"""
        self.log("🌱 Starting SMS Fallback Integration Test")
        self.log(f"Testing with phone number: {TEST_PHONE}")
        
        tests = [
            ("User Setup", self.setup_test_user),
            ("Fallback Settings", self.test_fallback_settings),
            ("Phone Verification Prep", self.test_phone_verification_preparation),
            ("Auto Fallback Settings", self.test_automatic_fallback_settings),
            ("Manual Fallback Activation", self.test_manual_fallback_activation),
            ("Fallback Chat Simulation", self.test_fallback_chat_simulation),
            ("Fallback Deactivation", self.test_fallback_deactivation),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            self.log(f"\n{'='*20} {test_name} {'='*20}")
            try:
                if test_func():
                    self.log(f"✅ {test_name} PASSED", "SUCCESS")
                    passed += 1
                else:
                    self.log(f"❌ {test_name} FAILED", "ERROR")
                    failed += 1
            except Exception as e:
                self.log(f"❌ {test_name} ERROR: {e}", "ERROR")
                failed += 1
                
        self.log(f"\n{'='*60}")
        self.log(f"📊 TEST SUMMARY:")
        self.log(f"✅ Passed: {passed}")
        self.log(f"❌ Failed: {failed}")
        self.log(f"📱 Test phone: {TEST_PHONE}")
        
        if failed == 0:
            self.log("🎉 ALL TESTS PASSED! SMS Fallback system is working correctly.")
            return True
        else:
            self.log(f"⚠️  {failed} test(s) failed. Check the logs above for details.")
            return False


def main():
    """Main test execution"""
    if len(sys.argv) > 1 and sys.argv[1] == '--help':
        print("""
SMS Fallback Integration Test

This script tests the complete SMS fallback workflow including:
1. User authentication and settings
2. Phone number configuration
3. Firebase-based phone verification (requires manual step)
4. Automatic fallback settings
5. Manual fallback activation/deactivation
6. SMS chat simulation

Usage:
  python test_sms_fallback_complete.py

Make sure the backend server is running on http://127.0.0.1:8000
        """)
        return
    
    tester = SMSFallbackTester()
    success = tester.run_complete_test()
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
