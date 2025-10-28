import React from 'react';
import { X, FileText } from 'lucide-react';
import type { DocumentInfo } from '../types';

interface ActiveDocumentChipsProps {
  activeDocuments: DocumentInfo[];
  onDocumentRemove: (documentId: string) => void;
  onClearAll?: () => void;
}

export const ActiveDocumentChips: React.FC<ActiveDocumentChipsProps> = ({
  activeDocuments,
  onDocumentRemove,
  onClearAll
}) => {
  if (activeDocuments.length === 0) {
    return null;
  }

  const truncateFilename = (filename: string, maxLength: number = 20) => {
    if (filename.length <= maxLength) return filename;
    const extension = filename.split('.').pop();
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension!.length - 4) + '...';
    return `${truncatedName}.${extension}`;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Active Documents ({activeDocuments.length}):
          </span>
        </div>
        
        {activeDocuments.length > 1 && (
          <button
            onClick={onClearAll}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 mt-2">
        {activeDocuments.map((document) => (
          <div
            key={document.id}
            className="inline-flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm border border-blue-200 dark:border-blue-800"
          >
            <span className="mr-2 truncate max-w-[150px]" title={document.filename}>
              {truncateFilename(document.filename)}
            </span>
            <button
              onClick={() => onDocumentRemove(document.id)}
              className="flex-shrink-0 ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
              title={`Remove ${document.filename}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      
      {activeDocuments.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic mt-2">
          No documents selected. Upload and select documents to enable context-aware chat.
        </div>
      )}
    </div>
  );
};