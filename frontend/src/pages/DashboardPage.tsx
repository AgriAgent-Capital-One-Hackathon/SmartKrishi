import React, { useState, useLayoutEffect, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import ChatInput from "@/components/ui/chat-input"
import Message from "@/components/ui/message"
import Navbar from "@/components/ui/navbar"
import HistoryDrawer from "@/components/ui/history-drawer"
import SettingsModal from "@/components/ui/settings-modal"
import { FallbackSettings } from "@/components/ui/fallback-settings"
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [suggestionCards, setSuggestionCards] = useState<SuggestionCard[]>([]);
  const [readingMessageId, setReadingMessageId] = useState<string | null>(null);
  const [showFallbackSettings, setShowFallbackSettings] = useState(false);
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to bottom after every new message
  useLayoutEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages]);

  const handleNewChat = () => {
    setMessages([]);
    setMessage('');
    setSelectedFiles([]);
    setCurrentChatId(null);
    setShowSuggestions(true);
    setIsLoading(false);
    setReadingMessageId(null);
  };

  const handleChatSelect = async (chatId: string) => {
    try {
      setIsLoading(true);
      const chat = await chatService.getChat(chatId);
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

  const handleFileUpload = (files: File[]) => {
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
  }

  const handleFileRemove = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  }

  const handleCopyMessage = (content: string) => {
    // Already handled by the MessageActions component
    console.log('Message copied:', content);
  }

  const handleEditMessage = (messageId: string) => {
    const messageToEdit = messages.find(m => m.id === messageId);
    if (messageToEdit && messageToEdit.role === 'user') {
      setMessage(messageToEdit.content);
      // Remove the message and all subsequent messages for re-generation
      const messageIndex = messages.findIndex(m => m.id === messageId);
      setMessages(prev => prev.slice(0, messageIndex));
      setSelectedFiles([]);
    }
  }

  const handleLikeMessage = (messageId: string) => {
    console.log('Message liked:', messageId);
    // TODO: Implement feedback to backend
  }

  const handleDislikeMessage = (messageId: string) => {
    console.log('Message disliked:', messageId);
    // TODO: Implement feedback to backend
  }

  const handleReadAloud = (content: string, messageId: string) => {
    if ('speechSynthesis' in window) {
      // Stop any current reading
      window.speechSynthesis.cancel();
      setReadingMessageId(messageId);
      
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setReadingMessageId(null);
      };
      
      utterance.onerror = () => {
        setReadingMessageId(null);
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Text-to-speech not supported in this browser');
    }
  }

  const handleStopReading = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setReadingMessageId(null);
    }
  }

  const handleSendMessage = async () => {
    if ((!message.trim() && selectedFiles.length === 0) || isLoading) return;

    const messageText = message.trim();
    setMessage('');
    setShowSuggestions(false);

    let userMessageContent = messageText;
    if (selectedFiles.length > 0) {
      const fileNames = selectedFiles.map(f => f.name).join(', ');
      userMessageContent = messageText ? 
        `${messageText}\n� ${fileNames}` : 
        `� ${fileNames}`;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let response;
      if (selectedFiles.length > 0) {
        // Handle file upload - for now, just use the first file
        // TODO: Implement multi-file support in backend
        const promptText = messageText || `Analyze this file: ${selectedFiles[0].name}`;
        response = await chatService.analyzeImage(selectedFiles[0], promptText, currentChatId || undefined);
        setSelectedFiles([]); // Clear files after sending
      } else {
        // Handle text message
        response = await chatService.sendMessage(messageText, currentChatId || undefined);
      }

      if (!currentChatId) {
        setCurrentChatId(response.chat_id);
      }
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I couldn\'t process your message. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }

return (
    <div className="h-screen flex bg-gradient-to-br from-gray-50 via-green-50 to-white ">
      {/* Navbar */}
      <Navbar 
        onNewChat={handleNewChat}
        onHistoryClick={() => setIsHistoryOpen(true)}
        onSettingsClick={() => setIsSettingsOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen bg-gradient-to-br from-gray-50 via-green-50 to-white">
        {showSuggestions ? (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex flex-col items-center justify-center min-h-full animate-fadeIn">
              <div className="text-center max-w-2xl mb-8">
                <div className="mb-4">
                  <span className="text-6xl drop-shadow-sm">🌱</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Welcome to <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">SmartKrishi</span>
                </h1>
                <p className="text-lg text-gray-600">
                  Your AI-powered farming assistant. Ask me anything about agriculture, crops, or farming techniques.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                {suggestionCards.map((card) => (
                  <Card 
                    key={card.id}
                    className="cursor-pointer backdrop-blur-lg bg-white/70 border border-green-100 hover:border-green-300 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-xl"
                    onClick={() => handleSuggestionClick(card.prompt)}
                  >
                    <CardContent className="p-6 flex items-center space-x-4">
                      <div className="flex-shrink-0">{card.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{card.text}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{card.prompt}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-green-50 to-white">
              <div className="w-full">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="w-full py-4"
                  >
                    <div className="max-w-4xl mx-auto px-6 animate-fadeIn">
                      <Message 
                        id={msg.id}
                        role={msg.role}
                        content={msg.content}
                        timestamp={msg.timestamp}
                        onCopy={handleCopyMessage}
                        onEdit={handleEditMessage}
                        onLike={handleLikeMessage}
                        onDislike={handleDislikeMessage}
                        onReadAloud={(content) => handleReadAloud(content, msg.id)}
                        onStopReading={handleStopReading}
                        isReading={readingMessageId === msg.id}
                      />
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="w-full py-4">
                    <div className="max-w-4xl mx-auto px-6 animate-pulse">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                          <div className="w-4 h-4 text-white">🤖</div>
                        </div>
                        <div className="flex-1">
                          <div className="mb-1">
                            <span className="text-sm font-medium text-gray-900">SmartKrishi AI</span>
                          </div>
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} style={{ height: '1px' }} />
              </div>
            </div>
          </>
        )}

        {/* Fixed Chat Input at Bottom */}
        <div className="flex-shrink-0 bg-transparent border-none">
          <ChatInput
            value={message}
            onChange={setMessage}
            onSend={handleSendMessage}
            onFileUpload={handleFileUpload}
            selectedFiles={selectedFiles}
            onFileRemove={handleFileRemove}
            disabled={isLoading}
          />
        </div>
      </main>

      {/* Drawers & Modals */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        currentChatId={currentChatId || undefined}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userName={user?.email || 'Guest'}
        onLogout={handleLogout}
      />
      
      {/* SMS Fallback Settings Modal */}
      {showFallbackSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">SMS Fallback Settings</h3>
              <button
                onClick={() => setShowFallbackSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <FallbackSettings />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
