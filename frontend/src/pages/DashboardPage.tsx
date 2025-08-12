import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import ChatInput from "@/components/ui/chat-input"
import Message from "@/components/ui/message"
import Header from "@/components/ui/header"
import { 
  Leaf, 
  Sun, 
  Bug, 
  DollarSign,
  Sparkles,
  ChevronRight,
  LogOut
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { authService } from "@/services/auth"
import { chatService, type ChatMessage } from '../services/chatService';

interface SuggestionCard {
  id: string
  icon: React.ReactNode
  text: string
  prompt: string
}

const getIconForSuggestion = (id: string) => {
  switch (id) {
    case 'crop-care':
      return <Leaf className="w-6 h-6 text-green-600" />;
    case 'weather-advice':
      return <Sun className="w-6 h-6 text-yellow-500" />;
    case 'pest-management':
      return <Bug className="w-6 h-6 text-red-500" />;
    case 'market-prices':
      return <DollarSign className="w-6 h-6 text-green-600" />;
    default:
      return null;
  }
}

export default function DashboardPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [suggestionCards, setSuggestionCards] = useState<SuggestionCard[]>([
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
  ]);
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  // Load suggestions from API
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const suggestions = await chatService.getSuggestions();
        setSuggestionCards(suggestions.map(s => ({
          id: s.id,
          icon: getIconForSuggestion(s.id), // You'll need to implement this
          text: s.text,
          prompt: s.prompt
        })));
      } catch (error) {
        console.error('Failed to load suggestions:', error);
        // Keep default suggestions
      }
    };

    loadSuggestions();
  }, []);

  const handleSuggestionClick = (prompt: string) => {
    setMessage(prompt)
  }

  const handleFileUpload = async (file: File) => {
    if (isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: `📷 Uploaded image: ${file.name}`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await chatService.analyzeImage(file);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to analyze image:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I couldn\'t analyze the image. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await chatService.sendMessage(message.trim(), messages);
      
      // Debug logging
      console.log('🔄 Chat API Response:', {
        responseType: typeof response,
        responseLength: response.length,
        responsePreview: response.substring(0, 200)
      });
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      console.log('📨 Created assistant message:', assistantMessage);

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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

  const showDefaultSuggestions = messages.length === 0 && showSuggestions

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <Header 
        userName={user?.name || "Guest"}
        onLogout={handleLogout}
        className="flex-shrink-0"
      />

      {/* Main Content - Scrollable Middle Section */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 overflow-hidden">
        {showDefaultSuggestions ? (
          /* Centered Suggestions Section */
          <div className="flex-1 flex items-center justify-center py-8 overflow-y-auto pr-4">
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
        ) : (
          /* Chat Messages Area - Scrollable */
          <div className="flex-1 overflow-y-auto py-4 pr-4">
            <div className="space-y-2 pb-4">
              {messages.map((msg) => (
                <Message
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                />
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="max-w-[80%] mr-12">
                    <div className="bg-gray-100 text-gray-900 border border-gray-200 rounded-2xl px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">SmartKrishi AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fixed Chat Input at Bottom */}
        <div className="flex-shrink-0">
          <ChatInput
            value={message}
            onChange={setMessage}
            onSend={handleSendMessage}
            onFileUpload={handleFileUpload}
            placeholder="Type your farming question here..."
            disabled={isLoading}
          />
        </div>
      </main>
    </div>
  )
}