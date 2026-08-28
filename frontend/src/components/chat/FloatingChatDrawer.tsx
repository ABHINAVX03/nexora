import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { chatApi } from '../../api/chatApi';
import { userApi } from '../../api/userApi';
import { connectionApi } from '../../api/connectionApi';
import { formatTimeAgo } from '../../utils/formatters';
import { ChatMessageDto, ConversationSummaryDto, Person, UserDto, UserPresenceDto } from '../../types';

const ConversationRow: React.FC<{
  conv: ConversationSummaryDto;
  onSelect: (partnerId: number) => void;
}> = ({ conv, onSelect }) => {
  const { data: partner } = useQuery<UserDto>({
    queryKey: ['chat-partner-user', conv.otherUserId],
    queryFn: async () => {
      try {
        return await userApi.getUserById(conv.otherUserId);
      } catch {
        return { id: conv.otherUserId, name: 'Nexora Member', email: '' };
      }
    },
    staleTime: 60000,
  });

  const partnerName = partner?.name || 'Nexora Member';

  return (
    <div
      onClick={() => onSelect(conv.otherUserId)}
      className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-dark-card hover:bg-brand-50/50 dark:hover:bg-brand-950/30 border border-light-border/60 dark:border-dark-border/60 cursor-pointer transition-all"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Avatar
          name={partnerName}
          src={partner?.avatarUrl}
          size="sm"
          isOnline={conv.isPartnerActive}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-light-text dark:text-dark-text truncate">
              {partnerName}
            </p>
            {conv.isPartnerActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </div>
          <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">
            {conv.lastMessage}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[9px] text-light-muted dark:text-dark-muted">
          {formatTimeAgo(conv.lastMessageTime)}
        </span>
        {conv.unreadCount > 0 && (
          <span className="min-w-4 h-4 px-1 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center">
            {conv.unreadCount}
          </span>
        )}
      </div>
    </div>
  );
};

export const FloatingChatDrawer: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    isOpen,
    isMinimized,
    activePartnerId,
    unreadCount,
    openChatWith,
    closeChat,
    toggleMinimize,
    selectPartner,
    refetchUnread,
  } = useChat();

  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');

  // 1. Fetch conversations list
  const { data: conversations = [], refetch: refetchConversations } = useQuery<ConversationSummaryDto[]>({
    queryKey: ['chat-conversations', user?.id],
    queryFn: async () => {
      if (!isAuthenticated || !user?.id) return [];
      try {
        return await chatApi.getConversations();
      } catch {
        return [];
      }
    },
    enabled: isAuthenticated && !!user?.id && isOpen && !isMinimized,
    refetchInterval: 4000,
  });

  // 2. Fetch 1st-degree connections
  const { data: connections = [] } = useQuery<Person[]>({
    queryKey: ['my-first-degree-connections'],
    queryFn: async () => {
      return await connectionApi.getMyFirstConnections();
    },
    enabled: isAuthenticated && isOpen && !isMinimized && !activePartnerId,
    staleTime: 10000,
  });

  // 3. Fetch active conversation messages
  const { data: messages = [], refetch: refetchHistory } = useQuery<ChatMessageDto[]>({
    queryKey: ['chat-history', activePartnerId],
    queryFn: async () => {
      if (!activePartnerId) return [];
      return await chatApi.getHistory(activePartnerId);
    },
    enabled: isAuthenticated && !!activePartnerId && isOpen && !isMinimized,
    refetchInterval: 3000,
  });

  // 4. Fetch partner profile info
  const { data: partnerUser } = useQuery<UserDto>({
    queryKey: ['user-info', activePartnerId],
    queryFn: async () => {
      if (!activePartnerId) return null as any;
      return await userApi.getUserById(activePartnerId);
    },
    enabled: !!activePartnerId,
    staleTime: 60000,
  });

  // 5. Fetch partner online presence (active or not)
  const { data: partnerPresence } = useQuery<UserPresenceDto>({
    queryKey: ['user-presence', activePartnerId],
    queryFn: async () => {
      if (!activePartnerId) return { userId: 0, isActive: false };
      return await chatApi.getUserPresence(activePartnerId);
    },
    enabled: !!activePartnerId && isOpen && !isMinimized,
    refetchInterval: 6000,
  });

  // Mark conversation as read on open
  useEffect(() => {
    if (activePartnerId && isOpen && !isMinimized) {
      chatApi.markAsRead(activePartnerId).then(() => {
        refetchUnread();
        refetchConversations();
      });
    }
  }, [activePartnerId, isOpen, isMinimized]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send Message mutation
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      if (!activePartnerId) return;
      return await chatApi.sendMessage(activePartnerId, text);
    },
    onSuccess: (newMsg) => {
      setInputText('');
      if (newMsg && activePartnerId) {
        queryClient.setQueryData<ChatMessageDto[]>(['chat-history', activePartnerId], (prev) => [
          ...(prev || []),
          newMsg,
        ]);
      }
      refetchHistory();
      refetchConversations();
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sendMutation.isPending) return;
    sendMutation.mutate(inputText.trim());
  };

  if (!isAuthenticated || !user) return null;

  const partnerName = partnerUser?.name || 'Nexora Member';
  const isPartnerActive = partnerPresence?.isActive ?? false;

  // If completely closed, show only a floating trigger button
  if (!isOpen) {
    return (
      <button
        onClick={() => openChatWith(activePartnerId || 0)}
        className="fixed bottom-4 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow transition-transform hover:scale-105"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-xs font-bold">Messaging</span>
        {unreadCount > 0 && (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-dark-bg">
            {unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-4 sm:right-6 z-50 w-80 sm:w-96 rounded-t-2xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-2xl overflow-hidden flex flex-col transition-all duration-200">
      {/* Header Bar */}
      <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {activePartnerId ? (
            <button
              onClick={() => selectPartner(null)}
              className="p-1 -ml-1 text-slate-300 hover:text-white rounded-lg transition-colors"
              title="Back to conversations"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <MessageSquare className="w-4 h-4 text-brand-400" />
          )}

          {activePartnerId ? (
            <div className="flex items-center gap-2 min-w-0">
              <Avatar name={partnerName} size="xs" isOnline={isPartnerActive} />
              <div className="min-w-0">
                <p className="text-xs font-bold truncate text-white">{partnerName}</p>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isPartnerActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  <p className="text-[10px] text-slate-400 truncate">
                    {isPartnerActive ? 'Active now' : 'Offline'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight">Messaging</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleMinimize}
            className="p-1 text-slate-300 hover:text-white rounded-lg transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={closeChat}
            className="p-1 text-slate-300 hover:text-white rounded-lg transition-colors"
            title="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Drawer Body (when not minimized) */}
      {!isMinimized && (
        <div className="h-96 flex flex-col bg-slate-50 dark:bg-dark-bg/40">
          {activePartnerId ? (
            /* VIEW 1: ACTIVE CHAT THREAD */
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Message History Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-brand-600 text-white rounded-br-xs shadow-xs'
                              : 'bg-white dark:bg-dark-card text-light-text dark:text-dark-text border border-light-border/60 dark:border-dark-border/60 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>
                        <span className="text-[9px] text-light-muted dark:text-dark-muted px-1 mt-0.5">
                          {formatTimeAgo(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-light-muted dark:text-dark-muted space-y-1">
                    <p className="text-xs font-semibold">Start of your conversation</p>
                    <p className="text-[11px]">Send a friendly message to break the ice.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSend} className="p-2.5 bg-white dark:bg-dark-card border-t border-light-border/60 dark:border-dark-border/60 flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Write a message..."
                  autoFocus
                  className="flex-1 h-9 px-3 text-xs rounded-xl bg-slate-50 dark:bg-dark-elevated border border-light-border/60 dark:border-dark-border/60 text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sendMutation.isPending}
                  className="p-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 transition-all shadow-xs"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          ) : (
            /* VIEW 2: CONVERSATIONS & 1ST-DEGREE CONNECTIONS */
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Active Conversations */}
              {conversations.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted px-1">
                    Recent Messages
                  </p>
                  {conversations.map((conv) => (
                    <ConversationRow
                      key={conv.otherUserId}
                      conv={conv}
                      onSelect={selectPartner}
                    />
                  ))}
                </div>
              )}

              {/* 1st-Degree Connections to Message */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted px-1 flex items-center gap-1">
                  <Users className="w-3 h-3 text-brand-500" />
                  1st-Degree Network ({connections.length})
                </p>

                {connections.length > 0 ? (
                  connections.map((conn) => (
                    <div
                      key={conn.userId}
                      onClick={() => selectPartner(conn.userId)}
                      className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-dark-card hover:bg-slate-100 dark:hover:bg-dark-elevated border border-light-border/40 dark:border-dark-border/40 cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={conn.name || conn.username || 'Nexora Member'} size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-light-text dark:text-dark-text truncate">
                            {conn.name || conn.username || 'Nexora Member'}
                          </p>
                          <p className="text-[10px] text-light-muted dark:text-dark-muted truncate">
                            Connected
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectPartner(conn.userId);
                        }}
                        className="text-[10px] px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-300 font-semibold"
                      >
                        Chat
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-light-muted dark:text-dark-muted p-2 italic">
                    Connect with members to start messaging.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
