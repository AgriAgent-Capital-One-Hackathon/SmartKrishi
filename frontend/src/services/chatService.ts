import api from './auth'; 

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id: string;
}

export interface ChatResponse {
  response: string;
  message_id?: string;
}

export interface ChatSuggestion {
  id: string;
  text: string;
  prompt: string;
}

export const chatService = {
  async sendMessage(message: string, chatHistory: ChatMessage[] = []): Promise<string> {
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

  async analyzeImage(file: File, message: string = 'Analyze this crop image'): Promise<string> {
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
  },

  async getSuggestions(): Promise<ChatSuggestion[]> {
    try {
      const response = await api.get('/chat/suggestions');
      return response.data.suggestions;
    } catch (error) {
      console.error('Suggestions service error:', error);
      throw error;
    }
  }
};