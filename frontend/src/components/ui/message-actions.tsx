import React, { useState } from 'react';
import { Copy, Check, Edit, ThumbsUp, ThumbsDown, Volume2, Square, X, FileImage, FileText, FileSpreadsheet, File } from 'lucide-react';

interface MessageActionsProps {
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  onCopy: (content: string) => void;
  onEdit?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
  onDislike?: (messageId: string) => void;
  onReadAloud?: (content: string) => void;
  onStopReading?: () => void;
  isReading?: boolean;
  isEditable?: boolean;  // New prop to control if message can be edited
  className?: string;
}

export default function MessageActions({
  messageId,
  role,
  content,
  onCopy,
  onEdit,
  onLike,
  onDislike,
  onReadAloud,
  onStopReading,
  isReading = false,
  isEditable = true,  // Default to true for backward compatibility
  className = ""
}: MessageActionsProps) {
  const [isCopied, setIsCopied] = useState(false);
  const isUser = role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      onCopy(content);
      // Reset the icon after 2 seconds
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      // Error handling
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsCopied(true);
      onCopy(content);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleReadAloud = () => {
    if (isReading && onStopReading) {
      onStopReading();
    } else if (onReadAloud) {
      onReadAloud(content);
    }
  };

  return (
    <div className={`flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${className}`}>
      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all duration-200 group/tooltip relative"
        title={isCopied ? "Copied!" : "Copy message"}
      >
        {isCopied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          {isCopied ? "Copied!" : "Copy message"}
        </div>
      </button>

      {isUser ? (
        // User message actions - Only show edit if message is editable and onEdit is provided
        onEdit && isEditable && (
          <button
            onClick={() => onEdit(messageId)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all duration-200 group/tooltip relative"
            title="Edit message (this will clear all responses below)"
          >
            <Edit className="w-4 h-4" />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              Edit message
            </div>
          </button>
        )
      ) : (
        // AI message actions
        <>
          {onLike && (
            <button
              onClick={() => onLike(messageId)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all duration-200 group/tooltip relative"
              title="Good response"
            >
              <ThumbsUp className="w-4 h-4" />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Good response
              </div>
            </button>
          )}
          
          {onDislike && (
            <button
              onClick={() => onDislike(messageId)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all duration-200 group/tooltip relative"
              title="Poor response"
            >
              <ThumbsDown className="w-4 h-4" />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                Poor response
              </div>
            </button>
          )}
          
          {onReadAloud && (
            <button
              onClick={handleReadAloud}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all duration-200 group/tooltip relative"
              title={isReading ? "Stop reading" : "Read aloud"}
            >
              {isReading ? (
                <Square className="w-4 h-4 text-red-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                {isReading ? "Stop reading" : "Read aloud"}
              </div>
            </button>
          )}
        </>
      )}
    </div>
  );
}

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  className?: string;
}

export function FilePreview({ file, onRemove, className = "" }: FilePreviewProps) {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    const fileName = file.name.toLowerCase();
    
    if (isImage) {
      return <FileImage className="w-4 h-4 text-blue-500" />;
    } else if (fileName.endsWith('.pdf')) {
      return <FileText className="w-4 h-4 text-red-500" />;
    } else if (fileName.endsWith('.docx')) {
      return <FileText className="w-4 h-4 text-blue-600" />;
    } else if (fileName.endsWith('.xlsx')) {
      return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
    } else if (fileName.endsWith('.csv')) {
      return <File className="w-4 h-4 text-orange-500" />;
    } else {
      return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className={`inline-flex items-center bg-gray-50 border border-gray-200 rounded-lg p-2 mr-2 mb-2 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {/* File Icon/Preview */}
      <div className="flex-shrink-0">
        {isImage && preview ? (
          <img 
            src={preview} 
            alt={file.name}
            className="w-8 h-8 object-cover rounded"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
            {getFileIcon()}
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0 mx-2">
        <p className="text-sm font-medium text-gray-900 truncate max-w-32">
          {file.name}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(file.size)}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="flex-shrink-0 p-0.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors group/tooltip relative"
        title="Remove file"
      >
        <X className="w-3 h-3" />
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Remove file
        </div>
      </button>
    </div>
  );
}
