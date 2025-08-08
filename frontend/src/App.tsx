import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import LandingPage from "@/pages/LandingPage"
import LoginPage from "@/pages/LoginPage"
import SignupPage from "@/pages/SignupPage"
import MobileAuthPage from "@/pages/MobileAuthPage"
import MobileLoginPage from "@/pages/MobileLoginPage"
import DashboardPage from "@/pages/DashboardPage"

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="smartkrishi-ui-theme">
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/mobile-auth" element={<MobileAuthPage />} />
          <Route path="/mobile-login" element={<MobileLoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
