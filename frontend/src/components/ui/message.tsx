import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Message({ role, content, timestamp }: MessageProps) {
  const isUser = role === 'user';
  
  if (isUser) {
    // User messages - right aligned bubble
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%]">
          <div className="rounded-2xl px-4 py-3 bg-green-600 text-white">
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          </div>
          <div className="text-xs text-gray-300 mt-1 text-right">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  // AI messages - markdown styled
  return (
    <div className="w-full">
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
      
      {/* Timestamp */}
      <div className="text-xs text-gray-400 mt-2">
        {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
