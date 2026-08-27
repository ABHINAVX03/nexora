import { apiClient } from './client';
import {
  ChatMessageDto,
  ConversationSummaryDto,
  SendMessageRequest,
  UserPresenceDto,
} from '../types';

export const chatApi = {
  sendMessage: async (recipientId: number, content: string): Promise<ChatMessageDto> => {
    const response = await apiClient.post<ChatMessageDto>('/chat/send', {
      recipientId,
      content,
    } as SendMessageRequest);
    return response.data;
  },

  getHistory: async (otherUserId: number): Promise<ChatMessageDto[]> => {
    const response = await apiClient.get<ChatMessageDto[]>(`/chat/history/${otherUserId}`);
    return response.data;
  },

  getConversations: async (): Promise<ConversationSummaryDto[]> => {
    const response = await apiClient.get<ConversationSummaryDto[]>('/chat/conversations');
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ unreadCount: number }>('/chat/unread-count');
    return response.data.unreadCount;
  },

  markAsRead: async (otherUserId: number): Promise<void> => {
    await apiClient.patch(`/chat/read/${otherUserId}`);
  },

  sendHeartbeat: async (): Promise<UserPresenceDto> => {
    const response = await apiClient.post<UserPresenceDto>('/chat/presence/heartbeat');
    return response.data;
  },

  getUserPresence: async (userId: number): Promise<UserPresenceDto> => {
    const response = await apiClient.get<UserPresenceDto>(`/chat/presence/${userId}`);
    return response.data;
  },

  getBatchPresence: async (userIds: number[]): Promise<UserPresenceDto[]> => {
    const response = await apiClient.post<UserPresenceDto[]>('/chat/presence/batch', {
      userIds,
    });
    return response.data;
  },
};
