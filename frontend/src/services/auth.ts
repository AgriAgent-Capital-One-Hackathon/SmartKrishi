import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const token = localStorage.getItem('auth_token');

    // Only auto-logout/redirect if we had a token — avoid redirecting during login/signup attempts
    if (status === 401 && token) {
      // clear token and optionally update your zustand store
      localStorage.removeItem('auth_token');

      // If you want to update zustand store too (graceful)
      try {
        // import/use the store's logout action (works because authStore uses zustand)
        const { logout } = require('@/store/authStore').useAuthStore.getState();
        logout();
      } catch (e) {
        // fallback - still fine to remove token
        console.warn('Could not call logout on store', e);
      }

      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);


// Types
export interface User {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  auth_provider: 'email' | 'mobile';
  is_active: boolean;
  created_at: string;
}

export interface MobileAuthInitRequest {
  phone_number: string;
  username?: string;
}

export interface MobileAuthInitResponse {
  message: string;
  is_new_user: boolean;
  phone_number: string;
}

export interface MobileAuthVerifyRequest {
  phone_number: string;
  otp: string;
}

export interface MobileSignupRequest {
  phone_number: string;
  username: string;
  otp: string;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface EmailSignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Auth Service
export const authService = {
  // Initialize mobile authentication (send OTP)
  async mobileAuthInit(data: MobileAuthInitRequest): Promise<MobileAuthInitResponse> {
    const response = await api.post('/auth/mobile-init', data);
    return response.data;
  },

  // Verify OTP for existing users
  async mobileAuthVerify(data: MobileAuthVerifyRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/mobile-verify', data);
    return response.data;
  },

  // Complete signup for new users
  async mobileSignup(data: MobileSignupRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/mobile-signup', data);
    return response.data;
  },

  // Email/password login
  async login(data: EmailLoginRequest): Promise<AuthResponse> {
    try {
      const response = await api.post('/auth/login', data);
      // Store token immediately after successful login
      localStorage.setItem('auth_token', response.data.access_token);
      return response.data;
    } catch (error) {
      // Make sure to properly throw the error but don't redirect
      throw error;
    }
  },

  // Email/password signup
  async signup(data: EmailSignupRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/signup', data);
    // Store token immediately after successful signup
    localStorage.setItem('auth_token', response.data.access_token);
    return response.data;
  },

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout (client-side token removal)
  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
  },
};

export default api;
