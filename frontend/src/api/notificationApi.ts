import { apiClient } from './client';
import { NotificationDto } from '../types';

export const notificationApi = {
  getNotifications: async (): Promise<NotificationDto[]> => {
    const response = await apiClient.get<NotificationDto[]>('/notifications');
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
    return response.data.unreadCount;
  },

  markAsRead: async (notificationId: number): Promise<NotificationDto> => {
    const response = await apiClient.patch<NotificationDto>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await apiClient.patch<{ message: string }>('/notifications/read-all');
    return response.data;
  },
};
