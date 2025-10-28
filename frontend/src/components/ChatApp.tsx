import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModeToggle } from './ModeToggle';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SessionSidebar } from './SessionSidebar';
import ConfirmationModal from './ConfirmationModal';
import { useChatStore } from '../store/useChatStore';
import { useSessionStore } from '../store/useSessionStore';
import { api } from '../api/client';
import { FileText, Trash2, AlertCircle, Menu, ChevronDown, ChevronUp } from 'lucide-react';

// Function to generate a meaningful 3-word title from user question
const generateThreeWordTitle = (question: string): string => {
  // Remove common question words and punctuation
  const stopWords = new Set([
    'what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'would', 'should',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'shall', 'may', 'might', 'must', 'ought', 'need', 'dare', 'used',
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'among', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
  ]);

  // Clean and split the question
  const words = question
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word)) // Filter meaningful words
    .slice(0, 5); // Take first 5 meaningful words to choose from

  // If we have at least 3 meaningful words, return the first 3
  if (words.length >= 3) {
    return words.slice(0, 3)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // If we have 2 meaningful words, add "Question" as the third word
  if (words.length === 2) {
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + ' Question';
  }
  
  // If we have only 1 meaningful word, pair it with "New Question"
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase() + words[0].slice(1) + ' New Question';
  }
  
  // Fallback to "New Chat Session" if no meaningful words found
  return 'New Chat Session';
};

