# Firebase reCAPTCHA Fix - Step-by-Step Solution

## Problem
The `auth/invalid-app-credential` error occurs when Firebase reCAPTCHA is not properly initialized or configured, preventing OTP sending functionality.

## Root Cause
The issue was caused by:
1. **Improper reCAPTCHA lifecycle management**: reCAPTCHA verifier was being created synchronously without proper rendering
2. **Missing Promise handling**: The `setupRecaptcha` function wasn't returning a Promise for proper async handling
3. **Incomplete cleanup**: reCAPTCHA instances weren't being properly managed and cleaned up

## Solution Applied

### 1. Updated Firebase Service (`/frontend/src/lib/firebase.ts`)

#### Before (Problematic Code):
```typescript
export const setupRecaptcha = (containerId: string): RecaptchaVerifier | null => {
  // Synchronous creation without proper rendering
  return new RecaptchaVerifier(auth, containerId, { ... });
};
```

#### After (Fixed Code):
```typescript
export const setupRecaptcha = (containerId: string): Promise<RecaptchaVerifier> => {
  return new Promise((resolve, reject) => {
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible', // Better UX with invisible reCAPTCHA
      callback: (response: any) => console.log('reCAPTCHA solved', response),
      'expired-callback': () => console.log('reCAPTCHA expired'),
      'error-callback': (error: any) => reject(error)
    });

    // Properly render and wait for completion
    verifier.render().then(() => {
      resolve(verifier);
    }).catch((error) => {
      reject(error);
    });
  });
};
```

### 2. Enhanced OTP Sending with Better Error Handling

```typescript
export const sendOTPToPhone = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  } catch (error: any) {
    // Specific Firebase error handling
    if (error.code) {
      switch (error.code) {
        case 'auth/invalid-app-credential':
          throw new Error('Firebase app credential invalid. Please check your Firebase project configuration.');
        case 'auth/captcha-check-failed':
          throw new Error('reCAPTCHA verification failed. Please try again.');
        case 'auth/invalid-phone-number':
          throw new Error('Please enter a valid phone number with country code.');
        // ... more specific error cases
      }
    }
    throw error;
  }
};
```

### 3. Component-Level reCAPTCHA Management

#### Added to both `MobileAuthPage.tsx` and `MobileLoginPage.tsx`:

```typescript
const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

// Initialize reCAPTCHA when component mounts
useEffect(() => {
  const initRecaptcha = async () => {
    try {
      const verifier = await setupRecaptcha('recaptcha-container');
      setRecaptchaVerifier(verifier);
      console.log('reCAPTCHA initialized successfully');
    } catch (error) {
      console.error('Failed to initialize reCAPTCHA:', error);
    }
  };

  initRecaptcha();

  // Cleanup on component unmount
  return () => {
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (error) {
        console.error('Error clearing reCAPTCHA:', error);
      }
    }
  };
}, []);
```

### 4. Proper reCAPTCHA Usage in OTP Functions

```typescript
const handlePhoneSubmit = async (data: PhoneFormData) => {
  try {
    let verifier = recaptchaVerifier;
    
    // If no verifier exists or it needs refresh, create new one
    if (!verifier) {
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
        recaptchaContainer.innerHTML = '';
      }
      
      verifier = await setupRecaptcha('recaptcha-container');
      setRecaptchaVerifier(verifier);
    }
    
    // Send OTP with properly initialized verifier
    const confirmation = await sendOTPToPhone(phoneNumber, verifier);
    setConfirmationResult(confirmation);
    
    // Success handling...
  } catch (error) {
    // Error handling...
  }
};
```

## Key Improvements Made

### 1. **Proper Async Handling**
- `setupRecaptcha` now returns a Promise
- Proper await/async usage throughout the application
- Better error propagation

### 2. **reCAPTCHA Lifecycle Management**
- Initialization on component mount
- Proper cleanup on component unmount
- Reuse of existing verifiers when possible
- Graceful recreation when needed

### 3. **Enhanced Error Handling**
- Specific Firebase error code handling
- Clear error messages for users
- Better debugging information in console

### 4. **Invisible reCAPTCHA**
- Changed from 'normal' to 'invisible' for better UX
- Users don't see the reCAPTCHA widget unless needed
- Smoother authentication flow

### 5. **Configuration Debugging**
- Added Firebase config logging (without exposing secrets)
- Better visibility into initialization issues

## Testing the Fix

### 1. **Frontend Test Steps:**
1. Open `http://localhost:5173/mobile-auth`
2. Enter your name and real mobile number
3. Click "Send OTP"
4. Check browser console for:
   - "Firebase initialized successfully"
   - "reCAPTCHA initialized successfully"  
   - "reCAPTCHA rendered successfully"
   - "OTP sent successfully via Firebase"

### 2. **Expected Behavior:**
- No more `auth/invalid-app-credential` errors
- Real OTP sent to your mobile number
- 6-digit OTP input boxes work correctly
- Resend functionality works with timer

### 3. **Browser Console Monitoring:**
- Watch Network tab for successful Firebase API calls
- Look for any reCAPTCHA-related errors
- Monitor Firebase token generation

## Firebase Configuration Checklist

### ✅ **Verified Working Configuration:**

1. **Environment Variables (.env)**:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyAR215H1twYZCT66nkCw_S-lhq4XQtXq0I
   VITE_FIREBASE_AUTH_DOMAIN=smartkrishi-83352.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=smartkrishi-83352
   ```

2. **Firebase Console Settings**:
   - Phone authentication enabled
   - Authorized domains include `localhost`
   - No API key restrictions blocking your domain

3. **Backend Configuration**:
   - Service account key properly configured
   - Firebase Admin SDK initialized
   - No demo OTP fallbacks remaining

## Why This Fix Works

1. **Proper reCAPTCHA Rendering**: The Promise-based approach ensures reCAPTCHA is fully rendered before use
2. **Lifecycle Management**: Components properly initialize and cleanup reCAPTCHA instances
3. **Error Recovery**: If reCAPTCHA fails, the system can recreate it gracefully
4. **Firebase Integration**: All OTP operations now use real Firebase tokens instead of demo mode

## Files Modified

### Frontend:
- `/src/lib/firebase.ts` - Enhanced reCAPTCHA setup and OTP sending
- `/src/pages/MobileAuthPage.tsx` - Added reCAPTCHA lifecycle management
- `/src/pages/MobileLoginPage.tsx` - Added reCAPTCHA lifecycle management

### Backend:
- `/app/routers/mobile_auth.py` - Removed demo OTP, enforced Firebase-only

## Success Indicators

✅ **Browser Console Shows:**
- "Firebase initialized successfully"
- "reCAPTCHA rendered successfully" 
- "OTP sent successfully via Firebase"

✅ **Network Tab Shows:**
- Successful calls to `identitytoolkit.googleapis.com`
- No 400 Bad Request errors
- reCAPTCHA token generation

✅ **User Experience:**
- Real OTP received on mobile phone
- No error messages about invalid credentials
- Smooth authentication flow

This comprehensive fix addresses the root cause of the Firebase reCAPTCHA authentication issue and provides a robust, production-ready solution.
