import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatState, Message, ChatMode } from '../types';

interface ChatActions {
  addMessage: (content: string, isUser: boolean, mode?: ChatMode, sources?: string[]) => void;
  updateLastMessage: (content: string) => void;
  setMode: (mode: ChatMode) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  clearError: () => void;
}

type ChatStore = ChatState & ChatActions;

const MAX_MESSAGES = 100;

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      mode: 'normal',
      isLoading: false,
      error: null,

      // Actions
      addMessage: (content: string, isUser: boolean, mode?: ChatMode, sources?: string[]) => {
        const newMessage: Message = {
          id: crypto.randomUUID(),
          content,
          isUser,
          timestamp: new Date(),
          mode,
          sources,
        };

        set((state) => {
          const updatedMessages = [...state.messages, newMessage];
          
          // Keep only the last MAX_MESSAGES
          if (updatedMessages.length > MAX_MESSAGES) {
            updatedMessages.splice(0, updatedMessages.length - MAX_MESSAGES);
          }
          
          return {
            messages: updatedMessages,
            error: null, // Clear error on new message
          };
        });
      },

      updateLastMessage: (content: string) => {
        set((state) => {
          const messages = [...state.messages];
          if (messages.length > 0 && !messages[messages.length - 1].isUser) {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content,
            };
          }
          return { messages };
        });
      },

      setMode: (mode: ChatMode) => {
        set({ mode });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      setError: (error: string | null) => {
        set({ error, isLoading: false });
      },

      clearMessages: () => {
        set({ messages: [], error: null });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'duomind-chat-storage',
      partialize: (state) => ({
        messages: state.messages,
        mode: state.mode,
      }),
    }
  )
);