export const ChatApp: React.FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start with sidebar closed
  const [documentsExpanded, setDocumentsExpanded] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  
  const {
    messages,
    mode,
    isLoading,
    error,
    activeDocuments,
    addMessage,
    updateLastMessage,
    setLoading,
    setError,
    clearMessages,
    clearError,
    addActiveDocument,
    removeActiveDocument,
    clearActiveDocuments,
  } = useChatStore();

  const {
    currentSessionId,
    updateSessionMessages,
    createSession,
    getCurrentSession,
  } = useSessionStore();

  // Load session messages when switching sessions
  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      // Load session messages only, keep current mode
      const currentMessages = useChatStore.getState().messages;
      if (JSON.stringify(currentMessages) !== JSON.stringify(session.messages)) {
        useChatStore.setState({ messages: session.messages });
      }
    } else {
      // If no current session, clear messages to show welcome interface
      const currentMessages = useChatStore.getState().messages;
      if (currentMessages.length > 0) {
        useChatStore.setState({ messages: [] });
      }
    }
  }, [currentSessionId, getCurrentSession]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageContentRef = useRef<string>('');
  const scrollTimeoutRef = useRef<number | null>(null);
  const isStreamingRef = useRef<boolean>(false);

  // Auto-save session when messages change (only for existing sessions)
  useEffect(() => {
    if (messages.length > 0) {
      const currentSession = getCurrentSession();
      // Only update existing sessions, don't create new ones here
      if (currentSession) {
        updateSessionMessages(currentSession.id, messages);
      }
    }
  }, [messages, updateSessionMessages, getCurrentSession]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]); // Only trigger on new messages, not content updates

  // Throttled scroll for streaming content updates
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.isUser && lastMessage.content !== lastMessageContentRef.current) {
        lastMessageContentRef.current = lastMessage.content;
        isStreamingRef.current = true;
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        
        // Throttle scrolling during streaming - only scroll every 200ms
        scrollTimeoutRef.current = setTimeout(() => {
          if (isStreamingRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }, 200);
      }
    }
  }, [messages]);

  // Reset streaming flag when loading stops
  useEffect(() => {
    if (!isLoading) {
      isStreamingRef.current = false;
      // Final scroll when streaming is complete
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isLoading]);

  const handleSendMessage = async (message: string) => {
    try {
      // Add user message
      addMessage(message, true);
      setLoading(true);
      clearError();

      // Add empty assistant message for streaming
      addMessage('', false, mode);
      let streamedContent = '';
      let sources: string[] = [];

      // Get active document IDs
      const activeDocumentIds = activeDocuments.map(doc => doc.id);

      // Use streaming API
      await api.ragQueryStream(
        {
          query: message,
          mode: mode,
          active_document_ids: activeDocumentIds.length > 0 ? activeDocumentIds : undefined
        },
        // onChunk callback
        (chunk) => {
          if (chunk.type === 'token') {
            streamedContent += chunk.content;
            updateLastMessage(streamedContent);
          } else if (chunk.type === 'metadata') {
            if (chunk.sources) {
              sources = chunk.sources;
            }
          }
        },
        // onError callback
        (error) => {
          console.error('Streaming error:', error);
          setError(error);
          setLoading(false);
        },
        // onComplete callback
        () => {
          // Update the final message with sources if available
          if (sources.length > 0) {
            const messages = useChatStore.getState().messages;
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && !lastMessage.isUser) {
              // Update the last message with sources
              useChatStore.setState({
                messages: [
                  ...messages.slice(0, -1),
                  { ...lastMessage, sources }
                ]
              });
            }
          }
          
          // Create new session if none exists (after AI response is complete)
          const currentSession = getCurrentSession();
          if (!currentSession) {
            const currentMessages = useChatStore.getState().messages;
            const firstUserMessage = currentMessages.find(m => m.isUser);
            const title = firstUserMessage ? 
              generateThreeWordTitle(firstUserMessage.content) :
              'New Chat Session';
            const newSessionId = createSession(title);
            // Update the new session with all messages
            updateSessionMessages(newSessionId, currentMessages);
          }
          
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      // Check if we already have 5 documents
      if (activeDocuments.length >= 5) {
        setError('Maximum 5 documents allowed. Please remove some documents before uploading new ones.');
        return;
      }

      setLoading(true);
      clearError();

      const response = await api.uploadFile(file);
      
      // Add the uploaded document to active documents automatically
      if (response.document_id) {
        const documentInfo = {
          id: response.document_id,
          filename: file.name,
          upload_timestamp: new Date().toISOString(),
          total_chunks: response.chunks_created || 0,
          document_type: file.name.split('.').pop()?.toLowerCase() || 'unknown',
          is_active: true
        };
        addActiveDocument(documentInfo);
      }
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setShowClearConfirmation(true);
  };

  const confirmClearChat = () => {
    clearMessages();
  };

  return (
    <div className="flex h-screen">
      {/* Session Sidebar */}
      <SessionSidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        mode={mode}
      />
      
      {/* Main Chat Area */}
      <div className={`
        flex flex-col flex-1 mode-transition-bg no-flash
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
            {/* Menu Button for Sidebar */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`
                p-2 rounded-lg transition-colors
                ${mode === 'pro'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }
              `}
              title="Toggle Sessions"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')}
                className={`
                  relative w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer
                  ${mode === 'pro' 
                    ? 'bg-gradient-to-br from-emerald-400 to-green-500' 
                    : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }
                  shadow-lg animate-pulse-slow hover:scale-105 transition-transform duration-200
                  ${mode === 'pro' 
                    ? 'shadow-emerald-500/50 glow-emerald' 
                    : 'shadow-purple-500/50 glow-purple'
                  }
                `}
                title="Go to Landing Page"
              >
                <div className={`
                  absolute inset-0 rounded-xl blur-sm opacity-75
                  ${mode === 'pro' 
                    ? 'bg-gradient-to-br from-emerald-400 to-green-500' 
                    : 'bg-gradient-to-br from-purple-500 to-purple-600'
                  }
                `}></div>
                <FileText className={`
                  relative z-10 w-5 h-5
                  ${mode === 'pro' ? 'text-black' : 'text-white'}
                `} />
              </button>
              <div>
                <h1 className={`
                  text-2xl font-bold
                  ${mode === 'pro' ? 'text-white' : 'text-gray-900'}
                `}>
                  DuoMind
                </h1>
                <p className={`
                  text-sm
                  ${mode === 'pro' ? 'text-gray-400' : 'text-gray-600'}
                `}>
                  Dual-Mode AI • Chat
                </p>
              </div>
            </div>
          </div>

          {/* Mode Toggle - Slightly Left of Center */}
          <div className="flex justify-center -ml-48">
            <div className={`flex rounded-xl p-1 transition-all duration-500 ${
              mode === 'pro' 
                ? 'bg-gray-800/50 backdrop-blur-sm border border-gray-700/30' 
                : 'bg-white/50 backdrop-blur-sm border border-gray-300/30'
            }`}>
              <button
                onClick={() => useChatStore.getState().setMode('normal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
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
                onClick={() => useChatStore.getState().setMode('pro')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
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

        {/* Document Upload Section - Simplified */}
        <div className="mx-4 mt-2">
          {activeDocuments.length > 0 && (
            <div className={`border-b transition-all duration-500 ${
              mode === 'pro' ? 'border-gray-700/50' : 'border-gray-200 dark:border-gray-700'
            }`}>
              <div className={`px-4 py-3 transition-all duration-500 ${
                mode === 'pro'
                  ? 'bg-gray-900/50 backdrop-blur-sm'
                  : 'bg-white dark:bg-gray-900'
              }`}>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setDocumentsExpanded(!documentsExpanded)}
                    className={`flex items-center space-x-2 text-sm font-medium transition-all duration-500 hover:opacity-80 ${
                      mode === 'pro' ? 'text-gray-300' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <FileText className={`w-4 h-4 transition-all duration-500 ${
                      mode === 'pro' ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                    }`} />
                    <span>Uploaded Documents ({activeDocuments.length}/5)</span>
                    {documentsExpanded ? (
                      <ChevronUp className={`w-4 h-4 transition-all duration-500 ${
                        mode === 'pro' ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                      }`} />
                    ) : (
                      <ChevronDown className={`w-4 h-4 transition-all duration-500 ${
                        mode === 'pro' ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                      }`} />
                    )}
                  </button>
                  <button
                    onClick={() => activeDocuments.forEach(doc => removeActiveDocument(doc.id))}
                    className={`text-xs transition-all duration-500 ${
                      mode === 'pro'
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Clear All
                  </button>
                </div>
                
                {/* Collapsible Document List */}
                {documentsExpanded && (
                  <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-300">
                    {activeDocuments.map((document) => (
                      <div
                        key={document.id}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-500 ${
                          mode === 'pro'
                            ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                        }`}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                            mode === 'pro' ? 'bg-gray-700/50' : 'bg-gray-200 dark:bg-gray-700'
                          }`}>
                            <FileText className={`w-3 h-3 transition-all duration-500 ${
                              mode === 'pro' ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate transition-all duration-500 ${
                              mode === 'pro' ? 'text-white' : 'text-gray-900 dark:text-white'
                            }`}>
                              {document.filename}
                            </p>
                            <p className={`text-xs transition-all duration-500 ${
                              mode === 'pro' ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {document.total_chunks} chunks
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeActiveDocument(document.id)}
                          className={`flex-shrink-0 p-1 rounded-full transition-all duration-500 ${
                            mode === 'pro'
                              ? 'hover:bg-gray-700/50 text-gray-400 hover:text-gray-300'
                              : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                          title={`Remove ${document.filename}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
          activeDocuments={activeDocuments}
        />
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showClearConfirmation}
        onClose={() => setShowClearConfirmation(false)}
        onConfirm={confirmClearChat}
        title="Clear Chat"
        message="Are you sure you want to clear all messages? This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        mode={mode}
      />
    </div>
  );
};