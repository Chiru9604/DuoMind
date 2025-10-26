import React, { useState } from 'react';
import { useSessionStore } from '../store/useSessionStore';
import { useChatStore } from '../store/useChatStore';
import type { ChatMode } from '../types/index';
import ConfirmationModal from './ConfirmationModal';
import { 
  Plus, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Download, 
  Check, 
  X,
  Calendar
} from 'lucide-react';

interface SessionSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  mode: ChatMode;
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({ isOpen, onToggle, mode }) => {
  const {
    sessions,
    currentSessionId,
    createSession,
    deleteSession,
    renameSession,
    switchToSession,
    exportSessionToMarkdown,
    clearAllSessions,
  } = useSessionStore();

  const { clearMessages } = useChatStore();

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: 'session' | 'all';
    sessionId?: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'session',
    title: '',
    message: ''
  });

  const handleStartEdit = (sessionId: string, currentTitle: string) => {
    setEditingSessionId(sessionId);
    setEditingTitle(currentTitle);
  };

  const handleSaveEdit = (sessionId: string) => {
    if (editingTitle.trim()) {
      renameSession(sessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const handleExportSession = (sessionId: string) => {
    const markdown = exportSessionToMarkdown(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    
    if (session) {
      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleClearAllSessions = () => {
    setConfirmationModal({
      isOpen: true,
      type: 'all',
      title: 'Delete All Sessions',
      message: 'Are you sure you want to delete all sessions? This action cannot be undone and will permanently remove all your chat history.'
    });
  };

  const formatDate = (date: Date | string) => {
    // Convert string to Date if needed
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    const now = new Date();
    const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return dateObj.toLocaleDateString([], { weekday: 'short' });
    } else {
      return dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!isOpen) {
    return null; // Hide sidebar completely when closed
  }

  return (
    <>
      <div className={`
        fixed left-0 top-0 h-full w-80 border-r flex flex-col z-40 transition-all duration-300
        ${mode === 'pro'
          ? 'bg-gradient-to-b from-gray-900 via-black to-gray-900 border-gray-800/50'
          : 'bg-gradient-to-b from-gray-50 via-white to-gray-100 border-gray-200/50'
        }
      `}>
      {/* Header */}
      <div className={`
        p-4 border-b backdrop-blur-sm
        ${mode === 'pro'
          ? 'border-gray-800/50 bg-black/20'
          : 'border-gray-200/50 bg-white/20'
        }
      `}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`
            text-lg font-semibold
            ${mode === 'pro' ? 'text-white' : 'text-gray-900'}
          `}>
            Sessions
          </h2>
          <button
            onClick={onToggle}
            className={`
              p-1 rounded transition-colors
              ${mode === 'pro'
                ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }
            `}
          >
            <X size={18} />
          </button>
        </div>
        
        <button
          onClick={() => {
            clearMessages();
            createSession();
            onToggle(); // Close sidebar on mobile after creating new chat
          }}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors font-medium
            ${mode === 'pro'
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-green-500/25'
              : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25'
            }
          `}
        >
          <Plus size={16} />
          New Session
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-4">
        {sessions.length === 0 ? (
          <div className={`
            text-center py-8
            ${mode === 'pro' ? 'text-gray-400' : 'text-gray-500'}
          `}>
            <MessageSquare size={48} className="mx-auto mb-3 opacity-50" />
            <p>No sessions yet</p>
            <p className="text-sm mt-1">Create your first session to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`
                  group relative p-3 rounded-lg cursor-pointer transition-all duration-200
                  ${currentSessionId === session.id
                    ? mode === 'pro'
                      ? 'bg-gradient-to-r from-emerald-500/20 to-green-600/20 border border-emerald-500/30'
                      : 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30'
                    : mode === 'pro'
                      ? 'hover:bg-gray-800/50 border border-transparent'
                      : 'hover:bg-gray-100/50 border border-transparent'
                  }
                `}
                onClick={() => !editingSessionId && switchToSession(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingSessionId === session.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className={`
                            w-full px-2 py-1 text-sm rounded border focus:outline-none focus:ring-2
                            ${mode === 'pro'
                              ? 'bg-gray-800 border-gray-600 text-white focus:ring-emerald-500'
                              : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-500'
                            }
                          `}
                          autoFocus
                          onKeyDown={(e) => {
                             if (e.key === 'Enter') handleSaveEdit(session.id);
                             if (e.key === 'Escape') handleCancelEdit();
                           }}
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                               e.stopPropagation();
                               handleSaveEdit(session.id);
                             }}
                            className={`
                              p-1 rounded transition-colors
                              ${mode === 'pro'
                                ? 'text-emerald-400 hover:bg-emerald-500/20'
                                : 'text-purple-600 hover:bg-purple-100'
                              }
                            `}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                               e.stopPropagation();
                               handleCancelEdit();
                             }}
                            className={`
                              p-1 rounded transition-colors
                              ${mode === 'pro'
                                ? 'text-gray-400 hover:bg-gray-700'
                                : 'text-gray-600 hover:bg-gray-200'
                              }
                            `}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className={`
                          font-medium text-sm truncate
                          ${mode === 'pro' ? 'text-white' : 'text-gray-900'}
                        `}>
                          {session.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar size={12} className={mode === 'pro' ? 'text-gray-400' : 'text-gray-500'} />
                          <span className={`
                            text-xs
                            ${mode === 'pro' ? 'text-gray-400' : 'text-gray-500'}
                          `}>
                            {formatDate(session.updatedAt)}
                          </span>
                        </div>
                        <p className={`
                          text-xs mt-1 truncate
                          ${mode === 'pro' ? 'text-gray-400' : 'text-gray-500'}
                        `}>
                          {session.messages.length} messages
                        </p>
                      </>
                    )}
                  </div>
                  
                  {editingSessionId !== session.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                           e.stopPropagation();
                           handleStartEdit(session.id, session.title);
                         }}
                        className={`
                          p-1 rounded transition-colors
                          ${mode === 'pro'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                          }
                        `}
                        title="Rename session"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                           e.stopPropagation();
                           handleExportSession(session.id);
                         }}
                        className={`
                          p-1 rounded transition-colors
                          ${mode === 'pro'
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                          }
                        `}
                        title="Export as Markdown"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                           e.stopPropagation();
                           setConfirmationModal({
                             isOpen: true,
                             type: 'session',
                             sessionId: session.id,
                             title: 'Delete Session',
                             message: `Are you sure you want to delete "${session.title}"? This action cannot be undone and will permanently remove this chat session.`
                           });
                         }}
                        className={`
                          p-1 rounded transition-colors
                          ${mode === 'pro'
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20'
                            : 'text-red-500 hover:text-red-700 hover:bg-red-100'
                          }
                        `}
                        title="Delete session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {sessions.length > 0 && (
        <div className={`
          p-4 border-t backdrop-blur-sm
          ${mode === 'pro'
            ? 'border-gray-800/50 bg-black/20'
            : 'border-gray-200/50 bg-white/20'
          }
        `}>
          <button
            onClick={handleClearAllSessions}
            className={`
              w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm
              ${mode === 'pro'
                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/20 border border-red-500/30'
                : 'text-red-600 hover:text-red-700 hover:bg-red-100 border border-red-300'
              }
            `}
          >
            <Trash2 size={16} />
            Clear All Sessions
          </button>
        </div>
      )}
    </div>

    {/* Confirmation Modal */}
    <ConfirmationModal
      isOpen={confirmationModal.isOpen}
      onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
      onConfirm={() => {
        if (confirmationModal.type === 'session' && confirmationModal.sessionId) {
          deleteSession(confirmationModal.sessionId);
        } else if (confirmationModal.type === 'all') {
          clearAllSessions();
        }
      }}
      title={confirmationModal.title}
      message={confirmationModal.message}
      mode={mode}
    />
  </>
  );
};