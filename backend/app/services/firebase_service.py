import firebase_admin
from firebase_admin import credentials, auth
import os
import json
from typing import Optional
from dotenv import load_dotenv
import jwt

# Load environment variables
load_dotenv()

class FirebaseService:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        # Lazy initialization
        pass

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        if self._initialized:
            return

        try:
            # Check if Firebase is already initialized
            firebase_admin.get_app()
            self._initialized = True
            print("✅ Firebase Admin SDK already initialized")
            return
        except ValueError:
            pass  # App not initialized yet, continue

        try:
            # First, try to get credentials from environment variable as JSON content
            firebase_credentials = os.getenv('FIREBASE_CREDENTIALS') or os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            
            if firebase_credentials:
                try:
                    # Try to parse as JSON first (for Render environment)
                    if firebase_credentials.strip().startswith('{'):
                        print("🔧 Parsing Firebase credentials from environment variable...")
                        credentials_dict = json.loads(firebase_credentials)
                        cred = credentials.Certificate(credentials_dict)
                        firebase_admin.initialize_app(cred, {
                            'projectId': 'smartkrishi-83352'
                        })
                        self._initialized = True
                        print("✅ Firebase Admin SDK initialized from environment JSON")
                        return
                    else:
                        # Treat as file path
                        if os.path.exists(firebase_credentials):
                            print(f"🔧 Loading Firebase credentials from file: {firebase_credentials}")
                            cred = credentials.Certificate(firebase_credentials)
                            firebase_admin.initialize_app(cred, {
                                'projectId': 'smartkrishi-83352'
                            })
                            self._initialized = True
                            print("✅ Firebase Admin SDK initialized from file")
                            return
                        else:
                            print(f"❌ Firebase credentials file not found: {firebase_credentials}")
                
                except json.JSONDecodeError as e:
                    print(f"❌ Failed to parse Firebase credentials JSON: {e}")
                except Exception as e:
                    print(f"❌ Failed to initialize Firebase with provided credentials: {e}")
            
            # Fallback: try default credentials (for Google Cloud environments)
            try:
                print("🔧 Trying default Firebase credentials...")
                firebase_admin.initialize_app()
                self._initialized = True
                print("✅ Firebase Admin SDK initialized with default credentials")
                return
            except Exception as e:
                print(f"❌ Failed to initialize with default credentials: {e}")
            
            print("❌ Warning: Could not initialize Firebase Admin SDK. Firebase features will be disabled.")
            
        except Exception as e:
            print(f"❌ Error initializing Firebase Admin SDK: {e}")
            self._initialized = False

    def verify_id_token(self, id_token: str) -> Optional[dict]:
        """Verify Firebase ID token and return user data"""
        if not self._initialized:
            self._initialize_firebase()
        
        if not self._initialized:
            print("Firebase not initialized. Cannot verify ID token.")
            return None
        
        if not id_token:
            print("No ID token provided")
            return None
        
        try:
            print(f"Verifying Firebase token: {id_token[:50]}...")
            decoded_token = auth.verify_id_token(id_token, check_revoked=True)
            print(f"✅ Token verified for user: {decoded_token.get('phone_number', decoded_token.get('uid'))}")
            return decoded_token
        except Exception as e:
            print(f"❌ Token verification failed: {e}")
            
            # Handle specific error cases with retries
            error_str = str(e).lower()
            
            # Retry if clock skew or issued-at errors
            if any(phrase in error_str for phrase in ["used too early", "clock", "issued at", "timestamp"]):
                try:
                    print("Retrying with increased clock skew tolerance...")
                    decoded_token = auth.verify_id_token(id_token, check_revoked=True, clock_skew_seconds=10)
                    print(f"✅ Token verified on retry for user: {decoded_token.get('phone_number', decoded_token.get('uid'))}")
                    return decoded_token
                except Exception as retry_error:
                    print(f"Retry failed: {retry_error}")
                    return None
            
            return None

    def get_user_by_phone(self, phone_number: str) -> Optional[dict]:
        """Get user information by phone number."""
        self._initialize_firebase()
        if not self._initialized:
            print("Firebase not initialized. Cannot get user by phone.")
            return None

        try:
            user = auth.get_user_by_phone_number(phone_number)
            return {
                'uid': user.uid,
                'phone_number': user.phone_number,
                'email': user.email,
                'display_name': user.display_name,
                'email_verified': user.email_verified,
                'disabled': user.disabled
            }
        except auth.UserNotFoundError:
            return None
        except Exception as e:
            print(f"Error getting user by phone: {e}")
            return None

    def create_custom_token(self, uid: str, additional_claims: dict = None) -> str:
        """Create a custom token for a user."""
        self._initialize_firebase()
        if not self._initialized:
            raise Exception("Firebase not initialized. Cannot create custom token.")

        try:
            custom_token = auth.create_custom_token(uid, additional_claims)
            return custom_token.decode('utf-8')
        except Exception as e:
            print(f"Error creating custom token: {e}")
            raise e

# Singleton instance
firebase_service = FirebaseService()
