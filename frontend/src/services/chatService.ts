import api from './auth'; 

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id: string;
  message_type?: string;
  file_url?: string;
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

export const chatService = {
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