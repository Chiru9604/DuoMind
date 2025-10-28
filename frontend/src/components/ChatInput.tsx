import React, { useState, useRef } from 'react';
import { Send, Paperclip, Loader2, AlertCircle } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import type { DocumentInfo } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onFileUpload: (file: File) => void;
  disabled?: boolean;
  activeDocuments?: DocumentInfo[];
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onFileUpload, 
  disabled = false,
  activeDocuments = []
}) => {
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mode, isLoading } = useChatStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled && !isLoading) {
      // Check if documents are uploaded
      if (activeDocuments.length === 0) {
        setShowUploadPrompt(true);
        setTimeout(() => setShowUploadPrompt(false), 3000); // Hide after 3 seconds
        return;
      }
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.docx'))) {
      onFileUpload(file);
    }
  };

  return (
    <div className={`relative border-t backdrop-blur-sm p-6 transition-all duration-500 ${
      mode === 'pro'
        ? 'border-gray-800/50 bg-black/20'
        : 'border-gray-200/50 bg-white/50'
    }`}>
      {/* Upload Prompt Notification */}
      {showUploadPrompt && (
        <div className={`absolute top-2 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg border transition-all duration-300 animate-in slide-in-from-top-2 ${
          mode === 'pro'
            ? 'bg-orange-900/90 border-orange-700/50 text-orange-200 backdrop-blur-sm'
            : 'bg-orange-50 border-orange-200 text-orange-800'
        }`}>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Please upload a document first to start chatting</span>
          </div>
        </div>
      )}

      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300 rounded-2xl ${
          mode === 'pro'
            ? 'bg-emerald-500/10 border-2 border-dashed border-emerald-400'
            : 'bg-purple-500/10 border-2 border-dashed border-purple-400'
        }`}>
          <div className="text-center">
            <Paperclip className={`w-10 h-10 mx-auto mb-3 animate-bounce ${
              mode === 'pro' ? 'text-emerald-400' : 'text-purple-500'
            }`} />
            <p className={`text-lg font-medium ${
              mode === 'pro' ? 'text-emerald-400' : 'text-purple-500'
            }`}>
              Drop your PDF or DOCX file here
            </p>
            <p className="text-sm opacity-75 mt-1">Release to upload</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className={`
          flex items-end gap-4 p-4 rounded-2xl border backdrop-blur-sm transition-all duration-300
          ${mode === 'pro'
            ? 'bg-gray-900/50 border-gray-700/50 focus-within:border-emerald-500/50 focus-within:shadow-lg focus-within:shadow-emerald-500/20'
            : 'bg-gray-50/50 border-gray-300/50 focus-within:border-emerald-500/50 focus-within:shadow-lg focus-within:shadow-emerald-500/20 dark:bg-gray-800/50 dark:border-gray-600/50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        >
          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
            className={`
              p-3 rounded-full transition-all duration-300 group
              ${mode === 'pro'
                ? 'text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 hover:shadow-lg hover:shadow-emerald-500/20'
                : 'text-gray-500 hover:text-purple-500 hover:bg-purple-50 hover:shadow-lg hover:shadow-purple-500/20 dark:text-gray-400 dark:hover:text-purple-400 dark:hover:bg-purple-500/10'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <Paperclip className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          </button>

          {/* Text Input */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask AI a question or make a request...`}
            disabled={disabled || isLoading}
            className={`
              flex-1 resize-none bg-transparent border-none outline-none text-lg
              ${mode === 'pro'
                ? 'text-gray-100 placeholder-gray-500'
                : 'text-gray-800 placeholder-gray-400 dark:text-gray-200 dark:placeholder-gray-400'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
              max-h-32 min-h-[28px]
            `}
            rows={1}
            style={{
              height: 'auto',
              minHeight: '28px',
              maxHeight: '128px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 128) + 'px';
            }}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!input.trim() || disabled || isLoading}
            className={`
              p-3 rounded-full transition-all duration-300 group relative overflow-hidden
              ${mode === 'pro'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/25'
                : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/25'
              }
              text-white disabled:opacity-50 disabled:cursor-not-allowed
              disabled:hover:from-gray-400 disabled:hover:to-gray-500
            `}
          >
            {/* Button glow effect */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-full blur-md ${
              mode === 'pro' 
                ? 'bg-gradient-to-r from-emerald-400 to-green-500' 
                : 'bg-gradient-to-r from-purple-400 to-purple-500'
            }`}></div>
            
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin relative z-10" />
            ) : (
              <Send className="w-5 h-5 group-hover:scale-110 transition-transform duration-200 relative z-10" />
            )}
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </form>


    </div>
  );
};