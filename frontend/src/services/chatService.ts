import api from './auth'; 

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id: string;
  message_type?: string;
  file_url?: string;
  // New fields for reasoning integration
  reasoning_steps?: ReasoningStep[];
  is_streaming?: boolean;
  is_thinking?: boolean;
}

export interface ChatResponse {
  response: string;
  chat_id: string;
  message_id: string;
}

export interface ChatSuggestion {
  id: string;
  text: string;
  prompt: string;
}

export interface ChatSummary {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message: string;
  message_count: number;
}

export interface Chat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    message_type: string;
    file_url?: string;
    created_at: string;
  }>;
}

// New interfaces for agent integration
export interface ReasoningStep {
  id: string;
  step_type: string;
  step_order: number;
  stage?: string;
  content?: string;
  message?: string;
  tool_name?: string;
  tool?: string;
  tool_args?: string;
  tool_result?: any;
  step_metadata?: any;
  created_at: string;
  
  // Plan event fields
  plan?: any;
  raw_response?: string;
  
  // Code execution fields
  code?: string;
  language?: string;
  outcome?: 'success' | 'error';
  result?: string;
  
  // Search fields
  query?: string;
  queries?: string[];
  results?: any;
  
  // Grounding fields
  sources?: any[];
  supports?: any[];
  
  // Error fields
  error?: string;
}

export interface StreamingEvent {
  type: string;
  data?: any;
  content?: string;
  message?: string;
  message_id?: string;
  chat_id?: string;
  status?: StreamingStatus;
  error?: string;
  
  // Log event fields
  stage?: string;
  
  // Plan event fields
  plan?: any;
  raw_response?: string;
  
  // Tool call fields
  tool?: string;
  args?: any;
  result?: any;
  
  // Code execution fields
  code?: string;
  language?: string;
  outcome?: 'success' | 'error';
  
  // Search fields
  query?: string;
  queries?: string[];
  results?: any;
  
  // Grounding fields
  sources?: any[];
  supports?: any[];
  
  // Response fields
  response?: string;
  grounding_metadata?: any;
  final_content?: string;
  
  // Legacy fields
  thought?: string;
  url?: string;
  
  // Allow any additional fields from the Agent API
  [key: string]: any;
}

export interface StreamingStatus {
  status: 'initializing' | 'thinking' | 'responding' | 'complete' | 'error' | 'planning' | 'tool_use';
  current_step?: string;
  progress?: number;
}

export interface ChatMessageWithReasoning extends ChatMessage {
  reasoning_steps?: ReasoningStep[];
}

export interface AgentConfig {
  id: string;
  user_id: number;
  preferred_model: string;
  default_tools?: string[];
  include_logs: boolean;
  created_at: string;
  updated_at: string;
}

