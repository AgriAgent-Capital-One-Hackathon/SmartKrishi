import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  auth_provider: 'email' | 'mobile';
  is_active: boolean;
  created_at: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthenticating: boolean;
  user: User | null;
  token: string | null;
  
  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  setAuthenticating: (isAuthenticating: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isLoading: false,
      isAuthenticating: false,
      user: null,
      token: null, // Remove the localStorage.getItem() call here
      
      login: (token: string, user: User) => {
        localStorage.setItem('auth_token', token);
        set({ 
          isAuthenticated: true, 
          token, 
          user,
          isAuthenticating: false // Reset authenticating flag on successful login
        });
      },
      
      logout: () => {
        localStorage.removeItem('auth_token');
        set({ 
          isAuthenticated: false, 
          token: null, 
          user: null,
          isAuthenticating: false // Reset authenticating flag on logout
        });
      },
      
      setLoading: (isLoading: boolean) => set({ isLoading }),
      
      setAuthenticating: (isAuthenticating: boolean) => set({ isAuthenticating }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);