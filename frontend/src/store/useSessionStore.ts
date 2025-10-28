import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, SessionState, ChatMode, Message } from '../types';

interface SessionActions {
  createSession: (title?: string) => string;
  deleteSession: (sessionId: string) => void;
  renameSession: (sessionId: string, newTitle: string) => void;
  switchToSession: (sessionId: string) => void;
  updateSessionMessages: (sessionId: string, messages: Message[]) => void;
  getCurrentSession: () => Session | null;
  exportSessionToMarkdown: (sessionId: string) => string;
  exportSessionToPDF: (sessionId: string) => void;
  clearAllSessions: () => void;
}

type SessionStore = SessionState & SessionActions;

const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const generateSessionTitle = (messages: Message[]): string => {
  if (messages.length === 0) return 'New Chat';
  
  const firstUserMessage = messages.find(msg => msg.isUser);
  if (firstUserMessage) {
    const title = firstUserMessage.content.slice(0, 50);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  }
  
  return 'New Chat';
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      sessions: [],
      currentSessionId: null,
      isLoading: false,

      // Actions
      createSession: (title?: string) => {
        const sessionId = generateSessionId();
        const now = new Date();
        
        const newSession: Session = {
          id: sessionId,
          title: title || 'New Chat',
          messages: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: sessionId,
        }));

        return sessionId;
      },

      deleteSession: (sessionId: string) => {
        set((state) => {
          const updatedSessions = state.sessions.filter(s => s.id !== sessionId);
          const newCurrentSessionId = state.currentSessionId === sessionId 
            ? (updatedSessions.length > 0 ? updatedSessions[0].id : null)
            : state.currentSessionId;

          return {
            sessions: updatedSessions,
            currentSessionId: newCurrentSessionId,
          };
        });
      },

      renameSession: (sessionId: string, newTitle: string) => {
        set((state) => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { ...session, title: newTitle, updatedAt: new Date() }
              : session
          ),
        }));
      },

      switchToSession: (sessionId: string) => {
        set({ currentSessionId: sessionId });
      },

      updateSessionMessages: (sessionId: string, messages: Message[]) => {
        set((state) => ({
          sessions: state.sessions.map(session =>
            session.id === sessionId
              ? { 
                  ...session, 
                  messages, 
                  updatedAt: new Date(),
                  title: session.title === 'New Chat' ? generateSessionTitle(messages) : session.title
                }
              : session
          ),
        }));
      },

      getCurrentSession: () => {
        const state = get();
        return state.sessions.find(s => s.id === state.currentSessionId) || null;
      },

      exportSessionToMarkdown: (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) return '';

        let markdown = `# ${session.title}\n\n`;
        markdown += `**Created:** ${session.createdAt.toLocaleString()}\n`;
        markdown += `**Updated:** ${session.updatedAt.toLocaleString()}\n\n`;
        markdown += '---\n\n';

        session.messages.forEach((message, index) => {
          const role = message.isUser ? '**You**' : '**AI**';
          markdown += `## ${role}\n\n${message.content}\n\n`;
          
          if (message.sources && message.sources.length > 0) {
            markdown += '**Sources:**\n';
            message.sources.forEach(source => {
              markdown += `- ${source}\n`;
            });
            markdown += '\n';
          }
        });

        return markdown;
      },

      exportSessionToPDF: (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) return;

        // Create a new window for PDF generation
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${session.title}</title>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                color: #333;
              }
              .header {
                border-bottom: 2px solid #eee;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .title { 
                font-size: 28px; 
                font-weight: bold; 
                margin-bottom: 10px;
                color: #2563eb;
              }
              .meta { 
                color: #666; 
                font-size: 14px;
                margin: 5px 0;
              }
              .message {
                margin: 20px 0;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid;
              }
              .user-message {
                background: #f8fafc;
                border-left-color: #3b82f6;
              }
              .ai-message {
                background: #f0fdf4;
                border-left-color: #10b981;
              }
              .role {
                font-weight: bold;
                margin-bottom: 8px;
                font-size: 16px;
              }
              .user-role { color: #3b82f6; }
              .ai-role { color: #10b981; }
              .content {
                white-space: pre-wrap;
                word-wrap: break-word;
              }
              .sources {
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #6b7280;
              }
              .sources ul {
                margin: 5px 0;
                padding-left: 20px;
              }
              @media print {
                body { margin: 0; padding: 15px; }
                .message { break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${session.title}</div>
              <div class="meta">Created: ${session.createdAt.toLocaleString()}</div>
              <div class="meta">Updated: ${session.updatedAt.toLocaleString()}</div>
            </div>
            ${session.messages.map(message => `
              <div class="message ${message.isUser ? 'user-message' : 'ai-message'}">
                <div class="role ${message.isUser ? 'user-role' : 'ai-role'}">
                  ${message.isUser ? 'You' : 'AI'}
                </div>
                <div class="content">${message.content}</div>
                ${message.sources && message.sources.length > 0 ? `
                  <div class="sources">
                    <strong>Sources:</strong>
                    <ul>
                      ${message.sources.map(source => `<li>${source}</li>`).join('')}
                    </ul>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </body>
          </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load, then print
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      },

      clearAllSessions: () => {
        set({
          sessions: [],
          currentSessionId: null,
        });
      },
    }),
    {
      name: 'duomind-sessions-storage',
      partialize: (state) => ({
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
      }),
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          
          const parsed = JSON.parse(str);
          // Convert date strings back to Date objects
          if (parsed.state?.sessions) {
            parsed.state.sessions = parsed.state.sessions.map((session: any) => ({
              ...session,
              createdAt: session.createdAt ? new Date(session.createdAt) : new Date(),
              updatedAt: session.updatedAt ? new Date(session.updatedAt) : new Date(),
              messages: session.messages.map((msg: any) => ({
                ...msg,
                timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
              }))
            }));
          }
          return parsed;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);