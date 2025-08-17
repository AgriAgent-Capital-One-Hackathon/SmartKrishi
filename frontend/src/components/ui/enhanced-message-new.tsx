import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Bot,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  Edit,
  Brain,
  Code,
  Globe,
  Search,
  MessageSquare,
  FileText,
  AlertCircle,
  CheckCircle,
  Wrench
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage, ReasoningStep } from '../../services/chatService';

interface EnhancedMessageProps {
  message: ChatMessage;
  onCopy?: (content: string) => void;
  onEdit?: (messageId: string) => void;
  onLike?: (messageId: string) => void;
  onDislike?: (messageId: string) => void;
  onReadAloud?: (content: string, messageId: string) => void;
  onStopReading?: () => void;
  isReading?: boolean;
}

// Event type to icon mapping
const getEventIcon = (eventType: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'log': <FileText className="w-3 h-3 text-blue-500" />,
    'plan': <Brain className="w-3 h-3 text-purple-500" />,
    'thinking': <Brain className="w-3 h-3 text-yellow-500" />,
    'tool_call': <Wrench className="w-3 h-3 text-green-500" />,
    'code_execution': <Code className="w-3 h-3 text-orange-500" />,
    'google_search_call': <Search className="w-3 h-3 text-red-500" />,
    'google_search_response': <Search className="w-3 h-3 text-red-400" />,
    'grounding_web_search_queries': <Globe className="w-3 h-3 text-blue-400" />,
    'grounding_chunks': <FileText className="w-3 h-3 text-teal-500" />,
    'grounding_supports': <CheckCircle className="w-3 h-3 text-green-400" />,
    'error': <AlertCircle className="w-3 h-3 text-red-600" />,
    'end': <CheckCircle className="w-3 h-3 text-green-600" />
  };
  return iconMap[eventType] || <MessageSquare className="w-3 h-3 text-gray-500" />;
};

// Format event content for display
const formatEventContent = (event: ReasoningStep): string => {
  switch (event.step_type) {
    case 'log':
      return event.content || `${event.stage}: ${event.message || ''}`;
    case 'plan':
      if (event.plan) {
        const plan = typeof event.plan === 'string' ? event.plan : JSON.stringify(event.plan, null, 2);
        return `**Plan:** ${plan}`;
      }
      return event.content || 'Planning...';
    case 'thinking':
      return event.content || 'Processing...';
    case 'tool_call':
      const tool = event.tool_name || event.tool || 'Unknown Tool';
      const result = event.tool_result ? `\n\n**Result:** \`\`\`\n${typeof event.tool_result === 'string' ? event.tool_result : JSON.stringify(event.tool_result, null, 2)}\n\`\`\`` : '';
      return `**Tool:** ${tool}${event.tool_args ? `\n**Args:** \`${event.tool_args}\`` : ''}${result}`;
    case 'code_execution':
      if (event.stage === 'code') {
        return `**Code:**\n\`\`\`${event.language || 'python'}\n${event.code || event.content}\n\`\`\``;
      } else if (event.stage === 'result') {
        const status = event.outcome === 'success' ? '✅' : '❌';
        return `**Result ${status}:**\n\`\`\`\n${event.result || event.content}\n\`\`\``;
      }
      return event.content || 'Executing code...';
    case 'google_search_call':
      return `**Searching:** "${event.query || event.content}"`;
    case 'google_search_response':
      return `**Search Results:** ${event.results ? 'Retrieved' : 'Processing...'}`;
    case 'grounding_web_search_queries':
      const queries = event.queries || [];
      return `**Web Searches:** ${queries.map((q: string) => `"${q}"`).join(', ')}`;
    case 'grounding_chunks':
      const sources = event.sources || [];
      return `**Sources:** ${sources.length} references found`;
    case 'grounding_supports':
      return `**Citations:** Supporting evidence added`;
    case 'error':
      return `**Error:** ${event.message || event.content}`;
    case 'end':
      return 'Response completed';
    default:
      return event.content || `${event.step_type} event`;
  }
};

const ThinkingAnimation: React.FC = () => (
  <div className="flex items-center space-x-2 py-2">
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
    </div>
    <span className="text-sm text-gray-500">Thinking...</span>
  </div>
);

const StreamingText: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="relative">
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              return match ? (
                <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse"></span>
    </div>
  );
};

