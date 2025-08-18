import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// Removed debug logger for production

// Firebase configuration - using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate configuration
const validateConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missing = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missing.length > 0) {
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`);
  }
};

// Initialize Firebase
let app: any = null;
let auth: any = null;

try {
  validateConfig();
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Firebase initialized successfully
} catch (error) {
  // Firebase initialization failed
  throw error;
}

// Global reCAPTCHA verifier instance
let globalRecaptchaVerifier: RecaptchaVerifier | null = null;

// Phone authentication utilities
export const setupRecaptcha = (
  containerId: string, 
  options: { forceNew?: boolean; size?: 'invisible' | 'normal' } = { size: 'invisible' }
): Promise<RecaptchaVerifier> => {
  return new Promise(async (resolve, reject) => {
    if (!auth) {
      // Firebase auth not initialized
      reject(new Error('Firebase auth not initialized'));
      return;
    }

    const { forceNew = false, size = 'invisible' } = options;
    
    // If forceNew is false and verifier already exists, return it
    if (!forceNew && globalRecaptchaVerifier) {
      // Reusing existing reCAPTCHA verifier
      resolve(globalRecaptchaVerifier);
      return;
    }
    
    try {
      // Clear existing verifier if forceNew is true
      if (forceNew && globalRecaptchaVerifier) {
        try {
          // Clearing existing reCAPTCHA verifier
          globalRecaptchaVerifier.clear();
        } catch (clearError) {
          // Error clearing existing verifier - continuing
        }
        globalRecaptchaVerifier = null;
      }
      
      // Clear container content
      const container = document.getElementById(containerId);
      if (!container) {
        reject(new Error(`reCAPTCHA container with ID '${containerId}' not found`));
        return;
      }
      container.innerHTML = '';

      // Create new verifier with proper callbacks
      const verifier = new RecaptchaVerifier(auth, containerId, {
        size,
        callback: (_response: any) => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          // reCAPTCHA expired, clearing verifier
          globalRecaptchaVerifier = null;
        },
        'error-callback': (_error: any) => {
          // reCAPTCHA error occurred
          globalRecaptchaVerifier = null;
        }
      });

      // Render the verifier
      await verifier.render();
      // reCAPTCHA rendered successfully
      globalRecaptchaVerifier = verifier;
      resolve(verifier);

    } catch (error) {
      // Failed to setup reCAPTCHA
      
      // Handle specific reCAPTCHA errors
      if (error instanceof Error) {
        if (error.message.includes('network-request-failed')) {
          reject(new Error('Network error: Please check your internet connection and Firebase configuration.'));
        } else if (error.message.includes('invalid-app-credential')) {
          reject(new Error('Invalid Firebase configuration. Please check your project settings.'));
        } else {
          reject(error);
        }
      } else {
        reject(error);
      }
    }
  });
};

// Function to clear reCAPTCHA verifier (call this when you want to reset)
export const clearRecaptchaVerifier = () => {
  if (globalRecaptchaVerifier) {
    try {
      globalRecaptchaVerifier.clear();
    } catch (error) {
      // Error clearing reCAPTCHA verifier - continuing
    }
    globalRecaptchaVerifier = null;
    // reCAPTCHA verifier cleared
  }
};

// Function to get reCAPTCHA verifier (creates new if none exists)
export const getRecaptchaVerifier = async (containerId: string = 'recaptcha-container'): Promise<RecaptchaVerifier> => {
  if (globalRecaptchaVerifier) {
    // Returning existing reCAPTCHA verifier
    return globalRecaptchaVerifier;
  }
  
  // No reCAPTCHA verifier found, creating new one
  return await setupRecaptcha(containerId, { forceNew: true, size: 'invisible' });
};

// Phone number utilities
export const sendOTPToPhone = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }
  
  if (!recaptchaVerifier) {
    throw new Error('reCAPTCHA verifier not provided');
  }
  
  try {
    // Attempting to send OTP - phone number masked for security
    // Using reCAPTCHA verifier for verification
    
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    // OTP sent successfully
    return confirmationResult;
  } catch (error: any) {
    // Error sending OTP - processing error type
    
    // Handle specific Firebase Auth errors
    if (error.code) {
      switch (error.code) {
        case 'auth/invalid-app-credential':
          throw new Error('Firebase app credential invalid. Please check your Firebase project configuration.');
        case 'auth/captcha-check-failed':
          throw new Error('reCAPTCHA verification failed. Please try again.');
        case 'auth/invalid-phone-number':
          throw new Error('Please enter a valid phone number with country code.');
        case 'auth/too-many-requests':
          throw new Error('Too many OTP requests. Please try again later.');
        case 'auth/quota-exceeded':
          throw new Error('SMS quota exceeded. Please try again later.');
        default:
          throw new Error(`Firebase error: ${error.message}`);
      }
    }
    
    // Provide more specific error messages for generic errors
    if (error instanceof Error) {
      if (error.message.includes('invalid-app-credential')) {
        throw new Error('Firebase configuration issue. Please check your project settings.');
      } else if (error.message.includes('too-many-requests')) {
        throw new Error('Too many OTP requests. Please try again later.');
      } else if (error.message.includes('quota-exceeded')) {
        throw new Error('SMS quota exceeded. Please try again later.');
      }
    }
    
    throw error;
  }
};

// Get Firebase ID token from user
export const getFirebaseIdToken = async (user: any) => {
  if (!user) {
    throw new Error('No user provided');
  }
  
  try {
    const token = await user.getIdToken();
    // Firebase ID token retrieved successfully
    return token;
  } catch (error) {
    // Error getting Firebase ID token
    throw new Error('Failed to get authentication token');
  }
};

export { auth };
export default app;