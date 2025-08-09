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

// Debug configuration
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING',
  authDomain: firebaseConfig.authDomain || 'MISSING',
  projectId: firebaseConfig.projectId || 'MISSING',
  // Don't log full keys for security
});

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

// Phone authentication utilities
export const setupRecaptcha = (containerId: string): Promise<RecaptchaVerifier> => {
  return new Promise((resolve, reject) => {
    if (!auth) {
      console.error('Firebase auth not initialized');
      reject(new Error('Firebase auth not initialized'));
      return;
    }
    
    try {
      // Clear any existing reCAPTCHA
      const existingContainer = document.getElementById(containerId);
      if (existingContainer) {
        existingContainer.innerHTML = '';
      }

      // Use visible reCAPTCHA for better compatibility
      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'normal', // Changed from 'invisible' to 'normal' for better reliability
        callback: (response: any) => {
          console.log('reCAPTCHA solved', response);
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired, please solve it again');
          // Auto-refresh the reCAPTCHA
          verifier.render().catch((error) => {
            console.error('Failed to re-render reCAPTCHA:', error);
          });
        },
        'error-callback': (error: any) => {
          console.error('reCAPTCHA error:', error);
          reject(error);
        }
      });

      // Add a small delay before rendering to ensure DOM is ready
      setTimeout(() => {
        verifier.render().then(() => {
          console.log('reCAPTCHA rendered successfully');
          resolve(verifier);
        }).catch((error) => {
          console.error('Failed to render reCAPTCHA:', error);
          
          // Handle specific reCAPTCHA errors
          if (error.code === 'auth/network-request-failed') {
            reject(new Error('Network error: Please check your internet connection and Firebase configuration.'));
          } else if (error.code === 'auth/invalid-app-credential') {
            reject(new Error('Invalid Firebase configuration. Please check your project settings.'));
          } else {
            reject(error);
          }
        });
      }, 100);

    } catch (error) {
      console.error('Failed to setup reCAPTCHA:', error);
      reject(error);
    }
  });
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

export { auth };
export default app;