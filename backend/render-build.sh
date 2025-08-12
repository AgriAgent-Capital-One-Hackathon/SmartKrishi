#!/bin/bash
set -e

echo "🚀 Starting SmartKrishi backend build for Render..."

# Upgrade pip and core tools
echo "📦 Upgrading build tools..."
pip install --upgrade pip==23.2.1 setuptools==68.0.0 wheel==0.41.0

# Install packages individually to avoid conflicts
echo "📋 Installing core web framework..."
pip install --no-cache-dir fastapi==0.100.1
pip install --no-cache-dir uvicorn==0.23.2

echo "📋 Installing database support..."  
pip install --no-cache-dir sqlalchemy==1.4.48
pip install --no-cache-dir psycopg2-binary==2.9.7
pip install --no-cache-dir alembic==1.11.1

echo "📋 Installing authentication..."
pip install --no-cache-dir passlib==1.7.4
pip install --no-cache-dir python-jose==3.3.0
pip install --no-cache-dir python-multipart==0.0.6

echo "📋 Installing data validation..."
pip install --no-cache-dir pydantic==1.10.12

echo "📋 Installing configuration..."
pip install --no-cache-dir python-decouple==3.8
pip install --no-cache-dir python-dotenv==1.0.0

echo "📋 Installing utilities..."
pip install --no-cache-dir requests==2.31.0
pip install --no-cache-dir typing-extensions==4.7.1

echo "📋 Installing Google AI (trying different approach)..."
pip install --no-cache-dir --prefer-binary google-generativeai==0.2.2 || {
    echo "⚠️ Trying alternative Google AI package..."
    pip install --no-cache-dir google-ai-generativelanguage==0.2.0
}

echo "📋 Installing Firebase..."
pip install --no-cache-dir firebase-admin==6.0.1

echo "📋 Installing remaining packages..."
pip install --no-cache-dir phonenumbers==8.13.14
pip install --no-cache-dir slowapi==0.1.8
pip install --no-cache-dir Pillow==9.5.0

echo "✅ Build completed successfully!"
echo "🌱 SmartKrishi backend ready for deployment!"

# List installed packages for debugging
echo "📋 Installed packages:"
pip list
