#!/usr/bin/env python3
"""
Complete SMS Fallback Workflow Test Script

This script tests the complete SMS fallback functionality including:
1. User setup and phone verification
2. SMS sending capabilities  
3. SMS receiving capabilities
4. Fallback session management
5. Network quality monitoring
6. Health status checks

Usage: python test_sms_complete_workflow.py
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional


class SMSFallbackTester:
    def __init__(self, base_url: str = "http://127.0.0.1:8000/api/v1"):
        self.base_url = base_url
        self.session = None
        self.token = None
        self.user_data = None
        self.test_results = {}
        
    async def setup_session(self):
        """Initialize HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
            
    async def login_user(self, email: str, password: str) -> bool:
        """Login and get auth token"""
        try:
            async with self.session.post(
                f"{self.base_url}/auth/login",
                json={"username": email, "password": password}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.token = data.get("access_token")
                    print(f"✅ Login successful - Token: {self.token[:20]}...")
                    return True
                else:
                    error_data = await response.text()
                    print(f"❌ Login failed: {response.status} - {error_data}")
                    return False
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
            
    async def get_auth_headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"}
        
    async def test_health_check(self) -> bool:
        """Test fallback health status endpoint"""
        print("\n🔍 Testing Health Check...")
        try:
            headers = await self.get_auth_headers()
            async with self.session.get(
                f"{self.base_url}/fallback/health",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Health check passed: {json.dumps(data, indent=2)}")
                    self.test_results['health_check'] = {'status': 'pass', 'data': data}
                    return True
                else:
                    error_data = await response.text()
                    print(f"❌ Health check failed: {response.status} - {error_data}")
                    self.test_results['health_check'] = {'status': 'fail', 'error': error_data}
                    return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            self.test_results['health_check'] = {'status': 'error', 'error': str(e)}
            return False
            
    async def test_fallback_settings(self) -> bool:
        """Test fallback settings retrieval and update"""
        print("\n⚙️  Testing Fallback Settings...")
        try:
            headers = await self.get_auth_headers()
            
            # Get current settings
            async with self.session.get(
                f"{self.base_url}/fallback/settings",
                headers=headers
            ) as response:
                if response.status == 200:
                    settings = await response.json()
                    print(f"✅ Current settings: {json.dumps(settings, indent=2)}")
                    self.test_results['get_settings'] = {'status': 'pass', 'data': settings}
                else:
                    error_data = await response.text()
                    print(f"❌ Get settings failed: {response.status} - {error_data}")
                    return False
                    
            return True
        except Exception as e:
            print(f"❌ Settings test error: {e}")
            self.test_results['settings'] = {'status': 'error', 'error': str(e)}
            return False
            
    async def test_phone_setup(self, phone_number: str) -> bool:
        """Test phone number setup for fallback"""
        print(f"\n📱 Testing Phone Setup for {phone_number}...")
        try:
            headers = await self.get_auth_headers()
            
            # Update fallback settings with phone number
            update_data = {
                "auto_fallback_enabled": True,
                "fallback_phone": phone_number,
                "fallback_phone_verified": False
            }
            
            async with self.session.put(
                f"{self.base_url}/fallback/settings",
                headers=headers,
                json=update_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Phone setup successful: {json.dumps(data, indent=2)}")
                    self.test_results['phone_setup'] = {'status': 'pass', 'data': data}
                    return True
                else:
                    error_data = await response.text()
                    print(f"❌ Phone setup failed: {response.status} - {error_data}")
                    self.test_results['phone_setup'] = {'status': 'fail', 'error': error_data}
                    return False
        except Exception as e:
            print(f"❌ Phone setup error: {e}")
            self.test_results['phone_setup'] = {'status': 'error', 'error': str(e)}
            return False
            
    async def test_activate_fallback(self, phone_number: str) -> bool:
        """Test fallback activation"""
        print(f"\n🚀 Testing Fallback Activation for {phone_number}...")
        try:
            headers = await self.get_auth_headers()
            
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
                    data = await response.json()
                    print(f"✅ Fallback activation successful: {json.dumps(data, indent=2)}")
                    self.test_results['activate_fallback'] = {'status': 'pass', 'data': data}
                    return True
                else:
                    error_data = await response.text()
                    print(f"❌ Fallback activation failed: {response.status} - {error_data}")
                    self.test_results['activate_fallback'] = {'status': 'fail', 'error': error_data}
                    return False
        except Exception as e:
            print(f"❌ Fallback activation error: {e}")
            self.test_results['activate_fallback'] = {'status': 'error', 'error': str(e)}
            return False
            
    async def test_send_sms(self, phone_number: str, message: str) -> bool:
        """Test sending SMS through fallback"""
        print(f"\n📤 Testing SMS Send to {phone_number}...")
        try:
            headers = await self.get_auth_headers()
            
            sms_data = {
                "phone_number": phone_number,
                "message": message
            }
            
            async with self.session.post(
                f"{self.base_url}/fallback/send-sms",
                headers=headers,
                json=sms_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ SMS sent successfully: {json.dumps(data, indent=2)}")
                    self.test_results['send_sms'] = {'status': 'pass', 'data': data}
                    return True
                else:
                    error_data = await response.text()
                    print(f"❌ SMS send failed: {response.status} - {error_data}")
                    self.test_results['send_sms'] = {'status': 'fail', 'error': error_data}
                    return False
        except Exception as e:
            print(f"❌ SMS send error: {e}")
            self.test_results['send_sms'] = {'status': 'error', 'error': str(e)}
            return False
            
    async def test_receive_sms(self) -> bool:
        """Test SMS receiving capabilities"""
        print("\n📥 Testing SMS Receive...")
        try:
            headers = await self.get_auth_headers()
            
            async with self.session.get(
                f"{self.base_url}/fallback/messages",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ SMS messages retrieved: {json.dumps(data, indent=2)}")
                    self.test_results['receive_sms'] = {'status': 'pass', 'data': data}
                    return True
                else:
                    error_data = await response.text()
                    print(f"❌ SMS receive failed: {response.status} - {error_data}")
                    self.test_results['receive_sms'] = {'status': 'fail', 'error': error_data}
                    return False
        except Exception as e:
            print(f"❌ SMS receive error: {e}")
            self.test_results['receive_sms'] = {'status': 'error', 'error': str(e)}
            return False
            
    async def test_fallback_sessions(self) -> bool:
        """Test fallback session management"""
        print("\n📊 Testing Fallback Sessions...")
        try:
            headers = await self.get_auth_headers()
            
            async with self.session.get(
                f"{self.base_url}/fallback/sessions",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Fallback sessions retrieved: {json.dumps(data, indent=2)}")
                    self.test_results['fallback_sessions'] = {'status': 'pass', 'data': data}
                    return True
                else:
                    error_data = await response.text()
                    print(f"❌ Fallback sessions failed: {response.status} - {error_data}")
                    self.test_results['fallback_sessions'] = {'status': 'fail', 'error': error_data}
                    return False
        except Exception as e:
            print(f"❌ Fallback sessions error: {e}")
            self.test_results['fallback_sessions'] = {'status': 'error', 'error': str(e)}
            return False
            
    async def test_deactivate_fallback(self) -> bool:
        """Test fallback deactivation"""
        print("\n🛑 Testing Fallback Deactivation...")
        try:
            headers = await self.get_auth_headers()
            
            async with self.session.post(
                f"{self.base_url}/fallback/deactivate",
                headers=headers
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Fallback deactivated successfully: {json.dumps(data, indent=2)}")
                    self.test_results['deactivate_fallback'] = {'status': 'pass', 'data': data}
                    return True
                else:
                    error_data = await response.text()
                    print(f"❌ Fallback deactivation failed: {response.status} - {error_data}")
                    self.test_results['deactivate_fallback'] = {'status': 'fail', 'error': error_data}
                    return False
        except Exception as e:
            print(f"❌ Fallback deactivation error: {e}")
            self.test_results['deactivate_fallback'] = {'status': 'error', 'error': str(e)}
            return False
            
    def print_test_summary(self):
        """Print comprehensive test results summary"""
        print("\n" + "="*60)
        print("🏁 SMS FALLBACK TEST SUMMARY")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result['status'] == 'pass')
        failed_tests = sum(1 for result in self.test_results.values() if result['status'] == 'fail')
        error_tests = sum(1 for result in self.test_results.values() if result['status'] == 'error')
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"⚠️  Errors: {error_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%" if total_tests > 0 else "0.0%")
        
        print("\nDetailed Results:")
        print("-" * 40)
        for test_name, result in self.test_results.items():
            status_icon = "✅" if result['status'] == 'pass' else "❌" if result['status'] == 'fail' else "⚠️"
            print(f"{status_icon} {test_name.replace('_', ' ').title()}: {result['status'].upper()}")
            if result['status'] in ['fail', 'error'] and 'error' in result:
                print(f"   Error: {result['error']}")
        print()

    async def run_complete_test(self, email: str, password: str, phone_number: str):
        """Run the complete SMS fallback test suite"""
        print("🚀 Starting Complete SMS Fallback Test Suite")
        print(f"Test Parameters:")
        print(f"  - API Base URL: {self.base_url}")
        print(f"  - Test Email: {email}")
        print(f"  - Test Phone: {phone_number}")
        print(f"  - Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("-" * 60)
        
        await self.setup_session()
        
        try:
            # Step 1: Login
            if not await self.login_user(email, password):
                print("❌ Cannot proceed without authentication")
                return
                
            # Step 2: Health Check
            await self.test_health_check()
            
            # Step 3: Test Settings
            await self.test_fallback_settings()
            
            # Step 4: Phone Setup
            await self.test_phone_setup(phone_number)
            
            # Step 5: Activate Fallback
            await self.test_activate_fallback(phone_number)
            
            # Step 6: Send SMS
            test_message = f"SMS Fallback Test - {datetime.now().strftime('%H:%M:%S')}"
            await self.test_send_sms(phone_number, test_message)
            
            # Step 7: Check Messages
            await self.test_receive_sms()
            
            # Step 8: Check Sessions
            await self.test_fallback_sessions()
            
            # Step 9: Deactivate Fallback
            await self.test_deactivate_fallback()
            
            # Final health check
            print("\n🔍 Final Health Check...")
            await self.test_health_check()
            
        finally:
            await self.cleanup_session()
            
        # Print summary
        self.print_test_summary()


async def main():
    """Main test runner"""
    print("SMS Fallback System - Complete Workflow Test")
    print("=" * 50)
    
    # Get user input
    email = input("Enter test email (or press Enter for demo@example.com): ").strip()
    if not email:
        email = "demo@example.com"
        
    password = input("Enter test password (or press Enter for 'password'): ").strip()
    if not password:
        password = "password"
        
    phone_number = input("Enter test phone number (with country code, e.g., +1234567890): ").strip()
    if not phone_number:
        print("❌ Phone number is required for SMS testing")
        return
        
    # Initialize and run tests
    tester = SMSFallbackTester()
    await tester.run_complete_test(email, password, phone_number)


if __name__ == "__main__":
    asyncio.run(main())
