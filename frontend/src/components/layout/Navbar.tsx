import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  Compass,
  Bell,
  MessageSquare,
  Search,
  Moon,
  Sun,
  Settings,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../ui/Avatar';
import { Dropdown } from '../ui/Dropdown';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../../api/notificationApi';

interface NavbarProps {
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { unreadCount: chatUnreadCount, openChatWith } = useChat();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch real unread notification count with polling
  const { data: unreadNotificationsCount = 0 } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: async () => {
      if (!isAuthenticated) return 0;
      try {
        return await notificationApi.getUnreadCount();
      } catch {
        return 0;
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 6000,
  });

  const navLinks = [
    { label: 'Home', path: '/feed', icon: <Home className="w-5 h-5" /> },
    { label: 'Network', path: '/network', icon: <Users className="w-5 h-5" /> },
    { label: 'Discover', path: '/discover', icon: <Compass className="w-5 h-5" /> },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-light-border/80 dark:border-dark-border/80 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6">
          <Link to={isAuthenticated ? '/feed' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-500 p-0.5 shadow-glow flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-dark-bg/20 rounded-[10px] flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 19V5l12 14V5" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-light-text dark:text-dark-text leading-none flex items-center gap-1">
                Nexora
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-subtle" />
              </span>
              <span className="text-[10px] text-light-muted dark:text-dark-muted font-medium tracking-wide uppercase">
                Network
              </span>
            </div>
          </Link>

          {/* Quick Search Bar trigger */}
          {isAuthenticated && (
            <button
              onClick={onOpenSearch}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 text-xs text-light-muted dark:text-dark-muted bg-slate-100/80 dark:bg-dark-elevated hover:bg-slate-200/70 dark:hover:bg-dark-hover border border-light-border/60 dark:border-dark-border/60 rounded-xl transition-all w-48 lg:w-64"
            >
              <Search className="w-3.5 h-3.5 text-light-muted dark:text-dark-muted" />
              <span className="flex-1 text-left">Search members...</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded text-light-muted dark:text-dark-muted shadow-xs">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        {/* Center / Navigation Links (Desktop) */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 bg-brand-50/80 dark:bg-brand-950/40'
                      : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-elevated'
                  }`}
                >
                  <div className="relative">
                    {link.icon}
                    {link.badge && link.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-dark-bg animate-scale-in">
                        {link.badge > 9 ? '9+' : link.badge}
                      </span>
                    )}
                  </div>
                  <span className="hidden lg:inline">{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-brand-600 dark:bg-brand-400" />
                  )}
                </Link>
              );
            })}

            {/* Messaging Quick Trigger */}
            <button
              onClick={() => openChatWith(0)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-elevated transition-all"
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
                {chatUnreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-dark-bg animate-scale-in">
                    {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline">Messaging</span>
            </button>
          </nav>
        )}

        {/* Right: Actions, Theme, Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search trigger */}
          {isAuthenticated && (
            <button
              onClick={onOpenSearch}
              className="md:hidden p-2 rounded-xl text-light-muted dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-elevated"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-light-muted hover:text-light-text dark:text-dark-muted dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* User Profile / Auth State */}
          {isAuthenticated && user ? (
            <Dropdown
              trigger={
                <div className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors cursor-pointer">
                  <Avatar src={user.avatarUrl} name={user.name} size="sm" isOnline={true} />
                </div>
              }
              items={[
                {
                  label: (
                    <div className="py-1">
                      <p className="font-semibold text-light-text dark:text-dark-text truncate">{user.name}</p>
                      <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">{user.email}</p>
                    </div>
                  ),
                  onClick: () => navigate(`/profile/${user.id}`),
                },
                {
                  label: 'View Profile',
                  icon: <UserIcon className="w-4 h-4" />,
                  onClick: () => navigate(`/profile/${user.id}`),
                  divider: true,
                },
                {
                  label: 'Settings',
                  icon: <Settings className="w-4 h-4" />,
                  onClick: () => navigate('/settings'),
                },
                {
                  label: 'Sign Out',
                  icon: <LogOut className="w-4 h-4" />,
                  variant: 'danger',
                  divider: true,
                  onClick: () => {
                    logout();
                    navigate('/login');
                  },
                },
              ]}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-light-muted hover:text-light-text dark:text-dark-muted dark:hover:text-dark-text transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
