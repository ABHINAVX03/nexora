import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, SignUpRequest, LoginRequest } from '../types';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (data: SignUpRequest) => Promise<void>;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to decode JWT payload
function parseJwtPayload(token: string): { sub?: string; id?: string; exp?: number } | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nexora_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nexora_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize auth state and restore verified session from backend in the background
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('nexora_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      const payload = parseJwtPayload(storedToken);
      const userId = payload?.sub ? parseInt(payload.sub, 10) : null;

      if (userId) {
        try {
          const profile = await userApi.getUserById(userId);
          const loadedUser: User = {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            headline: profile.headline || 'Member @ Nexora',
            bio: profile.bio || '',
            location: profile.location || '',
            avatarUrl: profile.avatarUrl,
          };
          setUser(loadedUser);
          localStorage.setItem('nexora_user', JSON.stringify(loadedUser));
        } catch (err) {
          // If offline or network glitch, retain existing cached user without forcing logout
          console.warn('Background profile sync skipped, keeping persistent local session:', err);
        }
      }
      setIsLoading(false);
    };

    initAuth();

    const handleExpiry = () => {
      logout();
    };
    window.addEventListener('nexora:session-expired', handleExpiry);
    return () => window.removeEventListener('nexora:session-expired', handleExpiry);
  }, []);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const loginRes = await authApi.login(credentials);
      const jwtToken = loginRes.accessToken;
      const refreshToken = loginRes.refreshToken;

      setToken(jwtToken);
      localStorage.setItem('nexora_token', jwtToken);
      if (refreshToken) {
        localStorage.setItem('nexora_refresh_token', refreshToken);
      }

      const payload = parseJwtPayload(jwtToken);
      const userId = payload?.sub ? parseInt(payload.sub, 10) : 1;

      try {
        const backendUser = await userApi.getUserById(userId);
        const userProfile: User = {
          id: backendUser.id,
          name: backendUser.name,
          email: backendUser.email,
          headline: backendUser.headline || 'Member @ Nexora',
          bio: backendUser.bio || '',
          location: backendUser.location || '',
          avatarUrl: backendUser.avatarUrl,
        };

        setUser(userProfile);
        localStorage.setItem('nexora_user', JSON.stringify(userProfile));
      } catch {
        const fallbackUser: User = {
          id: userId,
          name: credentials.email.split('@')[0] || `User #${userId}`,
          email: credentials.email,
          headline: 'Member @ Nexora',
        };
        setUser(fallbackUser);
        localStorage.setItem('nexora_user', JSON.stringify(fallbackUser));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignUpRequest) => {
    setIsLoading(true);
    try {
      const userDto = await authApi.signup(data);
      // Auto login after signup if password provided
      if (data.password) {
        const loginRes = await authApi.login({ email: data.email, password: data.password });
        setToken(loginRes.accessToken);
        localStorage.setItem('nexora_token', loginRes.accessToken);
        if (loginRes.refreshToken) {
          localStorage.setItem('nexora_refresh_token', loginRes.refreshToken);
        }
      }

      const newUser: User = {
        id: userDto.id,
        name: userDto.name,
        email: userDto.email,
        headline: userDto.headline || 'Member @ Nexora',
        bio: userDto.bio || '',
        location: userDto.location || '',
        avatarUrl: userDto.avatarUrl,
      };

      setUser(newUser);
      localStorage.setItem('nexora_user', JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('nexora_token');
    localStorage.removeItem('nexora_refresh_token');
    localStorage.removeItem('nexora_user');
  }, []);

  const updateCurrentUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('nexora_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshUserProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const updated = await userApi.getUserById(user.id);
      const refreshedUser: User = {
        ...user,
        name: updated.name,
        email: updated.email,
        headline: updated.headline || 'Member @ Nexora',
        bio: updated.bio || '',
        location: updated.location || '',
        avatarUrl: updated.avatarUrl,
      };
      setUser(refreshedUser);
      localStorage.setItem('nexora_user', JSON.stringify(refreshedUser));
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        logout,
        updateCurrentUser,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
