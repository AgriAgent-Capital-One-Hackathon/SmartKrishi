#!/usr/bin/env python3
"""
Test script to verify SMS service gracefully handles missing configuration
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.services.sms_service import SMSService

async def test_sms_service():
    print("🧪 Testing SMS Service with disabled configuration...")
    
    # Ensure SMS_API_BASE_URL is not set (or set to None)
    original_url = os.environ.get("SMS_API_BASE_URL")
    if "SMS_API_BASE_URL" in os.environ:
        del os.environ["SMS_API_BASE_URL"]
    
    # Create SMS service
    sms = SMSService()
    
    print(f"📱 SMS Service enabled: {sms.enabled}")
    print(f"📱 SMS Service base URL: {sms.base_url}")
    
    # Test health check
    print("\n🔍 Testing health check...")
    health = await sms.health_check()
    print(f"Health check result: {health}")
    
    # Test send SMS
    print("\n📤 Testing send SMS...")
    result = await sms.send_sms("+1234567890", "Test message")
    print(f"Send SMS result: {result}")
    
    # Test receive SMS
    print("\n📥 Testing receive SMS...")
    received = await sms.receive_sms()
    print(f"Receive SMS result: {received}")
    
    # Test system status
    print("\n📊 Testing system status...")
    status = await sms.get_system_status()
    print(f"System status: {status}")
    
    # Restore original environment variable if it existed
    if original_url:
        os.environ["SMS_API_BASE_URL"] = original_url
    
    print("\n✅ SMS service test completed successfully!")

if __name__ == "__main__":
    asyncio.run(test_sms_service())
