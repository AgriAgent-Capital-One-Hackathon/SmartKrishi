import { User, LogOut } from "lucide-react"

interface HeaderProps {
  userName?: string
  onLogout?: () => void
  className?: string
}

export default function Header({ 
  userName = "Guest", 
  onLogout, 
  className = "" 
}: HeaderProps) {
  return (
    <header className={`bg-white border-b shadow-sm px-6 py-4 ${className}`}>
      <div className="flex justify-between items-center">
        {/* Left side - Logo and Brand */}
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🌱</span>
          <h1 className="text-xl font-semibold text-green-700 tracking-tight">
            SmartKrishi
          </h1>
        </div>

        {/* Right side - User info and logout */}
        <div className="flex items-center">
          <div className="rounded-full bg-gray-100 px-3 py-1 flex items-center space-x-2">
            {/* User icon and welcome text */}
            <div className="flex items-center space-x-2">
              {/* <User className="w-4 h-4 text-gray-600" /> */}
              <span className="text-gray-700 text-sm hidden sm:inline">
                Welcome, {userName}
              </span>
              {/* Mobile: Show only "Hi, [Name]" */}
              <span className="text-gray-700 text-sm sm:hidden">
                Hi, {userName.split(' ')[0]}
              </span>
            </div>
            
            {/* Logout button */}
            <button
              onClick={onLogout}
              className="bg-white border border-gray-300 rounded-full px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-1"
              title="Logout"
            >
              {/* Desktop: Show text */}
              <span className="hidden sm:inline">Logout</span>
              {/* Mobile: Show icon only */}
              <LogOut className="w-4 h-4 sm:hidden" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
