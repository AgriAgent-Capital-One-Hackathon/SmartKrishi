import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import ProtectedRoute from "@/components/ProtectedRoutes"
import LandingPage from "@/pages/LandingPage"
import LoginPage from "@/pages/NewLoginPage"
import SignupPage from "@/pages/SignupPage"
import MobileAuthPage from "@/pages/MobileAuthPage"
import MobileLoginPage from "@/pages/MobileLoginPage"
import DashboardPage from "@/pages/DashboardPage"
import { useAuthInit } from "@/hooks/useAuthInit"

function App() {
  // Initialize authentication state on app startup
  useAuthInit();

  return (
    <ThemeProvider defaultTheme="light" storageKey="smartkrishi-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/mobile-auth" element={<MobileAuthPage />} />
          <Route path="/mobile-login" element={<MobileLoginPage />} />
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
