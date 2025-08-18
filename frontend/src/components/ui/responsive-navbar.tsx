import { useState } from "react"
import { History, Settings, Plus, Menu, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ResponsiveNavbarProps {
  onNewChat: () => void
  onHistoryClick: () => void
  onSettingsClick: () => void
  className?: string
}

export default function ResponsiveNavbar({ 
  onNewChat, 
  onHistoryClick, 
  onSettingsClick,
  className = "" 
}: ResponsiveNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const handleMenuItemClick = (action: () => void) => {
    action()
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <motion.nav 
        className={`hidden lg:flex bg-gradient-to-br from-emerald-500/20 via-emerald-400/15 to-teal-300/10 w-20 flex-col items-center py-8 relative overflow-hidden border-r border-gray-200/50 ${className}`}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Animated Background Elements */}
        <motion.div 
          className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-emerald-300/30 via-teal-200/25 to-green-200/20 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <motion.div 
          className="absolute bottom-0 right-0 w-full h-32 bg-gradient-to-tl from-teal-300/25 via-emerald-200/20 to-green-200/15 blur-3xl"
          animate={{ scale: [1, 0.8, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Navigation Items - evenly spaced */}
        <div className="relative z-10 flex flex-col items-center justify-between h-full">
          
          {/* Top Action Buttons */}
          <div className="flex flex-col space-y-6">
            {/* New Chat Button */}
            <motion.button
              onClick={onNewChat}
              className="group relative p-3 rounded-xl bg-white/70 backdrop-blur-sm border border-emerald-200/50 hover:bg-emerald-50 hover:border-emerald-300/60 transition-all duration-300 shadow-md hover:shadow-emerald-500/30"
              title="New Chat"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5 text-gray-600 group-hover:text-emerald-600 transition-colors duration-300" />
            </motion.button>

            {/* Chat History Button */}
            <motion.button
              onClick={onHistoryClick}
              className="group relative p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-blue-200/50 hover:bg-blue-50 hover:border-blue-300/60 transition-all duration-300 shadow-md hover:shadow-blue-500/30"
              title="Chat History"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <History className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
            </motion.button>
          </div>

          {/* Settings Button at Bottom */}
          <motion.div 
            className="px-3"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.button
              onClick={onSettingsClick}
              className="group relative p-3 rounded-xl bg-white/50 backdrop-blur-sm border border-orange-200/50 hover:bg-orange-50 hover:border-orange-300/60 transition-all duration-300 shadow-md hover:shadow-orange-500/30"
              title="Settings"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <Settings className="w-5 h-5 text-gray-600 group-hover:text-orange-600 transition-colors duration-300" />
              </motion.div>
            </motion.button>
          </motion.div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header with Hamburger */}
        <motion.header 
          className="flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm border-b border-gray-200/50"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌱</span>
            <h1 className="text-lg font-semibold text-green-700 tracking-tight">
              SmartKrishi
            </h1>
          </div>
          
          <motion.button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </motion.button>
        </motion.header>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                onClick={() => setIsMobileMenuOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              
              {/* Mobile Menu */}
              <motion.div
                className="fixed top-0 right-0 h-full w-80 bg-white/95 backdrop-blur-lg shadow-xl z-50 flex flex-col"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.3 }}
              >
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🌱</span>
                    <h2 className="text-lg font-semibold text-green-700">
                      SmartKrishi
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                {/* Mobile Menu Items */}
                <div className="flex-1 flex flex-col p-6 space-y-4">
                  <motion.button
                    onClick={() => handleMenuItemClick(onNewChat)}
                    className="flex items-center space-x-4 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-all duration-200 text-left"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="p-2 rounded-lg bg-emerald-100">
                      <Plus className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">New Chat</div>
                      <div className="text-sm text-gray-600">Start a new conversation</div>
                    </div>
                  </motion.button>

                  <motion.button
                    onClick={() => handleMenuItemClick(onHistoryClick)}
                    className="flex items-center space-x-4 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-all duration-200 text-left"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="p-2 rounded-lg bg-blue-100">
                      <History className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Chat History</div>
                      <div className="text-sm text-gray-600">View past conversations</div>
                    </div>
                  </motion.button>

                  <motion.button
                    onClick={() => handleMenuItemClick(onSettingsClick)}
                    className="flex items-center space-x-4 p-4 rounded-xl bg-orange-50 hover:bg-orange-100 transition-all duration-200 text-left"
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="p-2 rounded-lg bg-orange-100">
                      <Settings className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Settings</div>
                      <div className="text-sm text-gray-600">Account and preferences</div>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
