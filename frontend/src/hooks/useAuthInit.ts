import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * Hook to initialize authentication state on app startup
 * This ensures the auth store is properly hydrated from localStorage
 */
export const useAuthInit = () => {
  const { token } = useAuthStore();

  useEffect(() => {
    // Just ensure the store is initialized
    // The actual token verification will be handled by ProtectedRoute
    console.log('Auth initialized, token present:', !!token);
  }, [token]);
};
