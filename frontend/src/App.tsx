import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import ProtectedRoute from "@/components/ProtectedRoutes"
import LandingPage from "@/pages/LandingPage"
import UnifiedAuthPage from "@/pages/AuthPage"
import DashboardPage from "@/pages/DashboardPage"
import { useAuthInit } from "@/hooks/useAuthInit"
import { useEffect, useState } from "react"

function App() {
  // Initialize authentication state on app startup
  useAuthInit();
  
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Small delay to ensure Zustand persist has rehydrated
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="smartkrishi-ui-theme">
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/auth" element={<UnifiedAuthPage />} />
          <Route path="/login" element={<UnifiedAuthPage />} /> {/* Redirect for compatibility */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
