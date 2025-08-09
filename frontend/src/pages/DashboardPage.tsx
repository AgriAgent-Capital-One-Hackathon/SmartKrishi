import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import ChatInput from "@/components/ui/chat-input"
import Header from "@/components/ui/header"
import { 
  Leaf, 
  Sun, 
  Bug, 
  DollarSign
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { authService } from "@/services/auth"

interface SuggestionCard {
  id: string
  icon: React.ReactNode
  text: string
  prompt: string
}

const suggestionCards: SuggestionCard[] = [
  {
    id: "crop-care",
    icon: <Leaf className="w-6 h-6 text-green-600" />,
    text: "Crop Care Tips",
    prompt: "What are the best practices for caring for my crops during this season?"
  },
  {
    id: "weather-advice",
    icon: <Sun className="w-6 h-6 text-yellow-500" />,
    text: "Weather Insights",
    prompt: "How will the current weather conditions affect my farming activities?"
  },
  {
    id: "pest-management",
    icon: <Bug className="w-6 h-6 text-red-500" />,
    text: "Pest Control",
    prompt: "Help me identify and manage pests affecting my crops."
  },
  {
    id: "market-prices",
    icon: <DollarSign className="w-6 h-6 text-green-600" />,
    text: "Market Prices",
    prompt: "What are the current market prices for my crops and when should I sell?"
  }
]

export default function DashboardPage() {
  const [message, setMessage] = useState("")
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleSuggestionClick = (prompt: string) => {
    setMessage(prompt)
  }

  const handleFileUpload = (file: File) => {
    console.log("Selected file:", file.name)
    // TODO: Handle file upload logic here
  }

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message)
      // TODO: Handle message sending logic here
      setMessage("")
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      logout()
      navigate("/")
    } catch (error) {
      console.error("Logout error:", error)
      // Force logout even if API call fails
      logout()
      navigate("/")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header 
        userName={user?.name || "Guest"}
        onLogout={handleLogout}
        className="flex-shrink-0"
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        {/* Centered Suggestions Section */}
        <div className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-3xl">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How can I help you today?
              </h2>
              <p className="text-lg text-gray-600">
                Ask me anything about farming, crops, weather, or market insights
              </p>
            </div>
            
            {/* Suggestion Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {suggestionCards.map((card) => (
                <Card
                  key={card.id}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] border-2 hover:border-green-200"
                  onClick={() => handleSuggestionClick(card.prompt)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {card.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {card.text}
                        </h3>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Message Input Area - Fixed at Bottom */}
        <ChatInput
          value={message}
          onChange={setMessage}
          onSend={handleSendMessage}
          onFileUpload={handleFileUpload}
          placeholder="Type your farming question here..."
          className="flex-shrink-0"
        />
      </main>
    </div>
  )
}
