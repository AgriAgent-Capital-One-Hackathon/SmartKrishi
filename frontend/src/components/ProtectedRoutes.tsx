import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, token, login, logout, setLoading, isAuthenticating } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // If we are actively logging in/signing up, don't perform this check.
      if (isAuthenticating) {
        setIsChecking(false);
        return;
      }

      // If we already know the user is authenticated, no need to check again
      if (isAuthenticated) {
        setIsChecking(false);
        return;
      }

      if (token) {
        // We have a token but user not authenticated in state.
        // This handles page reloads where we need to verify the token.
        try {
          setLoading(true);
          const user = await authService.getCurrentUser();
          login(token, user);
        } catch (error) {
          console.error('Token verification failed:', error);
          logout();
        } finally {
          setLoading(false);
        }
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [token, isAuthenticated, login, logout, setLoading, isAuthenticating]);

  // Show loading while checking authentication or during active authentication
  if (isChecking || isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Only redirect if we're sure the user is not authenticated
  if (!isAuthenticated && !token) {
    return <Navigate to="/mobile-auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
