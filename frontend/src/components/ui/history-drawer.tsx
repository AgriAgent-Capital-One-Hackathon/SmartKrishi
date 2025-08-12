import { useState, useEffect } from "react"
import { X, Search, Plus, MoreVertical, Edit2, Trash2 } from "lucide-react"
import { chatService, type ChatSummary } from "@/services/chatService"

interface HistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  currentChatId?: string
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  onChatSelect,
  onNewChat,
  currentChatId
}: HistoryDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatSummary[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Load chat history when drawer opens
  useEffect(() => {
    if (isOpen) {
      loadChatHistory()
    }
  }, [isOpen])

  const loadChatHistory = async () => {
    try {
      setLoading(true)
      const chats = await chatService.getUserChats()
      setChatHistory(chats)
    } catch (error) {
      console.error('Failed to load chat history:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = chatHistory.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRename = (chat: ChatSummary) => {
    setEditingId(chat.id)
    setEditingName(chat.title)
    setOpenMenuId(null)
  }

  const handleSaveRename = async () => {
    if (editingId && editingName.trim()) {
      try {
        await chatService.updateChat(editingId, editingName.trim())
        setChatHistory(prev => 
          prev.map(chat => 
            chat.id === editingId ? { ...chat, title: editingName.trim() } : chat
          )
        )
      } catch (error) {
        console.error('Failed to rename chat:', error)
      }
    }
    setEditingId(null)
    setEditingName("")
  }

  const handleDelete = async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId)
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId))
      setOpenMenuId(null)
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }
  }

  const handleCreateNewChat = async () => {
    try {
      const newChat = await chatService.createChat("New Chat")
      const newChatSummary: ChatSummary = {
        id: newChat.id,
        title: newChat.title,
        created_at: newChat.created_at,
        updated_at: newChat.updated_at,
        last_message: "",
        message_count: 0
      }
      setChatHistory(prev => [newChatSummary, ...prev])
      onChatSelect(newChat.id)
      onClose()
    } catch (error) {
      console.error('Failed to create new chat:', error)
      // Fallback to existing new chat functionality
      onNewChat()
      onClose()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        
        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={handleCreateNewChat}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>
        
        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Loading chats...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? "No chats found" : "No chat history yet"}
            </div>
          ) : (
            <div className="p-2">
              {filteredHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`relative group mb-2 p-3 rounded-lg cursor-pointer border transition-colors duration-200 ${
                    currentChatId === chat.id 
                      ? 'bg-green-50 border-green-200' 
                      : 'hover:bg-gray-50 border-transparent hover:border-gray-200'
                  }`}
                  onClick={() => {
                    onChatSelect(chat.id)
                    onClose()
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingId === chat.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={handleSaveRename}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveRename()}
                          className="w-full text-sm font-medium text-gray-900 bg-white border border-green-500 rounded px-2 py-1"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {chat.title}
                        </h3>
                      )}
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {chat.last_message || "No messages yet"}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-400">
                          {formatDate(chat.updated_at)}
                        </p>
                        {chat.message_count > 0 && (
                          <span className="text-xs text-gray-400">
                            {chat.message_count} messages
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId(openMenuId === chat.id ? null : chat.id)
                        }}
                        className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                      
                      {openMenuId === chat.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRename(chat)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Rename</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(chat.id)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