export const chatService = {
  // New streaming methods
  async *sendMessageStream(
    message: string, 
    chatId?: string,
    options?: {
      model?: string;
      tools?: string[];
      include_logs?: boolean;
    }
  ): AsyncGenerator<StreamingEvent, void, unknown> {
    try {
      // Use fetch instead of axios for proper streaming support
      const token = localStorage.getItem('auth_token');
      console.log('🔐 Auth token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/chat/send-stream`;
      const payload = {
        message,
        chat_id: chatId || null,
        model: options?.model,
        tools: options?.tools,
        include_logs: options?.include_logs
      };
      
      console.log('📨 Streaming request:', { url, payload });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let eventCount = 0;

      console.log('🎯 Starting to read stream...');

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('✅ Stream reading completed');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log('📦 Raw chunk:', chunk.length, 'bytes:', chunk.substring(0, 200));
        
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            eventCount++;
            const dataStr = line.slice(6).trim();
            console.log(`🎉 Event [${eventCount}]:`, dataStr);
            
            if (dataStr === '[DONE]' || dataStr.includes('"type":"end"')) {
              console.log('🏁 End event received, stopping stream');
              return;
            }

            if (dataStr) {
              try {
                const eventData = JSON.parse(dataStr);
                console.log('✅ Parsed event:', eventData.type, eventData);
                yield eventData as StreamingEvent;
              } catch (e) {
                console.warn('❌ Failed to parse streaming event:', e, 'Data:', dataStr);
              }
            }
          } else if (line.trim()) {
            console.log('📝 Non-data line:', line);
          }
        }
      }
      
      console.log(`🏆 Stream completed with ${eventCount} events`);
    } catch (error) {
      console.error('💥 Stream error:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown streaming error'
      };
    }
  },

  async* uploadFileAndAnalyzeStream(
    file: File, 
    message: string = 'Analyze this file', 
    chatId?: string
  ): AsyncGenerator<StreamingEvent, void, unknown> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('message', message);
      if (chatId) {
        formData.append('chat_id', chatId);
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/chat/upload-and-analyze-stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream'
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr.trim() === '[DONE]' || dataStr.trim() === '{"type":"done"}') {
              return;
            }

            try {
              const eventData = JSON.parse(dataStr);
              yield eventData as StreamingEvent;
            } catch (e) {
              console.warn('Failed to parse streaming event:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('File upload stream error:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown file upload error'
      };
    }
  },

  async getChatReasoning(chatId: string): Promise<{ chat_id: string; reasoning_steps: ReasoningStep[] }> {
    try {
      const response = await api.get(`/chat/chats/${chatId}/reasoning`);
      return response.data;
    } catch (error) {
      console.error('Get chat reasoning error:', error);
      throw error;
    }
  },

  async getMessageReasoning(messageId: string): Promise<{ message_id: string; reasoning_steps: ReasoningStep[] }> {
    try {
      const response = await api.get(`/chat/messages/${messageId}/reasoning`);
      return response.data;
    } catch (error) {
      console.error('Get message reasoning error:', error);
      throw error;
    }
  },

  async getAvailableAgentTools(): Promise<string[]> {
    try {
      const response = await api.get('/chat/agent-tools');
      return response.data.tools;
    } catch (error) {
      console.error('Get agent tools error:', error);
      throw error;
    }
  },

  async getAgentConfig(): Promise<AgentConfig> {
    try {
      const response = await api.get('/chat/agent-config');
      return response.data;
    } catch (error) {
      console.error('Get agent config error:', error);
      throw error;
    }
  },

  async updateAgentConfig(config: Partial<AgentConfig>): Promise<AgentConfig> {
    try {
      const response = await api.put('/chat/agent-config', config);
      return response.data;
    } catch (error) {
      console.error('Update agent config error:', error);
      throw error;
    }
  },

  // Existing methods
  async sendMessage(message: string, chatId?: string): Promise<ChatResponse> {
    try {
      const response = await api.post('/chat/send', {
        message,
        chat_id: chatId || null
      });

      return response.data;
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
    }
  },

  async analyzeImage(file: File, message: string = 'Analyze this crop image', chatId?: string): Promise<ChatResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('message', message);
      if (chatId) {
        formData.append('chat_id', chatId);
      }

      const response = await api.post('/chat/analyze-image-persistent', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Image analysis error:', error);
      throw error;
    }
  },

  async getUserChats(skip: number = 0, limit: number = 50): Promise<ChatSummary[]> {
    try {
      const response = await api.get('/chat/chats', {
        params: { skip, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Get chats error:', error);
      throw error;
    }
  },

  async getChat(chatId: string): Promise<Chat> {
    try {
      const response = await api.get(`/chat/chats/${chatId}`);
      return response.data;
    } catch (error) {
      console.error('Get chat error:', error);
      throw error;
    }
  },

  async createChat(title: string): Promise<Chat> {
    try {
      const response = await api.post('/chat/chats', { title });
      return response.data;
    } catch (error) {
      console.error('Create chat error:', error);
      throw error;
    }
  },

  async updateChat(chatId: string, title: string): Promise<Chat> {
    try {
      const response = await api.put(`/chat/chats/${chatId}`, { title });
      return response.data;
    } catch (error) {
      console.error('Update chat error:', error);
      throw error;
    }
  },

  async deleteChat(chatId: string): Promise<void> {
    try {
      await api.delete(`/chat/chats/${chatId}`);
    } catch (error) {
      console.error('Delete chat error:', error);
      throw error;
    }
  },

  async getSuggestions(): Promise<ChatSuggestion[]> {
    try {
      const response = await api.get('/chat/suggestions');
      return response.data.suggestions;
    } catch (error) {
      console.error('Suggestions service error:', error);
      throw error;
    }
  },

  // Legacy methods for backward compatibility
  async sendMessageLegacy(message: string, chatHistory: ChatMessage[] = []): Promise<string> {
    try {
      const response = await api.post('/chat/ask', {
        message,
        chat_history: chatHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      });

      return response.data.response;
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
    }
  },

  async analyzeImageLegacy(file: File, message: string = 'Analyze this crop image'): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('message', message);

      const response = await api.post('/chat/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.response;
    } catch (error) {
      console.error('Image analysis error:', error);
      throw error;
    }
  }
};