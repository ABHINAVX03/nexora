import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/ResetPasswordPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { FeedPage } from '../pages/FeedPage';
import { NetworkPage } from '../pages/NetworkPage';
import { DiscoverPage } from '../pages/DiscoverPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { ProfilePage } from '../pages/ProfilePage';
import { PostDetailPage } from '../pages/PostDetailPage';
import { SavedPostsPage } from '../pages/SavedPostsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { useAuth } from '../context/AuthContext';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Only Route (for login/register when already signed in)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  // Landing Page
  {
    path: '/',
    element: (
      <PublicOnlyRoute>
        <LandingPage />
      </PublicOnlyRoute>
    ),
  },

  // Auth Pages
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/verify-email',
    element: (
      <PublicOnlyRoute>
        <VerifyEmailPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicOnlyRoute>
        <ForgotPasswordPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <PublicOnlyRoute>
        <ResetPasswordPage />
      </PublicOnlyRoute>
    ),
  },

  // Onboarding Page
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },

  // Authenticated Main App Shell Pages
  {
    element: (
      <ProtectedRoute>
        <AppShell showSidebars={true} />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/feed',
        element: <FeedPage />,
      },
      {
        path: '/home',
        element: <Navigate to="/feed" replace />,
      },
      {
        path: '/network',
        element: <NetworkPage />,
      },
      {
        path: '/discover',
        element: <DiscoverPage />,
      },
      {
        path: '/saved',
        element: <SavedPostsPage />,
      },
      {
        path: '/notifications',
        element: <NotificationsPage />,
      },
      {
        path: '/profile/:id',
        element: <ProfilePage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/post/:id',
        element: <PostDetailPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
    ],
  },

  // 404 Catch-All
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