// Timeline-based reasoning section
const ReasoningTimeline: React.FC<{ 
  steps: ReasoningStep[]; 
  isExpanded: boolean; 
  onToggle: () => void; 
}> = ({ steps, isExpanded, onToggle }) => {
  if (steps.length === 0) return null;

  const sortedSteps = [...steps].sort((a, b) => a.step_order - b.step_order);

  return (
    <div className="mb-4">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors cursor-pointer p-2 rounded hover:bg-gray-50">
          <Brain className="w-4 h-4" />
          <span>Show reasoning ({steps.length} steps)</span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2">
          <div className="relative pl-8 pb-4">
            {/* Vertical timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {sortedSteps.map((step, index) => (
              <div key={step.id || index} className="relative mb-4 last:mb-0">
                {/* Timeline dot */}
                <div className="absolute -left-7 top-2 w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
                  {getEventIcon(step.step_type)}
                </div>
                
                {/* Step content */}
                <div className="bg-gray-50 p-3 rounded-lg ml-1">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {formatEventContent(step)}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

// User message actions (copy and edit buttons)
const UserMessageActions: React.FC<{
  messageId: string;
  content: string;
  onCopy?: (content: string) => void;
  onEdit?: (messageId: string) => void;
}> = ({ messageId, content, onCopy, onEdit }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      onCopy?.(content);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="flex items-center space-x-1 mt-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleCopy}
        className="p-1.5 hover:bg-green-100 rounded transition-colors"
        title="Copy message"
      >
        {isCopied ? (
          <Check className="w-3 h-3 text-green-600" />
        ) : (
          <Copy className="w-3 h-3 text-gray-500 hover:text-green-600" />
        )}
      </button>
      
      {onEdit && (
        <button
          onClick={() => onEdit(messageId)}
          className="p-1.5 hover:bg-green-100 rounded transition-colors"
          title="Edit message"
        >
          <Edit className="w-3 h-3 text-gray-500 hover:text-green-600" />
        </button>
      )}
    </div>
  );
};

// AI message actions (only copy, like, dislike, read aloud)
const AIMessageActions: React.FC<{
  messageId: string;
  content: string;
  onCopy?: (content: string) => void;
  onLike?: (messageId: string) => void;
  onDislike?: (messageId: string) => void;
  onReadAloud?: (content: string, messageId: string) => void;
  onStopReading?: () => void;
  isReading?: boolean;
}> = ({
  messageId,
  content,
  onCopy,
  onLike,
  onDislike,
  onReadAloud,
  onStopReading,
  isReading = false
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      onCopy?.(content);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleReadAloud = () => {
    if (isReading && onStopReading) {
      onStopReading();
    } else if (onReadAloud) {
      onReadAloud(content, messageId);
    }
  };

  return (
    <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleCopy}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Copy message"
      >
        {isCopied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {onReadAloud && (
        <button
          onClick={handleReadAloud}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title={isReading ? "Stop reading" : "Read aloud"}
        >
          {isReading ? (
            <VolumeX className="w-4 h-4 text-red-500" />
          ) : (
            <Volume2 className="w-4 h-4 text-gray-500" />
          )}
        </button>
      )}

      {onLike && (
        <button
          onClick={() => onLike(messageId)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Like message"
        >
          <ThumbsUp className="w-4 h-4 text-gray-500" />
        </button>
      )}

      {onDislike && (
        <button
          onClick={() => onDislike(messageId)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Dislike message"
        >
          <ThumbsDown className="w-4 h-4 text-gray-500" />
        </button>
      )}
    </div>
  );
};

export const EnhancedMessage: React.FC<EnhancedMessageProps> = ({
  message,
  onCopy,
  onEdit,
  onLike,
  onDislike,
  onReadAloud,
  onStopReading,
  isReading = false
}) => {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);

  const isUser = message.role === 'user';
  const hasReasoning = message.reasoning_steps && message.reasoning_steps.length > 0;

  if (isUser) {
    // User message - green bubble, right aligned
    return (
      <div className="flex justify-end mb-6 group">
        <div className="max-w-lg">
          <div className="bg-green-500 text-white px-4 py-3 rounded-2xl rounded-br-md">
            <div className="prose max-w-none text-white prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
          <UserMessageActions
            messageId={message.id}
            content={message.content}
            onCopy={onCopy}
            onEdit={onEdit}
          />
        </div>
      </div>
    );
  }

  // AI message - transparent background, left aligned
  return (
    <div className="flex justify-start mb-6 group">
      <div className="max-w-4xl w-full">
        {/* AI Avatar and Name */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <Bot className="w-5 h-5 text-gray-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">SmartKrishi AI</span>
        </div>

        {/* Reasoning Timeline (shown first, at the top) */}
        {hasReasoning && !message.is_thinking && (
          <ReasoningTimeline
            steps={message.reasoning_steps!}
            isExpanded={isReasoningExpanded}
            onToggle={() => setIsReasoningExpanded(!isReasoningExpanded)}
          />
        )}

        {/* Message Content */}
        <div className="ml-10">
          {message.is_thinking ? (
            <ThinkingAnimation />
          ) : message.is_streaming ? (
            <StreamingText content={message.content} />
          ) : (
            <div className="prose max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* AI Message Actions - Only for completed messages */}
          {!message.is_thinking && !message.is_streaming && (
            <AIMessageActions
              messageId={message.id}
              content={message.content}
              onCopy={onCopy}
              onLike={onLike}
              onDislike={onDislike}
              onReadAloud={onReadAloud}
              onStopReading={onStopReading}
              isReading={isReading}
            />
          )}
        </div>
      </div>
    </div>
  );
};
