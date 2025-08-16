import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import MessageActions from './message-actions';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id: string;
  onCopy?: (content: string) => void;
  onEdit?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
  onDislike?: (messageId: string) => void;
  onReadAloud?: (content: string) => void;
  onStopReading?: () => void;
  isReading?: boolean;
}

export default function Message({ 
  role, 
  content, 
  timestamp, 
  id,
  onCopy,
  onEdit,
  onLike,
  onDislike,
  onReadAloud,
  onStopReading,
  isReading
}: MessageProps) {
  const isUser = role === 'user';
  
  if (isUser) {
    // User messages - right aligned bubble
    return (
      <div className="flex justify-end mb-4 group">
        <div className="max-w-[80%]">
          <div className="rounded-2xl px-4 py-3 bg-green-600 text-white">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="text-xs text-gray-300 text-right flex-1">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            {/* User message actions */}
            <MessageActions
              messageId={id}
              role={role}
              content={content}
              onCopy={onCopy || (() => {})}
              onEdit={onEdit}
              className="ml-2"
            />
          </div>
        </div>
      </div>
    );
  }

  // AI messages - markdown styled
  return (
    <div className="w-full group">
      <div className="text-gray-900">
        {content && content.trim() ? (
          <div className="prose prose-sm max-w-none prose-gray">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                p: ({ children }) => <p className="mb-2 leading-relaxed text-[15px]">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-[15px]">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-[15px]">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed text-[15px]">{children}</li>,
                h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-[17px] font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-semibold mb-2">{children}</h3>,
                code: ({ inline, className, children, ...props }: any) =>
                  !inline ? (
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4 text-sm">
                      <code className={className} {...props}>{children}</code>
                    </pre>
                  ) : (
                    <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  ),
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2 text-gray-700 text-[15px]">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-red-500 text-sm">No response content received</p>
        )}
      </div>
      
      {/* Timestamp and Actions */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-gray-400">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        {/* AI message actions */}
        <MessageActions
          messageId={id}
          role={role}
          content={content}
          onCopy={onCopy || (() => {})}
          onLike={onLike}
          onDislike={onDislike}
          onReadAloud={onReadAloud}
          onStopReading={onStopReading}
          isReading={isReading}
        />
      </div>
    </div>
  );
}
