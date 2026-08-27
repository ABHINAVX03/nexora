import { apiClient } from './client';
import { SignUpRequest, LoginRequest, LoginResponse, UserDto } from '../types';

export const authApi = {
  signup: async (data: SignUpRequest): Promise<UserDto> => {
    const response = await apiClient.post<UserDto>('/auth/signup', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse | string>('/auth/login', data);
    // Handle both object { accessToken, refreshToken } and raw string
    if (typeof response.data === 'string') {
      return {
        accessToken: response.data,
        refreshToken: '',
      };
    }
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<string> => {
    const response = await apiClient.post<string>('/auth/refresh', { refreshToken });
    return response.data;
  },
};
