import React, { useState, useEffect } from "react"
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
  id: string;
  icon: React.ReactNode;
  text: string;
  prompt: string;
}

const getIconForSuggestion = (id: string) => {
  switch (id) {
    case 'crop-care':
    case 'crop-diseases':
    case 'soil-health':
      return <Leaf className="w-6 h-6 text-green-600" />;
    case 'weather-advice':
      return <Sun className="w-6 h-6 text-green-600" />;
    case 'pest-control':
      return <Bug className="w-6 h-6 text-green-600" />;
    case 'market-prices':
      return <DollarSign className="w-6 h-6 text-green-600" />;
    default:
      return <Sparkles className="w-6 h-6 text-green-600" />;
  }
};

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [suggestions, setSuggestions] = useState<SuggestionCard[]>([])

  useEffect(() => {
    const loadSuggestions = async () => {
      if (messages.length === 0) {
        setSuggestions([
          {
            id: 'crop-care',
            icon: getIconForSuggestion('crop-care'),
            text: "Crop Care",
            prompt: "How can I improve the health and yield of my crops?"
          },
          {
            id: 'pest-control',
            icon: getIconForSuggestion('pest-control'),
            text: "Pest Control",
            prompt: "What are effective organic pest control methods for my crops?"
          },
          {
            id: 'soil-health',
            icon: getIconForSuggestion('soil-health'),
            text: "Soil Health",
            prompt: "How can I test and improve my soil quality naturally?"
          },
          {
            id: 'weather-advice',
            icon: getIconForSuggestion('weather-advice'),
            text: "Weather Insights",
            prompt: "How should I prepare my crops for upcoming weather changes?"
          },
          {
            id: 'crop-diseases',
            icon: getIconForSuggestion('crop-diseases'),
            text: "Disease Prevention",
            prompt: "How can I identify and prevent common crop diseases?"
          },
          {
            id: 'market-prices',
            icon: getIconForSuggestion('market-prices'),
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

  const handleFileUpload = async (files: File[]) => {
    if (isLoading || files.length === 0) return;

    const file = files[0]; // Use the first file for now
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
    <div className="h-screen flex bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
      {/* Navbar */}
      <Navbar 
        onNewChat={handleNewChat}
        onHistoryClick={() => setIsHistoryOpen(true)}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        {/* Welcome Message or Chat Messages */}
        {showSuggestions ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
            {/* Welcome Section */}
            <div className="text-center mb-12 animate-fade-in">
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                Welcome to SmartKrishi
              </h1>
              <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
                Your AI-powered farming assistant is here to help you grow better crops, make informed decisions, and boost your agricultural success.
              </p>
            </div>

            {/* Suggestion Cards */}
            <div className="w-full max-w-4xl">
              <h2 className="text-2xl font-semibold text-gray-800 mb-8 text-center">
                What can I help you with today?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suggestions.map((card, index) => (
                  <div
                    key={card.id}
                    className="group cursor-pointer animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => handleSuggestionClick(card.prompt)}
                  >
                    <div className="h-full bg-white/60 backdrop-blur-lg border border-white/20 rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-105 hover:bg-white/70 transition-all duration-300 ease-in-out">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-300">
                            {card.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-green-700 transition-colors duration-300">
                              {card.text}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {card.prompt}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="w-full">
              {messages.map((msg, index) => (
                msg.role === 'assistant' ? (
                  // AI messages - full width ChatGPT style
                  <div
                    key={msg.id}
                    className="w-full py-6 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="max-w-4xl mx-auto px-6">
                      <Message 
                        id={msg.id}
                        role={msg.role}
                        content={msg.content}
                        timestamp={msg.timestamp}
                      />
                    </div>
                  </div>
                ) : (
                  // User messages - floating bubbles
                  <div
                    key={msg.id}
                    className="w-full py-4 animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="max-w-4xl mx-auto px-6 flex justify-end">
                      <div className="max-w-2xl">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl rounded-tr-sm px-6 py-4 shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <p className="text-white leading-relaxed">{msg.content}</p>
                          <p className="text-xs text-green-100 mt-2 opacity-80">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="w-full py-6 animate-fade-in">
                  <div className="max-w-4xl mx-auto px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fixed Chat Input at Bottom */}
        <div className="flex-shrink-0 p-6 bg-gradient-to-t from-white/80 to-transparent backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              value={message}
              onChange={setMessage}
              onSend={handleSendMessage}
              onFileUpload={handleFileUpload}
              placeholder="Type your farming question here..."
              disabled={isLoading}
            />
          </div>
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