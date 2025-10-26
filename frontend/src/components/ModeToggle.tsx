import React from 'react';
import { useChatStore } from '../store/useChatStore';
import type { ChatMode } from '../types';

export const ModeToggle: React.FC = () => {
  const { mode, setMode } = useChatStore();

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
  };

  return (
    <div className={`flex items-center justify-center p-6 border-b backdrop-blur-sm transition-all duration-500 ${
      mode === 'pro'
        ? 'border-gray-800/50 bg-black/10'
        : 'border-gray-200/50 bg-white/10'
    }`}>
      <div className={`flex rounded-xl p-1 transition-all duration-500 ${
        mode === 'pro' 
          ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/30' 
          : 'bg-white/50 backdrop-blur-sm border border-gray-300/30'
      }`}>
        <button
          onClick={() => handleModeChange('normal')}
          className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
            mode === 'normal'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
              : mode === 'pro'
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
          }`}
        >
          Normal
        </button>
        <button
          onClick={() => handleModeChange('pro')}
          className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
            mode === 'pro'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25'
              : mode === 'normal'
                ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/30'
          }`}
        >
          Pro
        </button>
      </div>
        
      {/* Mode Description */}
      <div className={`ml-6 text-sm font-light max-w-xs ${
        mode === 'pro'
          ? 'text-gray-400'
          : 'text-gray-500'
      }`}>
        {mode === 'normal' 
          ? 'Factual answers from your documents'
          : 'Creative reasoning beyond the text'
        }
      </div>
    </div>
  );
};