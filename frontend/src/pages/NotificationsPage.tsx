import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';
import { NotificationItem } from '../components/notifications/NotificationItem';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton } from '../components/ui/Skeleton';
import { notificationApi } from '../api/notificationApi';
import { useToast } from '../context/ToastContext';
import { NotificationDto } from '../types';

export const NotificationsPage: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Query real notifications with polling for Kafka updates
  const {
    data: notifications = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<NotificationDto[]>({
    queryKey: ['notifications-list'],
    queryFn: async () => {
      return await notificationApi.getNotifications();
    },
    refetchInterval: 6000,
  });

  // Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await notificationApi.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to mark notification as read.';
      showToast('error', 'Error', msg);
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await notificationApi.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
      showToast('success', 'All Read', 'Marked all notifications as read.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to mark all as read.';
      showToast('error', 'Error', msg);
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border/60 dark:border-dark-border/60 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-light-text dark:text-dark-text flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-500" />
            Notification Center
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
            Real-time event alerts delivered via Kafka notification service
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              isLoading={markAllReadMutation.isPending}
              onClick={() => markAllReadMutation.mutate()}
              leftIcon={<CheckCheck className="w-3.5 h-3.5 text-brand-500" />}
            >
              Mark all as read
            </Button>
          )}

          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl text-light-muted hover:text-brand-600 dark:text-dark-muted dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors"
            title="Refresh stream"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-brand-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs
        tabs={[
          { id: 'all', label: 'All Alerts', count: notifications.length },
          { id: 'unread', label: 'Unread Only', count: unreadCount },
        ]}
        activeTab={filter}
        onChange={(tab) => setFilter(tab as any)}
      />

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : isError ? (
          <ErrorState
            title="Unable to load notifications"
            message="Could not connect to the notifications service. Please try again."
            onRetry={() => refetch()}
          />
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-2.5 animate-fade-in">
            {filteredNotifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                onMarkAsRead={(id) => markReadMutation.mutate(id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CheckCheck className="w-7 h-7 text-emerald-500" />}
            title="You're all caught up"
            description="No notifications to display right now. Real-time Kafka alerts will appear here."
          />
        )}
      </div>
    </div>
  );
};
