import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Message({ role, content, timestamp }: MessageProps) {
  const isUser = role === 'user';
  
  // Debug logging for assistant messages
  if (!isUser) {
    console.log('💬 Assistant Message Debug:', {
      contentLength: content.length,
      contentPreview: content.substring(0, 100),
      hasMarkdownChars: {
        headers: content.includes('#'),
        bold: content.includes('**'),
        lists: content.includes('*') || content.includes('-'),
        emojis: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(content)
      }
    });
  }
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'ml-12' : 'mr-12'}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-900 border border-gray-200'
          }`}
        >
          {isUser ? (
            // User messages - simple text
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            // Assistant messages - check if content exists first
            content && content.trim() ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-red-500 text-sm">No response content received</p>
            )
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
