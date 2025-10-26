import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModeToggle } from './ModeToggle';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChatStore } from '../store/useChatStore';
import { api } from '../api/client';
import { FileText, Trash2, AlertCircle } from 'lucide-react';

export const ChatApp: React.FC = () => {
  const navigate = useNavigate();
  const {
    messages,
    mode,
    isLoading,
    error,
    addMessage,
    setLoading,
    setError,
    clearMessages,
    clearError,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (message: string) => {
    try {
      // Add user message
      addMessage(message, true);
      setLoading(true);
      clearError();

      // Send to API
      const response = await api.ragQuery({
        query: message,
        mode: mode,
      });

      // Add AI response
      addMessage(response.answer, false, response.mode, response.sources);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setLoading(true);
      clearError();

      const response = await api.uploadFile(file);
      
      // Add system message about successful upload
      addMessage(
        `📄 Successfully uploaded "${response.filename}" (${response.chunks_created} chunks created)`,
        false
      );
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      clearMessages();
    }
  };

  return (
    <div className={`
      flex flex-col h-screen transition-all duration-500
      ${mode === 'pro' 
        ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900 text-gray-100' 
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'
      }
    `}>
      {/* Header */}
      <div className={`
        flex items-center justify-between p-6 border-b backdrop-blur-sm
        ${mode === 'pro'
          ? 'border-gray-800/50 bg-black/20'
          : 'border-gray-200/50 bg-white/20'
        }
        transition-all duration-500
      `}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center relative cursor-pointer transition-all duration-300 hover:scale-105
              ${mode === 'pro'
                ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 shadow-lg shadow-green-500/25 hover:shadow-green-500/40'
                : 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
              }
            `}
          >
            {/* Subtle glow */}
            <div className={`absolute inset-0 rounded-full blur-md opacity-40 ${
              mode === 'pro'
                ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600'
                : 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600'
            }`}></div>
            <FileText className="w-6 h-6 text-white relative z-10" />
          </button>
          <div>
            <h1 className="text-2xl font-light tracking-wide">DuoMind</h1>
            <p className={`
              text-sm font-light
              ${mode === 'pro'
                ? 'text-gray-400'
                : 'text-gray-500'
              }
            `}>
              Dual-Mode RAG Chat
            </p>
          </div>
        </div>

        <button
          onClick={handleClearChat}
          disabled={messages.length === 0}
          className={`
            p-3 rounded-full transition-all duration-300 group
            ${mode === 'pro'
              ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/20'
              : 'text-gray-500 hover:text-red-500 hover:bg-red-50 hover:shadow-lg hover:shadow-red-500/20 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-500/10'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
        </button>
      </div>

      {/* Mode Toggle */}
      <ModeToggle />

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button
            onClick={clearError}
            className="ml-auto text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            {/* Animated Orb */}
            <div className="relative mb-8">
              <div className={`
                w-24 h-24 rounded-full flex items-center justify-center relative
                ${mode === 'pro'
                  ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 shadow-2xl shadow-green-500/30'
                  : 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600 shadow-2xl shadow-purple-500/30'
                }
                animate-pulse-slow
              `}>
                {/* Glow effect */}
                <div className={`
                  absolute inset-0 rounded-full blur-xl opacity-60
                  ${mode === 'pro'
                    ? 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600'
                    : 'bg-gradient-to-br from-purple-400 via-purple-500 to-purple-600'
                  }
                `}></div>
                
                {/* Inner orb */}
                <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-white/20 to-transparent backdrop-blur-sm border border-white/30 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>

            {/* Greeting */}
            <div className="mb-8">
              <h1 className={`
                text-4xl font-light mb-2
                ${mode === 'pro'
                  ? 'text-white'
                  : 'text-gray-800'
                }
              `}>
                Pleased to Have You !
              </h1>
              <h2 className={`
                text-2xl font-light
                ${mode === 'pro'
                  ? 'text-gray-300'
                  : 'text-gray-600'
                }
              `}>
                What's on <span className={`
                  font-normal bg-gradient-to-r ${mode === 'pro' ? 'from-emerald-400 to-green-500' : 'from-purple-400 to-purple-600'} bg-clip-text text-transparent
                `}>your mind?</span>
              </h2>
            </div>

            {/* Subtle description */}
            <p className={`
              text-sm max-w-md leading-relaxed
              ${mode === 'pro'
                ? 'text-gray-400'
                : 'text-gray-500'
              }
            `}>
              Upload your documents and start asking questions. Switch between modes for different types of insights.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        disabled={isLoading}
      />
    </div>
  );
};