import React, { useState } from 'react';
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

// Validation schemas
const phoneSchema = z.object({
  phone_number: z.string().min(10, 'Phone number is required'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

const MobileLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, setLoading, isLoading } = useAuthStore();
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [error, setError] = useState('');

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone_number: '',
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
      const response = await fetch('/api/v1/auth/mobile-init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: data.phone_number,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to send OTP');
      }

      if (result.is_new_user) {
        setError('Account not found. Please sign up first.');
        return;
      }

      setPhoneNumber(data.phone_number);
      setStep('otp');
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
      const response = await fetch('/api/v1/auth/mobile-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          otp: data.otp,
        }),
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
          name: 'User',
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
          <p className="text-gray-600">Welcome back!</p>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">
              {step === 'phone' ? 'Sign In' : 'Verify OTP'}
            </CardTitle>
            <CardDescription>
              {step === 'phone' 
                ? 'Enter your registered mobile number' 
                : `Enter the OTP sent to ${phoneNumber}`}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

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
                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-lg ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {phoneForm.formState.errors.phone_number && (
                    <p className="text-red-500 text-sm">
                      {phoneForm.formState.errors.phone_number.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
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
                    className="text-lg h-12 text-center tracking-widest"
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
                    className="flex-1 h-12"
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
                    className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Sign In'}
                  </Button>
                </div>
              </form>
            )}

            <div className="text-center pt-4 space-y-2">
              {step === 'phone' && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-green-600 hover:text-green-700 text-sm underline block w-full"
                  >
                    Use Email/Password Instead
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/mobile-auth')}
                    className="text-gray-600 hover:text-gray-700 text-sm underline block w-full"
                  >
                    Don't have an account? Sign up
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 text-xs underline block w-full"
              >
                ← Back to Home
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileLoginPage;
