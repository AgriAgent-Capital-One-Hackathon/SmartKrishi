import React, { useState, useLayoutEffect, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import ChatInput from "@/components/ui/chat-input"
import Message from "@/components/ui/message"
import Navbar from "@/components/ui/navbar"
import HistoryDrawer from "@/components/ui/history-drawer"
import SettingsModal from "@/components/ui/settings-modal"
import { FallbackSettings } from "@/components/ui/fallback-settings"
import { AIReasoningPanel } from "@/components/ui/ai-reasoning-panel"
import { StreamingStatusIndicator } from "@/components/ui/streaming-status-indicator"
import { 
  Leaf, 
  Sun, 
  Bug, 
  DollarSign,
  Sparkles,
  ChevronRight,
  Brain,
  ChevronLeft
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { authService } from "@/services/auth"
import { chatService } from '../services/chatService';
import { useStreamingChat } from '../hooks/useStreamingChat';
import { useReasoning } from '../hooks/useReasoning';
import type { ChatMessage } from '../services/chatService';

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

  // New streaming and reasoning hooks
  const reasoning = useReasoning();
  
  const streaming = useStreamingChat({
    onNewMessage: (msg) => {
      setMessages(prev => [...prev, msg]);
      reasoning.clearReasoning(); // Clear previous reasoning when new conversation starts
    },
    onMessageUpdate: (msg) => {
      setMessages(prev => {
        const existingIndex = prev.findIndex(m => m.id === msg.id);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = msg;
          return updated;
        }
        return [...prev, msg];
      });
    },
    onReasoningUpdate: (messageId, steps) => {
      reasoning.updateReasoningSteps(steps);
    },
    onStatusUpdate: (status) => {
      // Status is handled by the streaming hook
    },
    onError: (error) => {
      console.error('Streaming error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error}`,
        timestamp: new Date()
      }]);
    }
  });

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
    setReadingMessageId(null);
    reasoning.clearReasoning();
    reasoning.isVisible && reasoning.toggleVisibility(); // Hide reasoning panel for new chats
  };

  const handleChatSelect = async (chatId: string) => {
    try {
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
      
      // Load reasoning for the chat
      reasoning.loadChatReasoning(chatId);
    } catch (error) {
      console.error('Failed to load chat:', error);
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
    if ((!message.trim() && selectedFiles.length === 0) || streaming.isStreaming) return;

    const messageText = message.trim();
    setMessage('');
    setShowSuggestions(false);

    try {
      if (selectedFiles.length > 0) {
        // Handle file upload with streaming
        const file = selectedFiles[0]; // Use first file for now
        const promptText = messageText || `Analyze this file: ${file.name}`;
        
        await streaming.uploadFileWithStreaming(file, promptText, currentChatId || undefined);
        setSelectedFiles([]); // Clear files after sending
      } else {
        // Handle text message with streaming
        await streaming.sendMessageWithStreaming(
          messageText, 
          currentChatId || undefined,
          {
            include_logs: true // Enable reasoning by default
          }
        );
      }

      // Update chat ID if this was a new conversation
      if (!currentChatId && streaming.currentMessageId) {
        // We'll get the chat ID from the streaming response
        // This will be handled by the streaming events
      }
    } catch (error) {
      console.error('Failed to send message:', error);
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
      <div className="flex-1 flex h-screen">
        <main className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 via-green-50 to-white">
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
                    Your AI-powered farming assistant with advanced reasoning. Ask me anything about agriculture, crops, or farming techniques.
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
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                  <StreamingStatusIndicator status={streaming.currentStatus} />
                </div>
                <button
                  onClick={reasoning.toggleVisibility}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                    reasoning.isVisible 
                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                      : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                  }`}
                  title="Toggle AI Reasoning Panel"
                >
                  <Brain className="w-4 h-4" />
                  <span className="text-sm font-medium">AI Reasoning</span>
                  {reasoning.isVisible ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                </button>
              </div>
              
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
              disabled={streaming.isStreaming}
            />
          </div>
        </main>

        {/* AI Reasoning Panel */}
        <AIReasoningPanel
          reasoningSteps={reasoning.steps}
          isVisible={reasoning.isVisible}
          onToggle={reasoning.toggleVisibility}
          isLoading={reasoning.isLoading}
        />
      </div>

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
