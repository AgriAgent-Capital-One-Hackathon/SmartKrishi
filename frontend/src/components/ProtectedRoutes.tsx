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
      try {
        setIsChecking(true);
        
        // If user is already authenticated, no need to check
        if (isAuthenticated && token) {
          setIsChecking(false);
          return;
        }

        // If there's a token but user is not authenticated, verify it
        if (token && !isAuthenticated) {
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
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [token, isAuthenticated, login, logout, setLoading]);

  // Show loading while checking authentication or during active authentication
  if (isChecking || isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // If user is authenticated and visits auth pages or root, redirect to dashboard
  if (isAuthenticated && token) {
    const authPaths = ['/login', '/signup', '/mobile-auth', '/mobile-login', '/'];
    if (authPaths.includes(location.pathname)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If user is not authenticated, protect only specific routes
  if (!isAuthenticated && !token) {
    const protectedPaths = ['/dashboard'];
    if (protectedPaths.includes(location.pathname)) {
      return <Navigate to="/mobile-auth" replace state={{ from: location }} />;
    }
  }

  return <>{children}</>;
}
