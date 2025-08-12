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
    // User messages - keep as bubbles (right-aligned)
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%]">
          <div className="rounded-2xl px-4 py-3 bg-green-600 text-white">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }

  // AI messages - Clean ChatGPT style (just the message content)
  return (
    <div className="w-full">
      <div className="text-gray-900">
        {content && content.trim() ? (
          <div className="prose prose-sm max-w-none prose-gray">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Customize code blocks
                code: ({ inline, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline ? (
                    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto my-4">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  )
                },
                // Customize other elements
                p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-md font-bold mb-2">{children}</h3>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2">
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
      
      {/* Timestamp only - small and subtle */}
      <div className="text-xs text-gray-400 mt-2">
        {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
