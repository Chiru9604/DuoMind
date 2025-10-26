import React from 'react';
import type { Message } from '../types';
import { useChatStore } from '../store/useChatStore';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { mode } = useChatStore();

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (message.isUser) {
    return (
      <div className="flex justify-end mb-4 chat-message">
        <div className="max-w-[80%] md:max-w-[60%]">
          <div className={`
            px-6 py-4 rounded-2xl rounded-br-md text-white shadow-lg backdrop-blur-sm
            ${mode === 'pro' 
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/25' 
              : 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-500/25'
            }
          `}>
            <p className="text-sm leading-relaxed font-medium">{message.content}</p>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4 chat-message">
      <div className="max-w-[80%] md:max-w-[70%]">
        {/* AI Avatar */}
        <div className="flex items-start gap-3">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg backdrop-blur-sm
            ${mode === 'pro' 
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-500/25' 
              : 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-500/25'
            }
          `}>
            AI
          </div>
          
          <div className="flex-1">
            {/* Message Content */}
            <div className={`
              px-5 py-4 rounded-2xl rounded-bl-md shadow-lg backdrop-blur-sm transition-all duration-300
              ${mode === 'pro'
                ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 text-gray-100 border border-emerald-500/30 shadow-emerald-500/10'
                : 'bg-gradient-to-br from-white/90 to-gray-50/90 text-gray-800 border border-purple-300/30 shadow-purple-500/10 dark:from-gray-800/90 dark:to-gray-900/90 dark:text-gray-200 dark:border-purple-500/30'
              }
            `}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {message.content}
              </p>
              
              {/* Sources */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-600/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                    Sources:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {message.sources.map((source, index) => (
                      <span
                        key={index}
                        className={`
                          text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 hover:scale-105
                          ${mode === 'pro'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50'
                          }
                        `}
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Timestamp and Mode */}
            <div className="flex items-center gap-3 mt-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {formatTime(message.timestamp)}
              </div>
              {message.mode && (
                <div className={`
                  text-xs px-3 py-1 rounded-full font-bold transition-all duration-200 hover:scale-105
                  ${message.mode === 'pro'
                    ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-600 border border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50'
                  }
                `}>
                  {message.mode.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};