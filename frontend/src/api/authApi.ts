import { apiClient } from './client';
import {
  SignUpRequest,
  LoginRequest,
  LoginResponse,
  UserDto,
  VerifyOtpRequest,
  ResendOtpRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '../types';

export const authApi = {
  signup: async (data: SignUpRequest): Promise<UserDto> => {
    const response = await apiClient.post<UserDto>('/auth/signup', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse | string>('/auth/login', data);
    if (typeof response.data === 'string') {
      return {
        accessToken: response.data,
        refreshToken: '',
      };
    }
    return response.data;
  },

  verifyEmail: async (data: VerifyOtpRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse | string>('/auth/verify-email', data);
    if (typeof response.data === 'string') {
      return {
        accessToken: response.data,
        refreshToken: '',
      };
    }
    return response.data;
  },

  resendVerificationOtp: async (data: ResendOtpRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/resend-verification-otp', data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/auth/reset-password', data);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<string> => {
    const response = await apiClient.post<string>('/auth/refresh', { refreshToken });
    return response.data;
  },
};
