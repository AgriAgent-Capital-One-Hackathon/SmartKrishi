import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { authService } from "@/services/auth"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginPage = () => {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const { login, setLoading, isLoading } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setError("")
    setLoading(true)
    
    try {
      // Add this line to prevent ProtectedRoute redirects during login
      useAuthStore.getState().setAuthenticating(true);
      
      // Call actual login API
      const authResult = await authService.login({
        email: data.email,
        password: data.password
      })
      
      // Get user info
      const userData = await authService.getCurrentUser()
      login(authResult.access_token, userData)
      navigate("/dashboard")
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Login failed')
      // Make sure to clear any lingering token
    } finally {
      setLoading(false)
      // Reset the flag
      useAuthStore.getState().setAuthenticating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Branding */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-2">🌱 SmartKrishi</h1>
          <p className="text-gray-600">Welcome back!</p>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription>
              Sign in to your SmartKrishi account
            </CardDescription>
          </CardHeader>
        
        <CardContent>
          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="farmer@example.com"
                {...register("email")}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...register("password")}
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            
            <div className="text-center space-y-3 mt-3">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="text-green-600 hover:text-green-700 font-medium hover:underline"
                >
                  Sign up
                </button>
              </p>
              
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-sm text-gray-500 hover:text-gray-700 hover:underline block"
              >
                ← Back to Home
              </button>
            </div>
          </form>

          {/* Moved outside the form */}
          <div className="mt-6 border-t border-gray-200 pt-4 text-center">
            <p className="text-sm text-gray-600">
              Or{" "}
              <button
                type="button"
                onClick={() => navigate("/mobile-login")}
                className="text-green-600 hover:text-green-700 font-medium hover:underline"
              >
                Use Mobile Number Instead
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

export default LoginPage
