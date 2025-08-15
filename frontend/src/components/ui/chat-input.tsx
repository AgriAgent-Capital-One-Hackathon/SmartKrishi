import React, { useRef, useEffect } from "react"
import { Paperclip, Send } from "lucide-react"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onFileUpload: (file: File) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onFileUpload,
  placeholder = "Type your message here...",
  disabled = false,
  className = ""
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px'
    }
  }, [value])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      if (value.trim() && !disabled) {
        onSend()
      }
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onFileUpload(file)
    }
    // Clear the input so the same file can be selected again
    event.target.value = ''
  }

  const canSend = value.trim() && !disabled

  return (
    <div className={`px-4 py-6 ${className}`}>
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-gray-50 border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-emerald-500">
          <div className="flex items-end px-3 py-2">
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-md hover:bg-gray-100"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt"
              disabled={disabled}
            />

            {/* Message Textarea */}
            <div className="flex-1 mx-2">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full bg-transparent border-0 outline-0 resize-none placeholder:text-gray-500 text-gray-900 text-sm leading-relaxed max-h-[150px] overflow-y-auto disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  minHeight: '24px',
                  height: 'auto'
                }}
                rows={1}
              />
            </div>

            {/* Send Button */}
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                canSend
                  ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer shadow-sm hover:shadow'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={canSend ? "Send message" : "Type a message to send"}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
