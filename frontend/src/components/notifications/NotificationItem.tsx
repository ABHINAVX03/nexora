import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, Heart, MessageSquare, Check, Bell, Eye, Newspaper } from 'lucide-react';
import { NotificationDto } from '../../types';
import { Avatar } from '../ui/Avatar';
import { formatTimeAgo } from '../../utils/formatters';

export interface NotificationItemProps {
  notification: NotificationDto;
  onMarkAsRead: (id: number) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
}) => {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (notification.type) {
      case 'CONNECTION_REQUEST':
        return <UserPlus className="w-4 h-4 text-indigo-500" />;
      case 'CONNECTION_ACCEPTED':
        return <UserCheck className="w-4 h-4 text-emerald-500" />;
      case 'POST_LIKED':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'POST_COMMENTED':
        return <MessageSquare className="w-4 h-4 text-amber-500" />;
      case 'POST_CREATED':
        return <Newspaper className="w-4 h-4 text-brand-500" />;
      case 'PROFILE_VIEWED':
        return <Eye className="w-4 h-4 text-violet-500" />;
      default:
        return <Bell className="w-4 h-4 text-amber-500" />;
    }
  };

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.type === 'CONNECTION_REQUEST' || notification.type === 'CONNECTION_ACCEPTED') {
      navigate('/network');
    } else if (notification.type === 'PROFILE_VIEWED') {
      navigate('/network');
    } else {
      navigate('/feed');
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3.5 ${
        !notification.isRead
          ? 'bg-brand-50/40 dark:bg-brand-950/20 border-brand-200/70 dark:border-brand-900/40 shadow-sm'
          : 'bg-white dark:bg-dark-card border-light-border dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-elevated'
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="relative">
          <Avatar name="Nexora Notification" size="md" />
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-dark-card ring-2 ring-white dark:ring-dark-card shadow-xs">
            {getIcon()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-light-text dark:text-dark-text leading-relaxed font-medium">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-light-muted dark:text-dark-muted font-medium">
              {formatTimeAgo(notification.createdAt)}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-dark-elevated text-light-muted dark:text-dark-muted font-mono">
              {notification.type}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {!notification.isRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            title="Mark as read"
            className="p-1.5 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-100/60 dark:hover:bg-brand-900/40 transition-colors"
          >
            <Check className="w-4 h-4" />
          </button>
        )}
        {!notification.isRead && (
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-subtle" />
        )}
      </div>
    </div>
  );
};
