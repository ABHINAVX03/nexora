import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { chatApi } from '../api/chatApi';
import { useQuery } from '@tanstack/react-query';

interface ChatContextType {
  isOpen: boolean;
  isMinimized: boolean;
  activePartnerId: number | null;
  unreadCount: number;
  openChatWith: (userId: number) => void;
  closeChat: () => void;
  toggleMinimize: () => void;
  selectPartner: (userId: number | null) => void;
  refetchUnread: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activePartnerId, setActivePartnerId] = useState<number | null>(null);

  // Periodic Heartbeat to maintain "isActive: true" / online presence
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    // Immediate heartbeat on mount
    chatApi.sendHeartbeat().catch(() => {});

    // Periodic heartbeat every 25 seconds
    const interval = setInterval(() => {
      chatApi.sendHeartbeat().catch(() => {});
    }, 25000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id]);

  // Poll for unread message counts across conversations
  const { data: unreadCount = 0, refetch: refetchUnread } = useQuery({
    queryKey: ['chat-unread-count', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !user?.id) return 0;
      try {
        return await chatApi.getUnreadCount();
      } catch {
        return 0;
      }
    },
    enabled: isAuthenticated && !!user?.id,
    refetchInterval: 4000,
  });

  const openChatWith = useCallback((userId: number) => {
    setActivePartnerId(userId);
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setActivePartnerId(null);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const selectPartner = useCallback((userId: number | null) => {
    setActivePartnerId(userId);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        isMinimized,
        activePartnerId,
        unreadCount,
        openChatWith,
        closeChat,
        toggleMinimize,
        selectPartner,
        refetchUnread,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
