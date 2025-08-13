import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Bot, Cloud, Eye, TrendingUp, ChevronDown, Github, Mail, Sparkles, Zap, Target } from "lucide-react"
// Add these imports for brand icons
import { FaTwitter, FaLinkedin, FaInstagram, FaGithub } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useNavigate } from "react-router-dom"

export default function LandingPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [bgImageLoaded, setBgImageLoaded] = useState(false)
  const [bgImageError, setBgImageError] = useState(false)
  const howItWorksRef = useRef<HTMLElement>(null)

  const { scrollY } = useScroll()
  const scale = useTransform(scrollY, [0, 300], [1, 1.05])

  useEffect(() => {
    const img = new Image()
    img.onload = () => setBgImageLoaded(true)
    img.onerror = () => setBgImageError(true)
    img.src = "/farmerbackground.png"
  }, [])

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }

  const features = [
    {
      icon: <Bot className="h-10 w-10 text-emerald-500" />,
      title: "AI Crop Advisor",
      description: "Get personalized recommendations for your crops based on soil, weather, and market conditions.",
      gradient: "from-emerald-500/10 to-green-500/10"
    },
    {
      icon: <Cloud className="h-10 w-10 text-blue-500" />,
      title: "Real-Time Weather",
      description: "Stay updated with accurate weather forecasts tailored for your farming location.",
      gradient: "from-blue-500/10 to-cyan-500/10"
    },
    {
      icon: <Eye className="h-10 w-10 text-purple-500" />,
      title: "Disease Detection",
      description: "Upload images of your crops to identify diseases and get treatment recommendations.",
      gradient: "from-purple-500/10 to-pink-500/10"
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-orange-500" />,
      title: "Market Insights",
      description: "Real-time market prices and trends to help you make better selling decisions.",
      gradient: "from-orange-500/10 to-red-500/10"
    }
  ]

  const howItWorksSteps = [
    {
      step: 1,
      title: "Ask Your Question",
      description: "Type, speak, or upload images about your farming concerns",
      icon: <Sparkles className="h-8 w-8" />
    },
    {
      step: 2,
      title: "AI Analysis",
      description: "Our advanced AI analyzes your input with agricultural expertise",
      icon: <Zap className="h-8 w-8" />
    },
    {
      step: 3,
      title: "Get Recommendations",
      description: "Receive personalized advice tailored to your specific needs",
      icon: <Target className="h-8 w-8" />
    }
  ]

  const backgroundStyle = !bgImageError && bgImageLoaded 
    ? { backgroundImage: "url('/farmerbackground.png')" }
    : {}

  return (
    <div className="w-full bg-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Fixed Background */}
        <div className="fixed inset-0 z-0">
          <motion.div 
            className={`w-full h-full ${bgImageError || !bgImageLoaded ? 'bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700' : 'bg-cover bg-center bg-fixed'}`}
            style={{ ...backgroundStyle, scale }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/60"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        </div>
        
        <div className="relative z-10 text-center max-w-6xl mx-auto">
          <motion.h1 
            className="text-5xl sm:text-6xl lg:text-8xl font-bold text-white mb-8 leading-tight"
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent">
              SmartKrishi
            </span>
            <br />
            <span className="text-4xl sm:text-5xl lg:text-6xl font-medium">
              AI-Powered Agricultural Advisor
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl sm:text-2xl lg:text-3xl text-gray-100 mb-12 max-w-4xl mx-auto leading-relaxed font-light"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            Revolutionize your farming with personalized AI insights, real-time analytics, and precision agriculture solutions.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <Button 
              size="lg" 
              className="text-lg px-10 py-7 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500 transform hover:scale-105 border-0 rounded-2xl"
              onClick={() => navigate("/login")}
            >
              Start Your Journey
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
            
            <Button 
              variant="outline"
              size="lg" 
              className="text-lg px-10 py-7 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md shadow-2xl transition-all duration-500 rounded-2xl"
              onClick={scrollToHowItWorks}
            >
              <ChevronDown className="mr-3 h-6 w-6" />
              Discover How
            </Button>
          </motion.div>

          {/* Floating elements for visual appeal */}
          <motion.div 
            className="absolute top-20 left-10 w-20 h-20 bg-emerald-400/20 rounded-full blur-xl"
            animate={{ 
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div 
            className="absolute bottom-20 right-10 w-32 h-32 bg-green-400/20 rounded-full blur-xl"
            animate={{ 
              y: [0, 20, 0],
              scale: [1, 0.9, 1],
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-6">
              Smart Solutions for Modern Farming
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Harness the power of artificial intelligence to optimize every aspect of your agricultural operations.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: index * 0.15 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.02,
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                className="group"
              >
                <Card className={`h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br ${feature.gradient} backdrop-blur-sm`}>
                  <CardHeader className="pb-6">
                    <div className="flex justify-center mb-6 transform group-hover:scale-110 transition-transform duration-500">
                      <div className="p-4 bg-white rounded-3xl shadow-lg">
                        {feature.icon}
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 text-center">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-gray-700 leading-relaxed text-lg">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section 
        ref={howItWorksRef}
        className="relative py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-20"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 bg-clip-text text-transparent mb-6">
              Simple. Smart. Effective.
            </h2>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Transform your farming decisions with AI-powered insights in three effortless steps.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {howItWorksSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.05,
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white via-emerald-50/30 to-green-50/50 backdrop-blur-sm group">
                  <CardHeader className="pb-6 text-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-500">
                        <div className="text-white transform group-hover:scale-110 transition-transform duration-300">
                          {step.icon}
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {step.step}
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors duration-300">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center pb-8">
                    <CardDescription className="text-gray-700 leading-relaxed text-lg">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Farm?
            </h2>
            <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
              Join thousands of farmers who are already using AI to boost their productivity and profits.
            </p>
            <Button 
              size="lg" 
              className="text-lg px-12 py-7 bg-white text-emerald-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 rounded-2xl font-semibold"
              onClick={() => navigate("/auth")}
            >
              Get Started Today
              <ArrowRight className="ml-3 h-6 w-6" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Dynamic Footer */}
      <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated background elements */}
        <motion.div 
          className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-10 right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 0.8, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-teal-500/5 rounded-full blur-3xl"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="md:col-span-2">
              <motion.h3 
                className="text-2xl font-bold mb-4 flex items-center"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <span className="mr-2">🌱</span>
                <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                  SmartKrishi
                </span>
              </motion.h3>
              <motion.p 
                className="text-gray-300 mb-6 max-w-md leading-relaxed"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                viewport={{ once: true }}
              >
                Pioneering the future of agriculture through artificial intelligence. 
                Empowering farmers with data-driven insights for sustainable farming.
              </motion.p>
              <div className="flex space-x-4">
                <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:border-gray-400 transition-all duration-300">
                    <FaGithub className="w-4 h-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-blue-500/20 hover:border-blue-400 hover:text-blue-400 transition-all duration-300">
                    <FaTwitter className="w-4 h-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-blue-600/20 hover:border-blue-500 hover:text-blue-500 transition-all duration-300">
                    <FaLinkedin className="w-4 h-4" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20 hover:border-pink-400 hover:text-pink-400 transition-all duration-300">
                    <FaInstagram className="w-4 h-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {["About", "Features", "Contact", "Support", "Privacy"].map((link, index) => (
                  <motion.li 
                    key={link}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index }}
                    viewport={{ once: true }}
                    whileHover={{ x: 5 }}
                  >
                    <a href="#" className="text-gray-300 hover:text-emerald-400 transition-colors">
                      {link}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-semibold text-white mb-4">Stay Connected</h4>
              <p className="text-gray-300 text-sm mb-4">
                Get the latest updates and farming insights.
              </p>
              <div className="space-y-3">
                <motion.div whileHover={{ scale: 1.02 }} whileFocus={{ scale: 1.02 }}>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 rounded-xl backdrop-blur-sm text-sm"
                  />
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 text-sm py-2">
                    <Mail className="w-4 h-4 mr-2" />
                    Subscribe
                  </Button>
                </motion.div>
                <motion.div 
                  className="text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="inline-block px-3 py-1 bg-gray-800/50 text-gray-300 rounded-lg border border-gray-600 backdrop-blur-sm text-xs">
                    🌍 English | हिंदी (Soon)
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="border-t border-gray-700/50 pt-6 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <motion.p 
              className="text-gray-400"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              © 2025 SmartKrishi. Cultivating the future of farming with AI.
            </motion.p>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}
