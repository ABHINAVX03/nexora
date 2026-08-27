import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base API URL points to the Spring Cloud Gateway (/api/v1)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: inject verified JWT Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('nexora_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized token refresh & session cleanup
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/signup') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('nexora_refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        // Do not immediately wipe if user has token and is in-memory
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<string>(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newToken = typeof data === 'string' ? data : (data as { token?: string }).token || '';
        if (newToken) {
          localStorage.setItem('nexora_token', newToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          processQueue(null, newToken);
          return apiClient(originalRequest);
        } else {
          throw new Error('Empty refresh token response');
        }
      } catch (refreshErr: any) {
        processQueue(refreshErr, null);
        // Only expire session if server explicitly returned 401/403 on refresh
        if (refreshErr?.response?.status === 401 || refreshErr?.response?.status === 403) {
          localStorage.removeItem('nexora_token');
          localStorage.removeItem('nexora_refresh_token');
          localStorage.removeItem('nexora_user');
          window.dispatchEvent(new CustomEvent('nexora:session-expired'));
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
