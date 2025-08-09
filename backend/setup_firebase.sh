#!/bin/bash

# Setup script for SmartKrishi Firebase OTP Authentication

echo "🌱 Setting up SmartKrishi Firebase OTP Authentication"
echo "=================================================="

# Check if we're in the backend directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/upgrade dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Check if .env file exists and has required variables
echo "🔍 Checking environment configuration..."
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it with required Firebase variables."
    exit 1
fi

# Check if service account key exists
if [ ! -f "serviceAccountKey.json" ]; then
    echo "❌ Firebase service account key not found."
    echo "Please ensure serviceAccountKey.json is in the backend directory."
    exit 1
fi

# Test Firebase connection
echo "🔥 Testing Firebase connection..."
python3 -c "
import firebase_admin
from firebase_admin import credentials
import os

try:
    # Check if Firebase is already initialized
    try:
        firebase_admin.get_app()
        print('✅ Firebase already initialized')
    except ValueError:
        # Initialize Firebase
        cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
        print('✅ Firebase initialized successfully')
    
    print('✅ Firebase Admin SDK is working correctly')
except Exception as e:
    print(f'❌ Firebase setup error: {e}')
    exit(1)
"

if [ $? -ne 0 ]; then
    echo "❌ Firebase setup failed"
    exit 1
fi

echo ""
echo "✅ Backend setup completed successfully!"
echo ""
echo "🚀 To start the backend server:"
echo "   source venv/bin/activate"
echo "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "🧪 To test the mobile auth API:"
echo "   python3 test_mobile_auth.py"
