import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle2, Circle } from 'lucide-react';
import type { DocumentInfo, ChatMode } from '../types';
import { api } from '../api/client';

interface DocumentSelectorProps {
  activeDocuments: DocumentInfo[];
  onDocumentToggle: (documentId: string) => void;
  onRefresh?: () => void;
  mode: ChatMode;
}

export const DocumentSelector: React.FC<DocumentSelectorProps> = ({
  activeDocuments,
  onDocumentToggle,
  onRefresh,
  mode
}) => {
  const [allDocuments, setAllDocuments] = useState<DocumentInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getDocuments();
      setAllDocuments(response.documents);
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const formatDate = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown';
    }
  };

  const isDocumentActive = (documentId: string) => {
    return activeDocuments.some(doc => doc.id === documentId);
  };

  if (allDocuments.length === 0 && !isLoading) {
    return (
      <div className={`rounded-lg p-4 border transition-all duration-500 ${
        mode === 'pro'
          ? 'bg-gray-900/50 border-gray-700/50 backdrop-blur-sm'
          : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
      }`}>
        <div className={`flex items-center justify-center ${
          mode === 'pro' ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
        }`}>
          <FileText className="w-5 h-5 mr-2" />
          <span>No documents uploaded yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border shadow-sm transition-all duration-500 ${
      mode === 'pro'
        ? 'bg-gray-900/50 border-gray-700/50 backdrop-blur-sm'
        : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700'
    }`}>
      <div className={`p-4 border-b transition-all duration-500 ${
        mode === 'pro'
          ? 'border-gray-700/50'
          : 'border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold transition-all duration-500 ${
            mode === 'pro' ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>
            Document Selection
          </h3>
          <button
            onClick={fetchDocuments}
            disabled={isLoading}
            className={`text-sm transition-all duration-500 disabled:opacity-50 ${
              mode === 'pro'
                ? 'text-emerald-400 hover:text-emerald-300'
                : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300'
            }`}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <p className={`text-sm mt-1 transition-all duration-500 ${
          mode === 'pro' ? 'text-gray-400' : 'text-gray-600 dark:text-gray-400'
        }`}>
          Select documents to include in your chat context
        </p>
      </div>

      <div className="p-4">
        {error && (
          <div className={`mb-4 p-3 border rounded-lg transition-all duration-500 ${
            mode === 'pro'
              ? 'bg-red-900/30 border-red-700/50 text-red-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
          }`}>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          {allDocuments.map((document) => {
            const isActive = isDocumentActive(document.id);
            
            return (
              <div
                key={document.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-500
                  ${mode === 'pro'
                    ? isActive 
                      ? 'bg-emerald-900/30 border-emerald-700/50 hover:bg-emerald-900/40' 
                      : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70'
                    : isActive 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                  }
                `}
                onClick={() => onDocumentToggle(document.id)}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`
                    flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
                    ${mode === 'pro'
                      ? isActive 
                        ? 'bg-emerald-800/50' 
                        : 'bg-gray-700/50'
                      : isActive 
                        ? 'bg-blue-100 dark:bg-blue-800' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }
                  `}>
                    <FileText className={`w-4 h-4 transition-all duration-500 ${
                      mode === 'pro'
                        ? isActive ? 'text-emerald-400' : 'text-gray-400'
                        : isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate transition-all duration-500 ${
                      mode === 'pro'
                        ? isActive ? 'text-emerald-100' : 'text-white'
                        : isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                    }`}>
                      {document.filename}
                    </p>
                    <div className={`flex items-center space-x-3 text-xs transition-all duration-500 ${
                      mode === 'pro' ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(document.upload_timestamp)}
                      </span>
                      <span>{document.total_chunks} chunks</span>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 ml-3">
                  {isActive ? (
                    <CheckCircle2 className={`w-5 h-5 transition-all duration-500 ${
                      mode === 'pro' ? 'text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                    }`} />
                  ) : (
                    <Circle className={`w-5 h-5 transition-all duration-500 ${
                      mode === 'pro' ? 'text-gray-500' : 'text-gray-400 dark:text-gray-500'
                    }`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {activeDocuments.length > 0 && (
          <div className={`mt-4 pt-4 border-t transition-all duration-500 ${
            mode === 'pro' ? 'border-gray-700/50' : 'border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium transition-all duration-500 ${
                mode === 'pro' ? 'text-gray-300' : 'text-gray-700 dark:text-gray-300'
              }`}>
                Active Documents: {activeDocuments.length}
              </span>
              <button
                onClick={() => activeDocuments.forEach(doc => onDocumentToggle(doc.id))}
                className={`text-xs transition-all duration-500 ${
                  mode === 'pro'
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};