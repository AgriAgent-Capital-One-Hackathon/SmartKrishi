import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token, login, logout, setLoading, isAuthenticating } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // If user is already authenticated, no need to check
      if (isAuthenticated && token) {
        setIsChecking(false);
        return;
      }

      // If there's a token but user is not authenticated, verify it
      if (token && !isAuthenticated) {
        // this handles page reloads/new tabs where we need to verify the token
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

  // If user is authenticated, redirect them away from auth pages to dashboard
  if (isAuthenticated && token) {
    const authPaths = ['/login', '/signup', '/mobile-auth', '/mobile-login', '/'];
    if (authPaths.includes(location.pathname)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Only redirect if we're sure the user is not authenticated AND we've completed the auth check
  if (!isAuthenticated && !token) {
    const publicPaths = ['/login', '/signup', '/mobile-auth', '/mobile-login', '/'];
    if (!publicPaths.includes(location.pathname)) {
      return <Navigate to="/mobile-auth" replace />;
    }
  }

  return <>{children}</>;
}
