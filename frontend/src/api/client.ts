import axios from 'axios';
import type { RAGRequest, RAGResponse, UploadResponse, ApiError } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    if (error.response?.data) {
      throw new Error(error.response.data.detail || error.response.data.error || 'API Error');
    } else if (error.request) {
      throw new Error('Network error - please check your connection');
    } else {
      throw new Error('Request failed');
    }
  }
);

export const api = {
  // Upload file
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // RAG query
  ragQuery: async (request: RAGRequest): Promise<RAGResponse> => {
    const response = await apiClient.post('/rag', request);
    return response.data;
  },

  // RAG query with streaming
  ragQueryStream: async (request: RAGRequest, onChunk: (chunk: any) => void, onError?: (error: string) => void, onComplete?: () => void): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/rag/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'close') {
                  onComplete?.();
                  return;
                } else if (data.type === 'error') {
                  onError?.(data.content || 'Stream error occurred');
                  return;
                } else {
                  onChunk(data);
                }
              } catch (parseError) {
                console.warn('Failed to parse SSE data:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Streaming error:', error);
      onError?.(error instanceof Error ? error.message : 'Streaming failed');
    }
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Clear documents
  clearDocuments: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete('/documents');
    return response.data;
  },

  // Get document count
  getDocumentCount: async (): Promise<{ count: number }> => {
    const response = await apiClient.get('/documents/count');
    return response.data;
  },
};