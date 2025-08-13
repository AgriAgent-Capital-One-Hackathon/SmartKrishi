import { History, Settings, Plus } from "lucide-react"
import { motion } from "framer-motion"

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
    <motion.nav 
      className={`bg-gradient-to-br from-emerald-500/20 via-emerald-400/15 to-teal-300/10 w-20 flex flex-col items-center py-8 relative overflow-hidden border-r border-gray-200/50 ${className}`}
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
          className="pb-2"
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
  )
}
