import { apiClient } from './client';
import { Person } from '../types';

export const connectionApi = {
  getMyFirstConnections: async (): Promise<Person[]> => {
    const response = await apiClient.get<Person[]>('/connections/first-degree');
    return response.data;
  },

  getUserFirstConnections: async (userId: number): Promise<Person[]> => {
    const response = await apiClient.get<Person[]>(`/connections/${userId}/first-degree`);
    return response.data;
  },

  areConnected: async (userId: number): Promise<boolean> => {
    const response = await apiClient.get<boolean>(`/connections/check/${userId}`);
    return response.data;
  },

  getPendingRequests: async (): Promise<Person[]> => {
    const response = await apiClient.get<Person[]>('/connections/requests');
    return response.data;
  },

  sendConnectionRequest: async (receiverId: number): Promise<void> => {
    await apiClient.post(`/connections/request/${receiverId}`);
  },

  acceptConnectionRequest: async (senderId: number): Promise<void> => {
    await apiClient.post(`/connections/accept/${senderId}`);
  },

  rejectConnectionRequest: async (senderId: number): Promise<void> => {
    await apiClient.post(`/connections/reject/${senderId}`);
  },
};
