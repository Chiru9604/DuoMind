import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModeToggle } from './ModeToggle';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { SessionSidebar } from './SessionSidebar';
import { useChatStore } from '../store/useChatStore';
import { useSessionStore } from '../store/useSessionStore';
import { api } from '../api/client';
import { FileText, Trash2, AlertCircle, Menu } from 'lucide-react';

export const ChatApp: React.FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Start with sidebar closed
  
  const {
    messages,
    mode,
    isLoading,
    error,
    addMessage,
    updateLastMessage,
    setLoading,
    setError,
    clearMessages,
    clearError,
  } = useChatStore();

  const {
    currentSessionId,
    updateSessionMessages,
    createSession,
    switchToSession,
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

  // Auto-save session when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const currentSession = getCurrentSession();
      // Create new session if none exists
      if (!currentSession) {
        const firstUserMessage = messages.find(m => m.isUser);
        const title = firstUserMessage ? 
          firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '') :
          'New Chat';
        createSession(title);
      } else {
        // Update existing session
        updateSessionMessages(currentSession.id, messages);
      }
    }
  }, [messages, createSession, updateSessionMessages, getCurrentSession]);

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

      // Use streaming API
      await api.ragQueryStream(
        {
          query: message,
          mode: mode,
        },
        // onChunk callback
        (chunk) => {
          if (chunk.type === 'token') {
            streamedContent += chunk.content;
            updateLastMessage(streamedContent);
          } else if (chunk.type === 'metadata' && chunk.sources) {
            sources = chunk.sources;
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
    <div className="flex h-screen">
      {/* Session Sidebar */}
      <SessionSidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        mode={mode}
      />
      
      {/* Main Chat Area */}
      <div className={`
        flex flex-col flex-1 transition-all duration-500
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
    </div>
  );
};