export type ChatMode = 'normal' | 'pro';

export interface DocumentInfo {
  id: string;
  filename: string;
  upload_timestamp: string;
  total_chunks: number;
  document_type: string;
  is_active: boolean;
}

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
  activeDocuments: DocumentInfo[];
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionState {
  sessions: Session[];
  currentSessionId: string | null;
  isLoading: boolean;
}

export interface UploadResponse {
  message: string;
  filename: string;
  chunks_created: number;
  document_id: string;
}

export interface DocumentsListResponse {
  documents: DocumentInfo[];
  total_documents: number;
}

export interface RAGRequest {
  query: string;
  mode: ChatMode;
  active_document_ids?: string[];
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