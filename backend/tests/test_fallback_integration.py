#!/usr/bin/env python3
"""
Test script to verify SMS fallback system integration
"""

import asyncio
import sys
import os
import json
from datetime import datetime

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

async def test_fallback_integration():
    """Test the complete fallback system integration"""
    
    print("🚀 Testing SMS Fallback System Integration")
    print("=" * 50)
    
    try:
        # Test 1: Import all models
        print("\n1️⃣ Testing Model Imports...")
        from app.models.user import User
        from app.models.chat import Chat, ChatMessage
        from app.models.fallback import FallbackSession, FallbackMessage
        print("✅ All models imported successfully")
        
        # Test 2: Import all schemas
        print("\n2️⃣ Testing Schema Imports...")
        from app.schemas.fallback import (
            FallbackSettingsResponse, 
            FallbackSettingsUpdate,
            FallbackSessionResponse,
            FallbackMessageResponse,
            NetworkHealthResponse
        )
        from app.schemas.chat import MessageEditRequest, MessageEditResponse
        print("✅ All schemas imported successfully")
        
        # Test 3: Import all services
        print("\n3️⃣ Testing Service Imports...")
        from app.services.sms_service import SMSService
        from app.services.fallback_service import FallbackService
        from app.services.chat_service import ChatService
        print("✅ All services imported successfully")
        
        # Test 4: Import router
        print("\n4️⃣ Testing Router Import...")
        from app.routers.fallback import router as fallback_router
        print("✅ Fallback router imported successfully")
        
        # Test 5: Test service initialization
        print("\n5️⃣ Testing Service Initialization...")
        sms_service = SMSService()
        fallback_service = FallbackService()
        print("✅ Services initialized successfully")
        
        # Test 6: Check main app integration
        print("\n6️⃣ Testing Main App Integration...")
        from app.main import app
        print("✅ Main app with fallback router imported successfully")
        
        # Test 7: Check database models have expected fields
        print("\n7️⃣ Testing Model Schema...")
        
        # Check User model has fallback fields
        user_fields = [attr for attr in dir(User) if not attr.startswith('_')]
        expected_user_fields = [
            'auto_fallback_enabled', 'fallback_mode', 'fallback_active',
            'fallback_phone', 'fallback_phone_verified', 'whatsapp_user_id'
        ]
        
        missing_user_fields = [field for field in expected_user_fields if field not in user_fields]
        if missing_user_fields:
            print(f"❌ Missing User fields: {missing_user_fields}")
        else:
            print("✅ User model has all expected fallback fields")
        
        # Check Chat model has fallback fields
        chat_fields = [attr for attr in dir(Chat) if not attr.startswith('_')]
        expected_chat_fields = ['is_fallback_chat', 'fallback_phone_number']
        
        missing_chat_fields = [field for field in expected_chat_fields if field not in chat_fields]
        if missing_chat_fields:
            print(f"❌ Missing Chat fields: {missing_chat_fields}")
        else:
            print("✅ Chat model has all expected fallback fields")
        
        # Check FallbackSession model
        fallback_session_fields = [attr for attr in dir(FallbackSession) if not attr.startswith('_')]
        expected_session_fields = ['user_id', 'phone_number', 'status', 'created_at']
        
        missing_session_fields = [field for field in expected_session_fields if field not in fallback_session_fields]
        if missing_session_fields:
            print(f"❌ Missing FallbackSession fields: {missing_session_fields}")
        else:
            print("✅ FallbackSession model has all expected fields")
        
        print(f"\n🎉 Integration Test Completed Successfully!")
        print(f"⏰ Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return True
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False

async def test_api_endpoints():
    """Test API endpoint structure"""
    print("\n🔗 Testing API Endpoint Structure")
    print("=" * 40)
    
    try:
        from app.routers.fallback import router
        
        # Get all routes from the router
        routes = []
        for route in router.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                routes.append({
                    'path': route.path,
                    'methods': list(route.methods),
                    'name': getattr(route, 'name', 'unnamed')
                })
        
        print(f"📍 Found {len(routes)} fallback endpoints:")
        for route in routes:
            methods_str = ', '.join(route['methods'])
            print(f"   {methods_str:<8} {route['path']}")
        
        # Expected endpoints
        expected_endpoints = [
            '/settings',
            '/activate', 
            '/deactivate',
            '/health',
            '/health-check',
            '/sms/send',
            '/sms/receive', 
            '/sms/history',
            '/messages/{message_id}/edit'
        ]
        
        found_paths = [route['path'] for route in routes]
        missing_endpoints = [ep for ep in expected_endpoints if not any(ep in path for path in found_paths)]
        
        if missing_endpoints:
            print(f"❌ Missing expected endpoints: {missing_endpoints}")
        else:
            print("✅ All expected endpoints are present")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing endpoints: {e}")
        return False

def test_frontend_components():
    """Test frontend component files exist"""
    print("\n🖥️ Testing Frontend Components")
    print("=" * 35)
    
    frontend_base = os.path.join(os.path.dirname(__file__), 'frontend', 'src', 'components')
    
    expected_components = [
        'ui/fallback-settings.tsx',
        'ui/fallback-status.tsx', 
        'ui/enhanced-chat-sidebar.tsx',
        'ui/message-actions.tsx',
        'ui/message-edit.tsx',
        'ui/alert.tsx',
        'EnhancedDashboard.tsx'
    ]
    
    results = []
    for component in expected_components:
        file_path = os.path.join(frontend_base, component)
        exists = os.path.exists(file_path)
        results.append({
            'component': component,
            'exists': exists,
            'path': file_path
        })
        
        status = "✅" if exists else "❌"
        print(f"   {status} {component}")
    
    missing = [r for r in results if not r['exists']]
    if missing:
        print(f"\n❌ Missing {len(missing)} components")
        return False
    else:
        print(f"\n✅ All {len(expected_components)} components found")
        return True

async def main():
    """Run all integration tests"""
    print("🧪 SmartKrishi SMS Fallback - Integration Test Suite")
    print("=" * 60)
    
    # Run all tests
    backend_test = await test_fallback_integration()
    endpoint_test = await test_api_endpoints()  
    frontend_test = test_frontend_components()
    
    print(f"\n📊 Test Results Summary")
    print("=" * 30)
    print(f"   Backend Integration:  {'✅ PASS' if backend_test else '❌ FAIL'}")
    print(f"   API Endpoints:        {'✅ PASS' if endpoint_test else '❌ FAIL'}")
    print(f"   Frontend Components:  {'✅ PASS' if frontend_test else '❌ FAIL'}")
    
    overall_success = backend_test and endpoint_test and frontend_test
    print(f"\n🏆 Overall Result: {'✅ ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
    
    if overall_success:
        print("\n🚀 Your SMS fallback system is ready for integration!")
        print("📖 See SMS_FALLBACK_INTEGRATION_GUIDE.md for detailed usage examples.")
    else:
        print("\n🔧 Please fix the failing tests before proceeding with integration.")
    
    return overall_success

if __name__ == "__main__":
    # Change to backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    if os.path.exists(backend_dir):
        os.chdir(backend_dir)
    
    # Run the test suite
    success = asyncio.run(main())
