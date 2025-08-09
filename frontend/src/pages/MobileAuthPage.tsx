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
import { auth, setupRecaptcha, sendOTPToPhone } from '@/lib/firebase';
import type { ConfirmationResult } from 'firebase/auth';

// Validation schemas
const phoneSchema = z.object({
  phone_number: z.string().min(10, 'Phone number is required'),
  username: z.string().min(2, 'Username must be at least 2 characters').optional(),
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
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [useFirebase, setUseFirebase] = useState(true); // Toggle for dev/prod mode

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

  const handlePhoneSubmit = async (data: PhoneFormData) => {
    setError('');
    setLoading(true);

    try {
      // First check if this is a new user or existing user via our backend
      const response = await fetch('/api/v1/auth/mobile-init', {
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
      if (useFirebase) {
        try {
          // Setup reCAPTCHA
          const recaptchaVerifier = setupRecaptcha('recaptcha-container');
          
          // Send OTP via Firebase
          const confirmation = await sendOTPToPhone(data.phone_number, recaptchaVerifier);
          setConfirmationResult(confirmation);
          
          setPhoneNumber(data.phone_number);
          setIsNewUser(result.is_new_user);
          setStep('otp');
        } catch (firebaseError) {
          console.error('Firebase OTP error:', firebaseError);
          // Fallback to demo mode
          setUseFirebase(false);
          setPhoneNumber(data.phone_number);
          setIsNewUser(result.is_new_user);
          setStep('otp');
          setError('Using demo mode. Use OTP: 123456');
        }
      } else {
        // Demo mode fallback
        setPhoneNumber(data.phone_number);
        setIsNewUser(result.is_new_user);
        setStep('otp');
        setError('Demo mode: Use OTP 123456');
      }
    } catch (err) {
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
      
      // If using Firebase, verify OTP with Firebase first
      if (useFirebase && confirmationResult) {
        try {
          const credential = await confirmationResult.confirm(data.otp);
          firebaseToken = await credential.user.getIdToken();
        } catch (firebaseError) {
          throw new Error('Invalid OTP. Please try again.');
        }
      }

      let endpoint = '/api/v1/auth/mobile-verify';
      let body: any = {
        phone_number: phoneNumber,
        otp: firebaseToken || data.otp, // Use Firebase token or demo OTP
      };

      // If new user, use signup endpoint
      if (isNewUser) {
        endpoint = '/api/v1/auth/mobile-signup';
        body = {
          phone_number: phoneNumber,
          username: phoneForm.getValues('username'),
          firebase_token: firebaseToken || data.otp, // Use Firebase token or demo OTP
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
      const userResponse = await fetch('/api/v1/auth/me', {
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
          <p className="text-gray-600">AI-powered farming assistant</p>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">
              {step === 'phone' ? 'Get Started' : 'Verify OTP'}
            </CardTitle>
            <CardDescription>
              {step === 'phone' 
                ? 'Enter your mobile number to continue' 
                : `Enter the OTP sent to ${phoneNumber}`}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Development Mode Toggle */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Mode:</span>
              <button
                type="button"
                onClick={() => setUseFirebase(!useFirebase)}
                className={`px-3 py-1 text-xs rounded ${
                  useFirebase 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}
              >
                {useFirebase ? 'Firebase OTP' : 'Demo Mode'}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                {typeof error === 'string' ? (
                  <p className="text-red-600 text-sm">{error}</p>
                ) : (
                  error
                )}
              </div>
            )}

            {/* reCAPTCHA Container - Hidden but required for Firebase */}
            <div id="recaptcha-container" ref={recaptchaRef}></div>

            {step === 'phone' ? (
              <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Mobile Number</Label>
                  <PhoneInput
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(value) => {
                      setPhoneNumber(value || '');
                      phoneForm.setValue('phone_number', value || '');
                    }}
                    defaultCountry="IN"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {phoneForm.formState.errors.phone_number && (
                    <p className="text-red-500 text-sm">
                      {phoneForm.formState.errors.phone_number.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Your Name</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your full name"
                    {...phoneForm.register('username')}
                  />
                  {phoneForm.formState.errors.username && (
                    <p className="text-red-500 text-sm">
                      {phoneForm.formState.errors.username.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
                
                <div className="text-center space-y-3 mt-3">
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
              </form>
            ) : (
              <form onSubmit={otpForm.handleSubmit(handleOTPSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    {...otpForm.register('otp')}
                    className="text-center tracking-widest"
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="text-red-500 text-sm">
                      {otpForm.formState.errors.otp.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStep('phone');
                      setError('');
                      otpForm.reset();
                    }}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </div>
              </form>
            )}

            {/* Moved outside the form, only shown on first step */}
            {step === 'phone' && (
              <div className="mt-6 border-t border-gray-200 pt-4 text-center">
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileAuthPage;