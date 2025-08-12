#!/bin/bash
set -e

echo "🚀 Starting SmartKrishi backend build for Render..."

# Upgrade pip to latest version
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install dependencies with binary wheels preference (avoid Rust compilation)
echo "📋 Installing dependencies..."
pip install --prefer-binary --no-cache-dir --only-binary=:all: -r requirements.txt || {
    echo "⚠️  Binary-only install failed, trying with source fallback..."
    pip install --prefer-binary --no-cache-dir -r requirements.txt
}

echo "✅ Build completed successfully!"
echo "🌱 SmartKrishi backend ready for deployment!"
