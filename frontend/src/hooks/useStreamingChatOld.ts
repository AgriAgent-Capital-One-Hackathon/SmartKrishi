import { useState, useCallback, useRef } from 'react';
import { chatService } from '../services/chatService';
import type { 
  StreamingEvent, 
  StreamingStatus, 
  ReasoningStep,
  ChatMessage
} from '../services/chatService';

interface UseStreamingChatProps {
  onMessageUpdate?: (message: ChatMessage) => void;
  onNewMessage?: (message: ChatMessage) => void;
  onError?: (error: string) => void;
}

interface MessageStreamingState {
  messageId: string;
  isThinking: boolean;
  isStreaming: boolean;
  accumulatedContent: string;
  reasoningSteps: ReasoningStep[];
}

interface StreamingState {
  isStreaming: boolean;
  currentStatus: StreamingStatus;
  streamingMessages: Map<string, MessageStreamingState>;
}

export const useStreamingChat = ({
  onMessageUpdate,
  onNewMessage,
  onError
}: UseStreamingChatProps = {}) => {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    currentStatus: { status: 'complete' },
    streamingMessages: new Map()
  });

  const abortController = useRef<AbortController | null>(null);  const sendMessageWithStreaming = useCallback(async (
    message: string,
    chatId?: string,
    options?: {
      model?: string;
      tools?: string[];
      include_logs?: boolean;
    }
  ) => {
    // Abort any ongoing stream
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    onNewMessage?.(userMessage);

    setState(prev => ({
      ...prev,
      isStreaming: true,
      currentStatus: { status: 'initializing' }
    }));

    try {
      const streamGenerator = chatService.sendMessageStream(message, chatId, options);

      for await (const event of streamGenerator) {
        if (abortController.current?.signal.aborted) {
          break;
        }

        await handleStreamingEvent(event);
      }

      setState(prev => ({
        ...prev,
        isStreaming: false,
        currentStatus: { status: 'complete' }
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Streaming failed';
      
      setState(prev => ({
        ...prev,
        isStreaming: false,
        currentStatus: { status: 'error' }
      }));

      onError?.(errorMessage);
    }
  }, [onMessageUpdate, onNewMessage, onError]);

  const uploadFileWithStreaming = useCallback(async (
    file: File,
    message: string,
    chatId?: string
  ) => {
    // Abort any ongoing stream
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();

    setState(prev => ({
      ...prev,
      isStreaming: true,
      currentStatus: { status: 'initializing' },
      accumulatedContent: '',
      reasoningSteps: [],
      currentMessageId: null
    }));

    onStatusUpdate?.({ status: 'initializing' });

    try {
      const streamGenerator = chatService.uploadFileAndAnalyzeStream(file, message, chatId);

      for await (const event of streamGenerator) {
        if (abortController.current?.signal.aborted) {
          break;
        }

        await handleStreamingEvent(event);
      }

      setState(prev => ({
        ...prev,
        isStreaming: false,
        currentStatus: { status: 'complete' }
      }));

      onStatusUpdate?.({ status: 'complete' });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'File upload streaming failed';
      
      setState(prev => ({
        ...prev,
        isStreaming: false,
        currentStatus: { status: 'error' }
      }));

      onStatusUpdate?.({ status: 'error' });
      onError?.(errorMessage);
    }
  }, [onMessageUpdate, onNewMessage, onReasoningUpdate, onStatusUpdate, onError]);

  const handleStreamingEvent = useCallback(async (event: StreamingEvent) => {
    console.log('🎭 Agent API Event:', event.type, event);
    
    switch (event.type) {
      case 'response_chunk':
        console.log('� Agent API response chunk:', event);
        if (event.content) {
          const chunkContent = event.content;
          const newAccumulated = state.accumulatedContent + chunkContent;
          
          setState(prev => ({
            ...prev,
            accumulatedContent: newAccumulated,
            currentMessageId: event.message_id || prev.currentMessageId,
            currentStatus: { status: 'responding', current_step: 'response' }
          }));

          if (event.message_id || state.currentMessageId) {
            const updatedMessage: ChatMessage = {
              id: event.message_id || state.currentMessageId!,
              role: 'assistant',
              content: newAccumulated,
              timestamp: new Date()
            };
            onMessageUpdate?.(updatedMessage);
          }
          onStatusUpdate?.({ status: 'responding', current_step: 'response' });
        }
        break;

      case 'response':
        console.log('✅ Agent API final response:', event);
        if (event.content) {
          setState(prev => ({
            ...prev,
            accumulatedContent: event.content!,
            currentMessageId: event.message_id || prev.currentMessageId,
            currentStatus: { status: 'responding' }
          }));

          if (event.message_id || state.currentMessageId) {
            const finalMessage: ChatMessage = {
              id: event.message_id || state.currentMessageId!,
              role: 'assistant',
              content: event.content,
              timestamp: new Date()
            };
            onMessageUpdate?.(finalMessage);
          }
        }
        break;

      case 'log':
        console.log('� Agent API log:', event);
        setState(prev => ({
          ...prev,
          currentStatus: { status: 'thinking', current_step: 'analyzing' }
        }));
        onStatusUpdate?.({ status: 'thinking', current_step: 'analyzing' });
        
        // Store as reasoning step
        if (event.message_id || state.currentMessageId) {
          const reasoningStep: ReasoningStep = {
            id: `${Date.now()}-${Math.random()}`,
            step_type: 'log',
            step_order: state.reasoningSteps.length,
            content: event.message || event.content || 'Agent logging...',
            step_metadata: event,
            created_at: new Date().toISOString()
          };

          setState(prev => ({
            ...prev,
            reasoningSteps: [...prev.reasoningSteps, reasoningStep]
          }));

          onReasoningUpdate?.(event.message_id || state.currentMessageId!, [...state.reasoningSteps, reasoningStep]);
        }
        break;

      case 'plan':
        console.log('🎯 Agent API plan:', event);
        setState(prev => ({
          ...prev,
          currentStatus: { status: 'planning', current_step: 'creating_plan' }
        }));
        onStatusUpdate?.({ status: 'planning', current_step: 'creating_plan' });

        if (event.message_id || state.currentMessageId) {
          const reasoningStep: ReasoningStep = {
            id: `${Date.now()}-${Math.random()}`,
            step_type: 'plan',
            step_order: state.reasoningSteps.length,
            content: event.plan || event.content || 'Creating plan...',
            step_metadata: event,
            created_at: new Date().toISOString()
          };

          setState(prev => ({
            ...prev,
            reasoningSteps: [...prev.reasoningSteps, reasoningStep]
          }));

          onReasoningUpdate?.(event.message_id || state.currentMessageId!, [...state.reasoningSteps, reasoningStep]);
        }
        break;

      case 'thinking':
        console.log('🤔 Agent API thinking:', event);
        setState(prev => ({
          ...prev,
          currentStatus: { status: 'thinking', current_step: 'reasoning' }
        }));
        onStatusUpdate?.({ status: 'thinking', current_step: 'reasoning' });

        if (event.message_id || state.currentMessageId) {
          const reasoningStep: ReasoningStep = {
            id: `${Date.now()}-${Math.random()}`,
            step_type: 'thinking',
            step_order: state.reasoningSteps.length,
            content: event.thought || event.content || 'Thinking...',
            step_metadata: event,
            created_at: new Date().toISOString()
          };

          setState(prev => ({
            ...prev,
            reasoningSteps: [...prev.reasoningSteps, reasoningStep]
          }));

          onReasoningUpdate?.(event.message_id || state.currentMessageId!, [...state.reasoningSteps, reasoningStep]);
        }
        break;

      case 'tool_call':
        console.log('🔧 Agent API tool call:', event);
        setState(prev => ({
          ...prev,
          currentStatus: { status: 'tool_use', current_step: 'calling_tool' }
        }));
        onStatusUpdate?.({ status: 'tool_use', current_step: 'calling_tool' });

        if (event.message_id || state.currentMessageId) {
          const reasoningStep: ReasoningStep = {
            id: `${Date.now()}-${Math.random()}`,
            step_type: 'tool_call',
            step_order: state.reasoningSteps.length,
            content: `Using tool: ${event.tool || 'unknown'}`,
            tool_name: event.tool,
            tool_args: event.args,
            step_metadata: event,
            created_at: new Date().toISOString()
          };

          setState(prev => ({
            ...prev,
            reasoningSteps: [...prev.reasoningSteps, reasoningStep]
          }));

          onReasoningUpdate?.(event.message_id || state.currentMessageId!, [...state.reasoningSteps, reasoningStep]);
        }
        break;

      case 'code_execution':
        console.log('💻 Agent API code execution:', event);
        setState(prev => ({
          ...prev,
          currentStatus: { status: 'tool_use', current_step: 'executing_code' }
        }));
        onStatusUpdate?.({ status: 'tool_use', current_step: 'executing_code' });

        if (event.message_id || state.currentMessageId) {
          const reasoningStep: ReasoningStep = {
            id: `${Date.now()}-${Math.random()}`,
            step_type: 'code_execution',
            step_order: state.reasoningSteps.length,
            content: event.code || 'Executing code...',
            tool_result: event.result,
            step_metadata: event,
            created_at: new Date().toISOString()
          };

          setState(prev => ({
            ...prev,
            reasoningSteps: [...prev.reasoningSteps, reasoningStep]
          }));

          onReasoningUpdate?.(event.message_id || state.currentMessageId!, [...state.reasoningSteps, reasoningStep]);
        }
        break;

      case 'url_context':
        console.log('🌐 Agent API URL context:', event);
        setState(prev => ({
          ...prev,
          currentStatus: { status: 'tool_use', current_step: 'fetching_context' }
        }));
        onStatusUpdate?.({ status: 'tool_use', current_step: 'fetching_context' });

        if (event.message_id || state.currentMessageId) {
          const reasoningStep: ReasoningStep = {
            id: `${Date.now()}-${Math.random()}`,
            step_type: 'url_context',
            step_order: state.reasoningSteps.length,
            content: `Fetching context from: ${event.url || 'URL'}`,
            step_metadata: event,
            created_at: new Date().toISOString()
          };

          setState(prev => ({
            ...prev,
            reasoningSteps: [...prev.reasoningSteps, reasoningStep]
          }));

          onReasoningUpdate?.(event.message_id || state.currentMessageId!, [...state.reasoningSteps, reasoningStep]);
        }
        break;

      case 'visualization':
        console.log('📊 Agent API visualization:', event);
        setState(prev => ({
          ...prev,
          currentStatus: { status: 'tool_use', current_step: 'creating_visualization' }
        }));
        onStatusUpdate?.({ status: 'tool_use', current_step: 'creating_visualization' });

        if (event.message_id || state.currentMessageId) {
          const reasoningStep: ReasoningStep = {
            id: `${Date.now()}-${Math.random()}`,
            step_type: 'visualization',
            step_order: state.reasoningSteps.length,
            content: 'Creating visualization...',
            step_metadata: event,
            created_at: new Date().toISOString()
          };

          setState(prev => ({
            ...prev,
            reasoningSteps: [...prev.reasoningSteps, reasoningStep]
          }));

          onReasoningUpdate?.(event.message_id || state.currentMessageId!, [...state.reasoningSteps, reasoningStep]);
        }
        break;

      case 'error':
        console.error('❌ Agent API error:', event);
        onError?.(event.error || 'Unknown streaming error');
        break;

      case 'end':
        console.log('🎯 Agent API stream ended:', event);
        if (event.final_content && (event.message_id || state.currentMessageId)) {
          const finalMessage: ChatMessage = {
            id: event.message_id || state.currentMessageId!,
            role: 'assistant',
            content: event.final_content,
            timestamp: new Date()
          };
          onMessageUpdate?.(finalMessage);
        }
        break;

      default:
        console.log('🤷 Unhandled Agent API event:', event.type, event);
        // For any other event types from the Agent API, treat as a reasoning step
        if ((event.message_id || state.currentMessageId) && event.type !== 'unknown') {
          const reasoningStep: ReasoningStep = {
            id: `${Date.now()}-${Math.random()}`,
            step_type: event.type as any,
            step_order: state.reasoningSteps.length,
            content: event.content || event.message || `Agent API event: ${event.type}`,
            step_metadata: event,
            created_at: new Date().toISOString()
          };

          setState(prev => ({
            ...prev,
            reasoningSteps: [...prev.reasoningSteps, reasoningStep]
          }));

          onReasoningUpdate?.(event.message_id || state.currentMessageId!, [...state.reasoningSteps, reasoningStep]);
        }
    }
  }, [state.reasoningSteps, state.accumulatedContent, state.currentMessageId, onMessageUpdate, onNewMessage, onReasoningUpdate, onStatusUpdate, onError]);

  const stopStreaming = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      setState(prev => ({
        ...prev,
        isStreaming: false,
        currentStatus: { status: 'complete' }
      }));
      onStatusUpdate?.({ status: 'complete' });
    }
  }, [onStatusUpdate]);

  return {
    ...state,
    sendMessageWithStreaming,
    uploadFileWithStreaming,
    stopStreaming
  };
};
