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
import axios from "axios"

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const login = useAuthStore(state => state.login)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    try {
      setError(null)
      
      // Call the auth service for signup
      const response = await authService.signup({
        name: data.name,
        email: data.email,
        password: data.password
      })
      
      // Get user info after signup
      const user = await authService.getCurrentUser()
      
      // Update the auth store
      login(response.access_token, user)
      
      // Navigate to dashboard
      navigate('/dashboard')
    } catch (error) {
      // Enhanced error handling to properly display backend error messages
      console.error("Full error object:", error);
      if (axios.isAxiosError(error)) {
        // Log full error response for debugging
        console.log("Error response data:", error.response?.data);
        
        // Check different possible locations of error message
        const errorMessage = 
          error.response?.data?.detail || 
          error.response?.data?.message || 
          (typeof error.response?.data === 'string' ? error.response.data : null) ||
          'Signup failed';
        
        setError(errorMessage);
      } else {
        setError(error instanceof Error ? error.message : 'Signup failed');
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Branding */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-2">🌱 SmartKrishi</h1>
          <p className="text-gray-600">Join smart farming</p>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <CardDescription>
              Join SmartKrishi to start smart farming
            </CardDescription>
          </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your full name"
                {...register("name")}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

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
                  placeholder="••••••••"
                  {...register("password")}
                  className={errors.password ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ?<Eye className="h-4 w-4" />:<EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <Eye className="h-4 w-4" />:<EyeOff className="h-4 w-4" /> }
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center space-y-3 mt-3">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-green-600 hover:text-green-700 font-medium hover:underline"
                >
                  Sign in
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
                onClick={() => navigate("/mobile-auth")}
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
