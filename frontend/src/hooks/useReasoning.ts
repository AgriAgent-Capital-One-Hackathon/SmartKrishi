import { useState, useCallback } from 'react';
import { chatService } from '../services/chatService';
import type { ReasoningStep } from '../services/chatService';

interface ReasoningState {
  steps: ReasoningStep[];
  isLoading: boolean;
  error: string | null;
  isVisible: boolean;
}

export const useReasoning = () => {
  const [state, setState] = useState<ReasoningState>({
    steps: [],
    isLoading: false,
    error: null,
    isVisible: false
  });

  const toggleVisibility = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: !prev.isVisible
    }));
  }, []);

  const loadChatReasoning = useCallback(async (chatId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { reasoning_steps } = await chatService.getChatReasoning(chatId);
      setState(prev => ({
        ...prev,
        steps: reasoning_steps,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load reasoning';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
    }
  }, []);

  const loadMessageReasoning = useCallback(async (messageId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { reasoning_steps } = await chatService.getMessageReasoning(messageId);
      setState(prev => ({
        ...prev,
        steps: reasoning_steps,
        isLoading: false
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load reasoning';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
    }
  }, []);

  const addReasoningStep = useCallback((step: ReasoningStep) => {
    setState(prev => ({
      ...prev,
      steps: [...prev.steps, step]
    }));
  }, []);

  const updateReasoningSteps = useCallback((newSteps: ReasoningStep[]) => {
    setState(prev => ({
      ...prev,
      steps: newSteps
    }));
  }, []);

  const clearReasoning = useCallback(() => {
    setState(prev => ({
      ...prev,
      steps: []
    }));
  }, []);

  const getStepsByType = useCallback((stepType: string) => {
    return state.steps.filter(step => step.step_type === stepType);
  }, [state.steps]);

  const getLatestStep = useCallback(() => {
    return state.steps.length > 0 ? state.steps[state.steps.length - 1] : null;
  }, [state.steps]);

  return {
    ...state,
    toggleVisibility,
    loadChatReasoning,
    loadMessageReasoning,
    addReasoningStep,
    updateReasoningSteps,
    clearReasoning,
    getStepsByType,
    getLatestStep
  };
};
