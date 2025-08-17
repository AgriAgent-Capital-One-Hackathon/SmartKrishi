#!/usr/bin/env python3
"""
Setup Demo User and Fix SMS Configuration

This script will:
1. Create a demo user for testing
2. Configure SMS service properly
3. Update fallback settings
"""

import asyncio
import psycopg2
from passlib.context import CryptContext
import os
import sys

# Add the backend directory to Python path
sys.path.append('/Users/malyadippal/Desktop/SmartKrishi/backend')

from app.core.security import get_password_hash


def create_demo_user():
    """Create a demo user for testing"""
    
    # Database connection - adjust these parameters as needed
    try:
        conn = psycopg2.connect(
            host="localhost",
            database="smartkrishi_db",
            user="smartkrishi_user",
            password="smartkrishi_password"
        )
        cursor = conn.cursor()
        
        # Check if demo user already exists
        cursor.execute("SELECT id FROM users WHERE email = 'demo@example.com'")
        existing_user = cursor.fetchone()
        
        if existing_user:
            print("✅ Demo user already exists")
            user_id = existing_user[0]
        else:
            # Create demo user
            hashed_password = get_password_hash("password")
            
            cursor.execute("""
                INSERT INTO users (
                    name, email, hashed_password, auth_provider, is_active,
                    auto_fallback_enabled, fallback_mode, fallback_active, 
                    fallback_phone_verified
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                "Demo User",
                "demo@example.com", 
                hashed_password,
                "email",
                True,
                False,  # auto_fallback_enabled
                "manual",  # fallback_mode
                False,  # fallback_active
                False   # fallback_phone_verified
            ))
            
            user_id = cursor.fetchone()[0]
            conn.commit()
            print("✅ Demo user created successfully")
            
        # Update user to ensure all fallback fields have proper defaults
        cursor.execute("""
            UPDATE users SET 
                auto_fallback_enabled = COALESCE(auto_fallback_enabled, false),
                fallback_active = COALESCE(fallback_active, false),
                fallback_phone_verified = COALESCE(fallback_phone_verified, false),
                fallback_mode = COALESCE(fallback_mode, 'manual')
            WHERE id = %s
        """, (user_id,))
        
        conn.commit()
        
        print(f"✅ User setup completed - ID: {user_id}")
        print("   Email: demo@example.com")
        print("   Password: password")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Database error: {e}")
        print("💡 Make sure your database is running and credentials are correct")
        return False


def main():
    """Main setup function"""
    print("🚀 Setting up Demo User and SMS Configuration")
    print("=" * 50)
    
    # Create demo user
    if create_demo_user():
        print("\n✅ Setup completed successfully!")
        print("\nYou can now test with:")
        print("  Email: demo@example.com")
        print("  Password: password")
    else:
        print("\n❌ Setup failed!")
        

if __name__ == "__main__":
    main()
