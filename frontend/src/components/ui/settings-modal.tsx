import { X, LogOut, User } from "lucide-react"

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
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl w-full max-w-md border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/20 bg-gradient-to-r from-emerald-500/10 to-teal-400/10 rounded-t-2xl">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* User Info */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 p-4 bg-white/50 border border-white/30 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{userName}</p>
                  <p className="text-sm text-gray-500">SmartKrishi User</p>
                </div>
              </div>
            </div>

            {/* Actions */}
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
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <p className="text-xs text-gray-500 text-center">
              SmartKrishi v1.0 – Your AI Farming Assistant
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
