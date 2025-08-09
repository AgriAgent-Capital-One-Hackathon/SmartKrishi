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

// Initialize Firebase
let app: any = null;
let auth: any = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization failed:', error);
}

// Phone authentication utilities
export const setupRecaptcha = (containerId: string): RecaptchaVerifier | null => {
  if (!auth) {
    console.error('Firebase auth not initialized');
    return null;
  }
  
  try {
    // Clear any existing reCAPTCHA
    const existingContainer = document.getElementById(containerId);
    if (existingContainer) {
      existingContainer.innerHTML = '';
    }
    
    return new RecaptchaVerifier(auth, containerId, {
      size: 'normal',
      callback: (response: any) => {
        console.log('reCAPTCHA solved', response);
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      },
      'error-callback': (error: any) => {
        console.error('reCAPTCHA error:', error);
      }
    });
  } catch (error) {
    console.error('Failed to setup reCAPTCHA:', error);
    return null;
  }
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
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    console.log('OTP sent successfully');
    return confirmationResult;
  } catch (error) {
    console.error('Error sending OTP:', error);
    
    // Provide more specific error messages
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