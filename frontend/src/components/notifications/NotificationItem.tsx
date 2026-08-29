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

    if (notification.type === 'POST_LIKED' || notification.type === 'POST_COMMENTED' || notification.type === 'POST_CREATED') {
      if (notification.relatedEntityId) {
        navigate(`/posts/${notification.relatedEntityId}`);
      } else {
        navigate('/feed');
      }
    } else if (notification.type === 'CONNECTION_REQUEST' || notification.type === 'CONNECTION_ACCEPTED') {
      navigate('/network');
    } else if (notification.type === 'PROFILE_VIEWED') {
      if (notification.relatedEntityId) {
        navigate(`/profile/${notification.relatedEntityId}`);
      } else {
        navigate('/network');
      }
    } else {
      navigate('/feed');
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3.5 group ${
        !notification.isRead
          ? 'bg-brand-50/70 dark:bg-brand-950/30 border-brand-300/80 dark:border-brand-800/60 shadow-xs'
          : 'bg-white dark:bg-dark-card border-light-border dark:border-dark-border hover:bg-slate-50 dark:hover:bg-dark-elevated'
      }`}
    >
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <div className="relative shrink-0">
          <Avatar name="Nexora Alert" size="md" />
          <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-white dark:bg-dark-card ring-2 ring-white dark:ring-dark-card shadow-xs">
            {getIcon()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p
            className={`text-xs sm:text-sm leading-relaxed ${
              !notification.isRead
                ? 'font-bold text-slate-900 dark:text-white'
                : 'font-medium text-slate-700 dark:text-slate-300'
            }`}
          >
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] text-light-muted dark:text-dark-muted font-medium">
              {formatTimeAgo(notification.createdAt)}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-dark-elevated text-light-muted dark:text-dark-muted font-mono">
              {notification.type.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0 self-center">
        {!notification.isRead && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              title="Mark as read"
              className="p-1.5 rounded-xl text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors opacity-70 group-hover:opacity-100"
            >
              <Check className="w-4 h-4" />
            </button>
            <span
              className="w-2.5 h-2.5 rounded-full bg-brand-600 dark:bg-brand-400 ring-4 ring-brand-100 dark:ring-brand-900/40"
              title="Unread alert"
            />
          </>
        )}
      </div>
    </div>
  );
};
