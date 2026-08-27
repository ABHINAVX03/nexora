import { apiClient } from './client';
import { UserDto, UserProfileUpdateRequest } from '../types';

export const userApi = {
  getUserById: async (userId: number): Promise<UserDto> => {
    const response = await apiClient.get<UserDto>(`/users/${userId}`);
    return response.data;
  },

  updateUserProfile: async (
    userId: number,
    data: UserProfileUpdateRequest
  ): Promise<UserDto> => {
    const response = await apiClient.put<UserDto>(`/users/${userId}`, data);
    return response.data;
  },

  uploadAvatar: async (userId: number, file: File): Promise<UserDto> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<UserDto>(`/users/${userId}/avatar/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  searchUsers: async (query?: string): Promise<UserDto[]> => {
    const params = query && query.trim() ? { query: query.trim() } : {};
    const response = await apiClient.get<UserDto[]>('/users', { params });
    return response.data;
  },
};
