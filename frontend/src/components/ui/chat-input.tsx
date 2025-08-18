import React, { useRef, useEffect, useState } from "react"
import { Paperclip, Send, Mic } from "lucide-react"
import { FilePreview } from "./message-actions"

// Declare SpeechRecognition types for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new (): SpeechRecognition
}

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onFileUpload: (files: File[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  selectedFiles?: File[]
  onFileRemove?: (index: number) => void
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onFileUpload,
  placeholder = "Type your message here...",
  disabled = false,
  className = "",
  selectedFiles = [],
  onFileRemove
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px"
    }
  }, [value])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      if ((value.trim() || selectedFiles.length > 0) && !disabled) {
        onSend()
      }
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFileUpload(files);
    }
    event.target.value = "";
  }

  const canSend = (value.trim() || selectedFiles.length > 0) && !disabled

  // Setup SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.lang = "en-US"
      recognition.interimResults = true
      recognition.continuous = false

      let stopTimeout: NodeJS.Timeout

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }

        // Append transcript instead of replacing
        onChange(value + " " + transcript)

        // Reset stop timer whenever user says something
        clearTimeout(stopTimeout)
        stopTimeout = setTimeout(() => {
          recognition.stop()
        }, 2000) // wait 2s silence before stopping
      }

      recognition.onend = () => {
        clearTimeout(stopTimeout)
        setIsListening(false)
      }

      recognitionRef.current = recognition
    } else {
      console.warn("SpeechRecognition API not supported in this browser.")
    }
  }, [onChange, value])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Your browser does not support Speech Recognition.")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  return (
    <div className={`px-4 py-6 ${className}`}>
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-gray-50 border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 focus-within:border-emerald-500">
          {/* File Previews - ChatGPT Style */}
          {selectedFiles.length > 0 && (
            <div className="px-4 pt-3 pb-2 border-b border-gray-200">
              <div className="flex flex-wrap">
                {selectedFiles.map((file, index) => (
                  <FilePreview 
                    key={`${file.name}-${index}`}
                    file={file} 
                    onRemove={() => onFileRemove && onFileRemove(index)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end px-3 py-2">
            {/* File Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-xl hover:bg-gray-100"
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
              accept="image/*,.pdf,.docx,.xlsx,.csv"
              disabled={disabled}
              multiple
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
                  minHeight: "24px",
                  height: "auto"
                }}
                rows={1}
              />
            </div>

{/* Voice Button */}
<button
  type="button"
  onClick={toggleListening}
  disabled={disabled}
  className={`flex-shrink-0 p-2 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed
    ${isListening 
      ? "text-red-500 animate-pulse" 
      : "text-gray-500 hover:text-gray-700 hover:shadow-md hover:bg-gray-100"}`
  }
  style={{
    boxShadow: isListening ? "0 0 10px rgba(239, 68, 68, 0.6)" : "none"
  }}
  title={isListening ? "Listening..." : "Start voice input"}
>
  <Mic className="w-5 h-5" />
</button>

{/* Send Button */}
<button
  type="button"
  onClick={onSend}
  disabled={!canSend}
  className={`flex-shrink-0 w-9 h-9 ml-2 rounded-full flex items-center justify-center transition-all ${
    canSend
      ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer shadow-sm hover:shadow"
      : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
