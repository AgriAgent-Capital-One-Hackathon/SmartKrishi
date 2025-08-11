import firebase_admin
from firebase_admin import credentials, auth
import os
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
            firebase_admin.get_app()
            self._initialized = True
        except ValueError:
            service_account_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            if not service_account_path:
                print("Warning: GOOGLE_APPLICATION_CREDENTIALS not set. Firebase features will be disabled.")
                return

            if not os.path.exists(service_account_path):
                print(f"Warning: Firebase service account key file not found at {service_account_path}. Firebase features will be disabled.")
                return

            try:
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred, {
                    'projectId': 'smartkrishi-83352'  # Must match frontend firebaseConfig
                })
                self._initialized = True
                print("✅ Firebase Admin SDK initialized successfully")
            except Exception as e:
                print(f"Warning: Failed to initialize Firebase: {e}")
                return

    def verify_id_token(self, id_token: str) -> Optional[dict]:
        """
        Verify Firebase ID token and return user info.
        Logs detailed information on failure for debugging.
        """
        self._initialize_firebase()
        if not self._initialized:
            print("Firebase not initialized. Cannot verify ID token.")
            return None

        try:
            print(f"Verifying Firebase ID token (length: {len(id_token)})")
            decoded_token = auth.verify_id_token(id_token, check_revoked=False,clock_skew_seconds=10)
            print(f"✅ Token verified for user: {decoded_token.get('phone_number', decoded_token.get('uid'))}")
            return decoded_token

        except Exception as e:
            print(f"❌ Error verifying ID token: {e}")

            # Decode without verifying to inspect claims
            try:
                unverified_claims = jwt.decode(id_token, options={"verify_signature": False})
                print("🔍 Unverified token claims:", unverified_claims)
            except Exception as decode_err:
                print("⚠️ Failed to decode token without verification:", decode_err)

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

            # Expired tokens
            if "expired" in error_str:
                print("Token is expired. Client should request a new token.")
                return None

            # Invalid/malformed tokens
            if any(phrase in error_str for phrase in ["invalid", "malformed", "decode"]):
                print("Token is invalid or malformed.")
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
