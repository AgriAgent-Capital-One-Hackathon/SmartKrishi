import { ArrowRight, Bot, Cloud, Eye, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useNavigate } from "react-router-dom"

export default function LandingPage() {
  const navigate = useNavigate()

  const features = [
    {
      icon: <Bot className="h-8 w-8 text-green-600" />,
      title: "AI Crop Advisor",
      description: "Get personalized recommendations for your crops based on soil, weather, and market conditions."
    },
    {
      icon: <Cloud className="h-8 w-8 text-green-600" />,
      title: "Real-Time Weather",
      description: "Stay updated with accurate weather forecasts tailored for your farming location."
    },
    {
      icon: <Eye className="h-8 w-8 text-green-600" />,
      title: "Disease Detection",
      description: "Upload images of your crops to identify diseases and get treatment recommendations."
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      title: "Market Insights",
      description: "Real-time market prices and trends to help you make better selling decisions."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            <span className="text-green-600">SmartKrishi</span> —<br />
            Your AI-Powered Farming Assistant
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Get personalized crop advice, real-time weather, and market insights to boost your farm's productivity.
          </p>
          
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-green-600 hover:bg-green-700"
            onClick={() => navigate("/mobile-auth")}
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Smart Farming
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Leverage the power of AI and technology to make informed decisions about your crops.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SmartKrishi</h3>
              <p className="text-gray-600">
                Empowering farmers with AI-driven insights for better crop management and higher yields.
              </p>
            </div>
            
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-green-600 transition-colors">About</a></li>
                <li><a href="#" className="text-gray-600 hover:text-green-600 transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-600 hover:text-green-600 transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Language</h4>
              <Button variant="outline" className="w-full">
                English (हिंदी coming soon)
              </Button>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-600">
              © 2025 SmartKrishi. Made with ❤️ for Indian farmers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
