import { X, LogOut, User, Phone, Info } from "lucide-react"
import { useState } from "react"
import { FallbackSettings } from "./fallback-settings"
import { NetworkStatus } from "./network-status"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  userName: string
  onLogout: () => void
}

export default function SettingsModal({
  isOpen,
  onClose,
  userName,
  onLogout
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'account' | 'sms'>('account');

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white/70 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl w-full max-w-2xl border border-white/20 max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Tabs */}
          <div className="flex-shrink-0">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/20 bg-gradient-to-r from-emerald-500/10 to-teal-400/10 rounded-t-xl sm:rounded-t-2xl">
              <h2 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Settings
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex bg-white/30 border-b border-white/20">
              <button
                onClick={() => setActiveTab('account')}
                className={`flex-1 px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                  activeTab === 'account'
                    ? 'text-emerald-700 border-b-2 border-emerald-500 bg-white/40'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
                }`}
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Account</span>
                <span className="sm:hidden">Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('sms')}
                className={`flex-1 px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                  activeTab === 'sms'
                    ? 'text-orange-700 border-b-2 border-orange-500 bg-white/40'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
                }`}
              >
                <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">SMS Fallback</span>
                <span className="sm:hidden">SMS</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'account' ? (
              <div className="p-4 sm:p-6">
                {/* User Info */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-white/50 border border-white/30 rounded-xl shadow-sm">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-md">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{userName}</p>
                      <p className="text-xs sm:text-sm text-gray-500">SmartKrishi User</p>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div className="space-y-3">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-full 
                               bg-gradient-to-r from-red-500 to-red-600 
                               hover:from-red-600 hover:to-red-700 
                               text-white text-sm font-medium 
                               shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>

                {/* App Info */}
                <div className="mt-6 p-3 sm:p-4 bg-white/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">App Information</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    SmartKrishi v1.0 – Your AI Farming Assistant
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Get expert farming advice powered by AI technology
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 sm:p-6 space-y-6">
                <NetworkStatus className="mb-6" />
                <FallbackSettings />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
