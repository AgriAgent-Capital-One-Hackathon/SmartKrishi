import React, { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import ChatInput from "@/components/ui/chat-input"
import Message from "@/components/ui/message"
import Navbar from "@/components/ui/navbar"
import HistoryDrawer from "@/components/ui/history-drawer"
import SettingsModal from "@/components/ui/settings-modal"
import { 
  Leaf, 
  Sun, 
  Bug, 
  DollarSign,
  Sparkles,
  ChevronRight
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
    case 'crop-diseases':
    case 'soil-health':
      return <Leaf className="w-6 h-6 text-green-600" />;
    case 'weather-advice':
      return <Sun className="w-6 h-6 text-yellow-500" />;
    case 'pest-management':
    case 'pest-control':
      return <Bug className="w-6 h-6 text-red-500" />;
    case 'market-prices':
    case 'market-insights':
      return <DollarSign className="w-6 h-6 text-green-600" />;
    default:
      return <Sparkles className="w-6 h-6 text-blue-500" />;
  }
};

export default function DashboardPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [suggestionCards, setSuggestionCards] = useState<SuggestionCard[]>([]);
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  // Load suggestions from API
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const suggestions = await chatService.getSuggestions();
        setSuggestionCards(suggestions.map(s => ({
          id: s.id,
          icon: getIconForSuggestion(s.id),
          text: s.text,
          prompt: s.prompt
        })));
      } catch (error) {
        console.error('Failed to load suggestions:', error);
        // Fallback suggestions
        setSuggestionCards([
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
      }
    };

    loadSuggestions();
  }, []);

  const handleNewChat = () => {
    setMessages([]);
    setMessage('');
    setCurrentChatId(null);
    setShowSuggestions(true);
    setIsLoading(false);
  };

  const handleChatSelect = async (chatId: string) => {
    try {
      setIsLoading(true);
      const chat = await chatService.getChat(chatId);
      
      // Convert backend messages to frontend format
      const chatMessages: ChatMessage[] = chat.messages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));
      
      setMessages(chatMessages);
      setCurrentChatId(chatId);
      setShowSuggestions(chatMessages.length === 0);
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout()
      logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setMessage(prompt)
  }

  const handleFileUpload = async (file: File) => {
    if (isLoading) return;

    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await chatService.analyzeImage(file, `Analyze this crop image: ${file.name}`, currentChatId || undefined);
      
      // If this created a new chat, update current chat ID
      if (!currentChatId) {
        setCurrentChatId(response.chat_id);
      }
      
      // Reload the chat to get updated messages
      await handleChatSelect(response.chat_id);
    } catch (error) {
      console.error('Failed to analyze image:', error);
      // Show error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
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

    const messageText = message.trim();
    setMessage('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await chatService.sendMessage(messageText, currentChatId || undefined);
      
      // If this created a new chat, update current chat ID
      if (!currentChatId) {
        setCurrentChatId(response.chat_id);
      }
      
      // Reload the chat to get updated messages
      await handleChatSelect(response.chat_id);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Show error message
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I couldn\'t process your message. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Navbar */}
      <Navbar 
        onNewChat={handleNewChat}
        onHistoryClick={() => setIsHistoryOpen(true)}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Welcome Message or Chat Messages */}
        {showSuggestions ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="text-center max-w-2xl mb-8">
              <div className="mb-4">
                <span className="text-6xl">🌱</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome to SmartKrishi
              </h1>
              <p className="text-lg text-gray-600">
                Your AI-powered farming assistant. Ask me anything about agriculture, crops, or farming techniques.
              </p>
            </div>

            {/* Suggestion Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
              {suggestionCards.map((card) => (
                <Card 
                  key={card.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-green-100 hover:border-green-200"
                  onClick={() => handleSuggestionClick(card.prompt)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {card.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 mb-1">
                          {card.text}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {card.prompt}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
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
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl shadow-sm border px-6 py-4 max-w-2xl">
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
                )}
              </div>
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

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        currentChatId={currentChatId || undefined}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userName={user?.email || 'Guest'}
        onLogout={handleLogout}
      />
    </div>
  )
}
