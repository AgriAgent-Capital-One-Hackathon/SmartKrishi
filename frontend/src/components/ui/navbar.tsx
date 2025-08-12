import { History, Settings,Sprout } from "lucide-react"

interface NavbarProps {
  onNewChat: () => void
  onHistoryClick: () => void
  onSettingsClick: () => void
  className?: string
}

export default function Navbar({ 
  onNewChat, 
  onHistoryClick, 
  onSettingsClick,
  className = "" 
}: NavbarProps) {
  return (
    <nav className={`bg-white border-r border-gray-200 w-16 flex flex-col items-center py-4 ${className}`}>
      {/* Top Section - Logo */}
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={onNewChat}
          className="p-3 rounded-lg bg-green-100 hover:bg-green-200 text-green-600 transition-colors duration-200 group"
          title="New Chat"
        >
          <Sprout className="w-6 h-6" />
        </button>
        
        <button
          onClick={onHistoryClick}
          className="p-3 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          title="Chat History"
        >
          <History className="w-5 h-5" />
        </button>
      </div>
      
      {/* Bottom Section - Settings */}
      <div className="mt-auto">
        <button
          onClick={onSettingsClick}
          className="p-3 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </nav>
  )
}
