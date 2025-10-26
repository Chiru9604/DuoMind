export type ChatMode = 'normal' | 'pro';

export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  mode?: ChatMode;
  sources?: string[];
}

export interface ChatState {
  messages: Message[];
  mode: ChatMode;
  isLoading: boolean;
  error: string | null;
}

export interface UploadResponse {
  message: string;
  filename: string;
  chunks_created: number;
}

export interface RAGRequest {
  query: string;
  mode: ChatMode;
}

export interface RAGResponse {
  answer: string;
  mode: ChatMode;
  sources: string[];
  processing_time: number;
}

export interface ApiError {
  error: string;
  detail?: string;
}