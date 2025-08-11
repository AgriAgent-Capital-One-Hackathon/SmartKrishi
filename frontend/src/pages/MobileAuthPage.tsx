import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { setupRecaptcha, sendOTPToPhone, getFirebaseIdToken } from '@/lib/firebase';
import type { ConfirmationResult } from 'firebase/auth';

// Validation schemas
const phoneSchema = z.object({
  phone_number: z.string().min(10, 'Phone number is required'),
  username: z.string().min(2, 'Full name is required and must be at least 2 characters'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

const MobileAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, setLoading, isLoading } = useAuthStore();
  const recaptchaRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState<string | React.ReactNode>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  // OTP input state
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Resend timer state
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone_number: '',
      username: '',
    },
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Resend timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Auto-focus first OTP input when switching to OTP step
  useEffect(() => {
    if (step === 'otp') {
      const timer = setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Start resend timer
  const startResendTimer = () => {
    setResendTimer(60);
    setCanResend(false);
  };

  // Retry reCAPTCHA initialization
  const retryRecaptchaInit = async () => {
    setError('');
    setLoading(true);
    
    try {
      await setupRecaptcha('recaptcha-container', { forceNew: true, size: 'invisible' });
      setError('reCAPTCHA initialized successfully. You can now try sending OTP again.');
    } catch (err) {
      console.error('Retry reCAPTCHA error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize reCAPTCHA. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
    
    // Update form value
    const otpString = newOtpValues.join('');
    otpForm.setValue('otp', otpString);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP input key down
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const otpString = otpValues.join('');
      if (otpString.length === 6) {
        otpForm.handleSubmit(handleOTPSubmit)();
      }
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setError('');
    setLoading(true);
    
    try {
      console.log('Resending OTP via Firebase...');
      
      // Create a new reCAPTCHA verifier for resend
      const verifier = await setupRecaptcha('recaptcha-container', { forceNew: true, size: 'invisible' });
      
      const confirmation = await sendOTPToPhone(phoneNumber, verifier);
      setConfirmationResult(confirmation);
      
      setError(''); // Clear any previous errors
      setSuccessMessage('OTP resent successfully! Please check your phone.');
      startResendTimer();
      setOtpValues(['', '', '', '', '', '']);
      otpForm.setValue('otp', '');
      otpRefs.current[0]?.focus();
      
    } catch (err) {
      console.error('Resend OTP error:', err);
      setSuccessMessage(''); // Clear any success messages
      setError(err instanceof Error ? err.message : 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (data: PhoneFormData) => {
    setError('');
    setSuccessMessage(''); // Clear any previous success messages
    setLoading(true);

    try {
      // First check if this is a new user or existing user via our backend
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/mobile-init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: data.phone_number,
          username: data.username,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to initialize mobile auth');
      }

      // Check if the phone number is already registered
      if (!result.is_new_user) {
        setError(
          <div className="flex flex-col items-center space-y-2">
            <p>This phone number is already registered. Please sign in instead.</p>
            <Button 
              type="button" 
              variant="outline" 
              className="mt-2 text-green-600 border-green-600 hover:bg-green-50"
              onClick={() => navigate('/mobile-login', { 
                state: { phoneNumber: data.phone_number } 
              })}
            >
              Go to Sign In
            </Button>
          </div>
        );
        setLoading(false);
        return;
      }

      // Send OTP via Firebase
      try {
        console.log('Attempting to send OTP via Firebase...');
        
        // Create a new reCAPTCHA verifier for each OTP send attempt
        const verifier = await setupRecaptcha('recaptcha-container', { forceNew: true, size: 'invisible' });
        
        // Send OTP via Firebase
        const confirmation = await sendOTPToPhone(data.phone_number, verifier);
        setConfirmationResult(confirmation);
        
        console.log('OTP sent successfully via Firebase');
        setPhoneNumber(data.phone_number);
        setIsNewUser(result.is_new_user);
        setStep('otp');
        startResendTimer(); // Start the 60-second timer
        setError(''); // Clear any previous errors
        setSuccessMessage('OTP sent successfully! Please check your phone.');
      } catch (firebaseError) {
        console.error('Firebase OTP error:', firebaseError);
        const errorMessage = firebaseError instanceof Error ? firebaseError.message : String(firebaseError);
        
        // Show retry button for reCAPTCHA-related errors
        if (errorMessage.includes('reCAPTCHA') || errorMessage.includes('network-request-failed')) {
          setError(
            <div className="flex flex-col items-center space-y-2">
              <p>{errorMessage}</p>
              <Button 
                type="button" 
                variant="outline" 
                className="mt-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                onClick={retryRecaptchaInit}
                disabled={isLoading}
              >
                {isLoading ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          );
        } else {
          setError(`Failed to send OTP: ${errorMessage}`);
        }
        setLoading(false);
        return;
      }
    } catch (err) {
      setSuccessMessage(''); // Clear any success messages
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSubmit = async (data: OTPFormData) => {
    setError('');
    setLoading(true);

    try {
      let firebaseToken = null;
      
      // Verify OTP with Firebase first
      if (confirmationResult) {
        try {
          console.log('Confirming OTP with Firebase...');
          const credential = await confirmationResult.confirm(data.otp);
          console.log('OTP confirmed, getting ID token...');
          
          // Use the helper function with retry logic
          firebaseToken = await getFirebaseIdToken(credential.user);
          console.log('Firebase ID token obtained successfully');
          
        } catch (firebaseError) {
          console.error('Firebase OTP confirmation error:', firebaseError);
          throw new Error('Invalid OTP. Please try again.');
        }
      } else {
        throw new Error('No OTP confirmation available. Please request a new OTP.');
      }

      let endpoint = `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/mobile-verify`;
      let body: any = {
        phone_number: phoneNumber,
        otp: firebaseToken, // Use Firebase token only
      };

      // If new user, use signup endpoint
      if (isNewUser) {
        endpoint = `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/mobile-signup`;
        body = {
          phone_number: phoneNumber,
          username: phoneForm.getValues('username'),
          firebase_token: firebaseToken, // Use Firebase token only
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to verify OTP');
      }

      // Get user info
      const userResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${result.access_token}`,
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        login(result.access_token, userData);
        navigate('/dashboard');
      } else {
        // Fallback: create user object from phone number
        const userData = {
          id: Date.now(), // Temporary ID
          name: phoneForm.getValues('username') || 'User',
          phone_number: phoneNumber,
          auth_provider: 'mobile' as const,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        login(result.access_token, userData);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Branding */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-2">🌱 SmartKrishi</h1>
          <p className="text-gray-600">
            {step === 'phone' ? 'AI-powered farming assistant' : 'Verify your identity'}
          </p>
        </div>

        <Card className="w-full shadow-lg rounded-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">
              {step === 'phone' ? 'Get Started' : 'Verify OTP'}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              {step === 'phone' 
                ? 'Enter your details to continue' 
                : `Enter the 6-digit code sent to ${phoneNumber}`}
            </CardDescription>
          </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              {typeof error === 'string' ? (
                <p className="text-red-600 text-sm">{error}</p>
              ) : (
                error
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {/* reCAPTCHA Container - Hidden but present for invisible reCAPTCHA */}
          <div id="recaptcha-container" ref={recaptchaRef} className="h-0 overflow-hidden"></div>

          {step === 'phone' ? (
            <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-6">
              {/* Full Name Input */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Full Name
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your full name"
                  className="rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  {...phoneForm.register('username')}
                />
                {phoneForm.formState.errors.username && (
                  <p className="text-red-500 text-sm">
                    {phoneForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              {/* Mobile Number Input */}
              <div className="space-y-2">
                <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700">
                  Mobile Number
                </Label>
                <PhoneInput
                  placeholder="+91 9876543210"
                  value={phoneNumber}
                  onChange={(value) => {
                    setPhoneNumber(value || '');
                    phoneForm.setValue('phone_number', value || '');
                  }}
                  defaultCountry="IN"
                />
                {phoneForm.formState.errors.phone_number && (
                  <p className="text-red-500 text-sm">
                    {phoneForm.formState.errors.phone_number.message}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
              
              <div className="text-center space-y-3 mt-6">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate('/mobile-login')}
                    className="text-green-600 hover:text-green-700 font-medium hover:underline"
                  >
                    Sign in
                  </button>
                </p>
                
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-sm text-gray-500 hover:text-gray-700 hover:underline block"
                >
                  ← Back to Home
                </button>
              </div>
              
              <div className="border-t border-gray-200 pt-4 text-center">
                <p className="text-sm text-gray-600">
                  Prefer email?{" "}
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="text-green-600 hover:text-green-700 font-medium hover:underline"
                  >
                    Use Email/Password Instead
                  </button>
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Back Button and Phone Display */}
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('phone');
                    setError('');
                    setOtpValues(['', '', '', '', '', '']);
                    otpForm.reset();
                    setResendTimer(0);
                    setCanResend(true);
                  }}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  ← Back
                </Button>
                <p className="text-sm text-gray-600">Sent to {phoneNumber}</p>
              </div>

              {/* OTP Input Boxes */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700 block text-center">
                  Enter 6-digit OTP
                </Label>
                <div className="flex justify-center space-x-3">
                  {otpValues.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                      inputMode="numeric"
                    />
                  ))}
                </div>
                {otpForm.formState.errors.otp && (
                  <p className="text-red-500 text-sm text-center">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              {/* Verify Button */}
              <Button 
                type="button"
                onClick={() => {
                  const otpString = otpValues.join('');
                  if (otpString.length === 6) {
                    otpForm.setValue('otp', otpString);
                    otpForm.handleSubmit(handleOTPSubmit)();
                  } else {
                    setError('Please enter all 6 digits');
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                disabled={isLoading || otpValues.join('').length !== 6}
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>

              {/* Resend OTP */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-gray-600">
                    Resend OTP in {resendTimer} seconds
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={!canResend || isLoading}
                    className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline disabled:text-gray-400 disabled:hover:no-underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default MobileAuthPage;