import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Base API URL points to the Spring Cloud Gateway (/api/v1)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor: inject verified JWT Bearer Token & ensure correct multipart headers for FormData
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('nexora_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // If payload is FormData, remove Content-Type so the browser dynamically injects multipart/form-data with boundary
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
      }
    } else if (config.headers && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized token refresh & single active session eviction
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

    // If 401 Unauthorized
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const errorData = error.response?.data as any;
      const errorMsg =
        typeof errorData === 'string'
          ? errorData
          : errorData?.message || errorData?.error || '';

      // If error indicates single session invalidation (account logged in elsewhere)
      if (
        errorMsg.toLowerCase().includes('another browser or device') ||
        errorMsg.toLowerCase().includes('session expired')
      ) {
        localStorage.removeItem('nexora_token');
        localStorage.removeItem('nexora_refresh_token');
        localStorage.removeItem('nexora_user');
        sessionStorage.setItem(
          'nexora_session_expired',
          'You were signed out because your account was logged in from another browser or device.'
        );
        window.dispatchEvent(
          new CustomEvent('nexora:session-expired', {
            detail: {
              reason: 'Your account was logged in from another browser or device.',
            },
          })
        );
        return Promise.reject(error);
      }

      // Bypass refresh loop on auth endpoints
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
        const refreshData = refreshErr?.response?.data as any;
        const refreshMsg =
          typeof refreshData === 'string'
            ? refreshData
            : refreshData?.message || refreshData?.error || '';

        localStorage.removeItem('nexora_token');
        localStorage.removeItem('nexora_refresh_token');
        localStorage.removeItem('nexora_user');

        if (
          refreshMsg.toLowerCase().includes('another browser or device') ||
          refreshMsg.toLowerCase().includes('session expired')
        ) {
          sessionStorage.setItem(
            'nexora_session_expired',
            'You were signed out because your account was logged in from another browser or device.'
          );
        }

        window.dispatchEvent(
          new CustomEvent('nexora:session-expired', {
            detail: {
              reason: refreshMsg || 'Your account was logged in from another browser or device.',
            },
          })
        );
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
