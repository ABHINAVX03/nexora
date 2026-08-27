import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Compass, Bell, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../../api/notificationApi';

export const MobileNav: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications-count-mobile'],
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

  if (!isAuthenticated) return null;

  const items = [
    { label: 'Feed', path: '/feed', icon: <Home className="w-5 h-5" /> },
    { label: 'Network', path: '/network', icon: <Users className="w-5 h-5" /> },
    { label: 'Discover', path: '/discover', icon: <Compass className="w-5 h-5" /> },
    {
      label: 'Alerts',
      path: '/notifications',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadCount,
    },
    {
      label: 'Profile',
      path: user ? `/profile/${user.id}` : '/login',
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-dark-bg/90 backdrop-blur-xl border-t border-light-border dark:border-dark-border px-3 py-2">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 font-bold'
                  : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-0.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-dark-bg">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-1">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-1 w-3 h-0.5 rounded-full bg-brand-600 dark:bg-brand-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
