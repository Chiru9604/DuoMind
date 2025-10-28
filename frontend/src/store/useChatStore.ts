import { create } from 'zustand';
import type { ChatState, Message, ChatMode, DocumentInfo } from '../types';

interface ChatStore extends ChatState {
  addMessage: (content: string, isUser: boolean, mode?: ChatMode) => void;
  updateLastMessage: (content: string) => void;
  setMode: (mode: ChatMode) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  clearError: () => void;
  // Document management
  setActiveDocuments: (documents: DocumentInfo[]) => void;
  addActiveDocument: (document: DocumentInfo) => void;
  removeActiveDocument: (documentId: string) => void;
  toggleActiveDocument: (document: DocumentInfo) => void;
  clearActiveDocuments: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  mode: 'normal',
  isLoading: false,
  error: null,
  activeDocuments: [],

  addMessage: (content: string, isUser: boolean, mode?: ChatMode) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${performance.now().toString(36)}`,
      content,
      isUser,
      timestamp: new Date(),
      mode: mode || get().mode,
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  updateLastMessage: (content: string) => {
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
        };
      }
      return { messages };
    });
  },

  setMode: (mode: ChatMode) => set({ mode }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  clearMessages: () => set({ messages: [] }),
  clearError: () => set({ error: null }),

  // Document management methods
  setActiveDocuments: (activeDocuments: DocumentInfo[]) => set({ activeDocuments }),
  
  addActiveDocument: (document: DocumentInfo) => {
    set((state) => {
      const exists = state.activeDocuments.some(doc => doc.id === document.id);
      if (!exists) {
        return {
          activeDocuments: [...state.activeDocuments, { ...document, is_active: true }]
        };
      }
      return state;
    });
  },

  removeActiveDocument: (documentId: string) => {
    set((state) => ({
      activeDocuments: state.activeDocuments.filter(doc => doc.id !== documentId)
    }));
  },

  toggleActiveDocument: (document: DocumentInfo) => {
    const state = get();
    const exists = state.activeDocuments.some(doc => doc.id === document.id);
    
    if (exists) {
      state.removeActiveDocument(document.id);
    } else {
      state.addActiveDocument(document);
    }
  },

  clearActiveDocuments: () => set({ activeDocuments: [] }),
}));