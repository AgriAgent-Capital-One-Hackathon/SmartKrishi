import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

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
  
  // For development, you might want to use auth emulator
  // Uncomment the following lines if you're using Firebase Auth emulator
  // if (import.meta.env.DEV) {
  //   connectAuthEmulator(auth, 'http://localhost:9099');
  // }
  
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
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
      console.error('Firebase auth not initialized');
      reject(new Error('Firebase auth not initialized'));
      return;
    }
    
    const { forceNew = false, size = 'invisible' } = options;
    
    // If forceNew is false and verifier already exists, return it
    if (!forceNew && globalRecaptchaVerifier) {
      console.log('Reusing existing reCAPTCHA verifier');
      resolve(globalRecaptchaVerifier);
      return;
    }
    
    try {
      // Clear existing verifier if forceNew is true
      if (forceNew && globalRecaptchaVerifier) {
        try {
          console.log('Clearing existing reCAPTCHA verifier');
          globalRecaptchaVerifier.clear();
        } catch (clearError) {
          console.warn('Error clearing existing verifier:', clearError);
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
        callback: (response: any) => {
          console.log('reCAPTCHA solved', response);
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired, clearing verifier');
          globalRecaptchaVerifier = null;
        },
        'error-callback': (error: any) => {
          console.error('reCAPTCHA error:', error);
          globalRecaptchaVerifier = null;
        }
      });

      // Render the verifier
      await verifier.render();
      console.log('reCAPTCHA rendered successfully');
      globalRecaptchaVerifier = verifier;
      resolve(verifier);

    } catch (error) {
      console.error('Failed to setup reCAPTCHA:', error);
      
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
      console.warn('Error clearing reCAPTCHA verifier:', error);
    }
    globalRecaptchaVerifier = null;
    console.log('reCAPTCHA verifier cleared');
  }
};

// Function to get reCAPTCHA verifier (creates new if none exists)
export const getRecaptchaVerifier = async (containerId: string = 'recaptcha-container'): Promise<RecaptchaVerifier> => {
  if (globalRecaptchaVerifier) {
    console.log('Returning existing reCAPTCHA verifier');
    return globalRecaptchaVerifier;
  }
  
  console.log('No reCAPTCHA verifier found, creating new one...');
  return await setupRecaptcha(containerId, { forceNew: true, size: 'invisible' });
};

export const sendOTPToPhone = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
  if (!auth) {
    throw new Error('Firebase auth not initialized');
  }
  
  if (!recaptchaVerifier) {
    throw new Error('reCAPTCHA verifier not provided');
  }
  
  try {
    console.log('Attempting to send OTP to:', phoneNumber);
    console.log('Using reCAPTCHA verifier:', recaptchaVerifier);
    
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    console.log('OTP sent successfully');
    return confirmationResult;
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    
    // Don't automatically clear the reCAPTCHA - let the caller handle it
    // This allows the verifier to be reused for retries
    
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

// Helper function to get Firebase ID token with retry logic
export const getFirebaseIdToken = async (user: any, maxRetries: number = 3): Promise<string> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Getting Firebase ID token (attempt ${attempt}/${maxRetries})`);
      
      // Add a small delay before getting token to ensure it's valid
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
      
      const token = await user.getIdToken(true); // Force refresh
      console.log('Firebase ID token obtained successfully');
      return token;
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 500 * attempt));
    }
  }
  
  throw new Error(`Failed to get Firebase ID token after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
};

export { auth };
export default app;