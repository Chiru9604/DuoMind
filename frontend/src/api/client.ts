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