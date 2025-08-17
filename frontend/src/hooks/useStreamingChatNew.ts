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

  const abortController = useRef<AbortController | null>(null);

  const sendMessageWithStreaming = useCallback(async (
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
      currentStatus: { status: 'initializing' }
    }));

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

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'File upload streaming failed';
      
      setState(prev => ({
        ...prev,
        isStreaming: false,
        currentStatus: { status: 'error' }
      }));

      onError?.(errorMessage);
    }
  }, [onMessageUpdate, onNewMessage, onError]);

  const handleStreamingEvent = useCallback(async (event: StreamingEvent) => {
    console.log('🎭 Agent API Event:', event.type, event);
    
    const messageId = event.message_id;
    if (!messageId) return;

    setState(prev => {
      const newStreamingMessages = new Map(prev.streamingMessages);
      const currentMessage = newStreamingMessages.get(messageId) || {
        messageId,
        isThinking: false,
        isStreaming: false,
        accumulatedContent: '',
        reasoningSteps: []
      };

      switch (event.type) {
        case 'log':
        case 'plan':
        case 'thinking':
        case 'code_execution':
          // Add reasoning step
          const reasoningStep: ReasoningStep = {
            id: `${Date.now()}-${Math.random()}`,
            step_type: event.type,
            step_order: currentMessage.reasoningSteps.length,
            content: event.content || event.message || JSON.stringify(event.plan || event.thought || event),
            tool_name: event.tool,
            tool_args: event.args,
            tool_result: event.result,
            step_metadata: event,
            created_at: new Date().toISOString()
          };

          currentMessage.reasoningSteps.push(reasoningStep);
          currentMessage.isThinking = true;
          
          // Update the thinking message
          const thinkingMessage: ChatMessage = {
            id: messageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            reasoning_steps: currentMessage.reasoningSteps,
            is_thinking: true,
            is_streaming: false
          };
          
          onMessageUpdate?.(thinkingMessage);
          break;

        case 'response_chunk':
          // Start streaming response
          currentMessage.isThinking = false;
          currentMessage.isStreaming = true;
          currentMessage.accumulatedContent += event.content || '';

          const streamingMessage: ChatMessage = {
            id: messageId,
            role: 'assistant',
            content: currentMessage.accumulatedContent,
            timestamp: new Date(),
            reasoning_steps: currentMessage.reasoningSteps,
            is_thinking: false,
            is_streaming: true
          };
          
          onMessageUpdate?.(streamingMessage);
          break;

        case 'end':
          // Finalize message
          currentMessage.isThinking = false;
          currentMessage.isStreaming = false;
          
          const finalContent = event.final_content || currentMessage.accumulatedContent;
          
          const finalMessage: ChatMessage = {
            id: messageId,
            role: 'assistant',
            content: finalContent,
            timestamp: new Date(),
            reasoning_steps: currentMessage.reasoningSteps,
            is_thinking: false,
            is_streaming: false
          };
          
          onMessageUpdate?.(finalMessage);
          newStreamingMessages.delete(messageId); // Clean up
          break;

        case 'error':
          onError?.(event.error || 'Unknown streaming error');
          newStreamingMessages.delete(messageId);
          break;
      }

      newStreamingMessages.set(messageId, currentMessage);

      return {
        ...prev,
        streamingMessages: newStreamingMessages
      };
    });
  }, [onMessageUpdate, onError]);

  const stopStreaming = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      setState(prev => ({
        ...prev,
        isStreaming: false,
        currentStatus: { status: 'complete' }
      }));
    }
  }, []);

  return {
    ...state,
    sendMessageWithStreaming,
    uploadFileWithStreaming,
    stopStreaming
  };
};
