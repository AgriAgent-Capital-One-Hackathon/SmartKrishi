import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';

/**
 * Hook to initialize authentication state on app startup
 * This restores the user's session if they have a valid token
 */
export const useAuthInit = () => {
  const { isAuthenticated, login, logout, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      // Get token from localStorage (zustand persist should handle this)
      const storedToken = localStorage.getItem('auth_token');
      
      // If we have a token but user is not authenticated, verify the token
      if (storedToken && !isAuthenticated) {
        try {
          setLoading(true);
          
          // Verify the token by getting current user
          const user = await authService.getCurrentUser();
          
          // If successful, login the user
          login(storedToken, user);
        } catch (error) {
          console.error('Token verification failed during initialization:', error);
          // Clear invalid token
          logout();
        } finally {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, [isAuthenticated, login, logout, setLoading]);
};
