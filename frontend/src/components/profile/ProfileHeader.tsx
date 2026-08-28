import React, { useState, useRef } from 'react';
import {
  MapPin,
  UserPlus,
  Check,
  Clock,
  Share2,
  ShieldCheck,
  Edit3,
  MessageSquare,
  Camera,
  Loader2,
} from 'lucide-react';
import { User, ConnectionStatus, UserPresenceDto } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { connectionApi } from '../../api/connectionApi';
import { chatApi } from '../../api/chatApi';
import { userApi } from '../../api/userApi';
import { useChat } from '../../context/ChatContext';
import { ProfileEditModal } from './ProfileEditModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface ProfileHeaderProps {
  user: User;
  isSelf: boolean;
  connectionStatus?: ConnectionStatus;
  onConnectionChange?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isSelf,
  connectionStatus = 'none',
  onConnectionChange,
}) => {
  const { showToast } = useToast();
  const { updateCurrentUser, refreshUserProfile } = useAuth();
  const { openChatWith } = useChat();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [currentStatus, setCurrentStatus] = useState<ConnectionStatus>(connectionStatus);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch real-time active / online presence for this user
  const { data: presence } = useQuery<UserPresenceDto>({
    queryKey: ['user-presence', user.id],
    queryFn: async () => {
      return await chatApi.getUserPresence(user.id);
    },
    refetchInterval: 8000,
  });

  const isActive = isSelf || (presence?.isActive ?? false);

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      return await userApi.uploadAvatar(user.id, file);
    },
    onSuccess: (updatedDto) => {
      updateCurrentUser({ avatarUrl: updatedDto.avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-info'] });
      queryClient.invalidateQueries({ queryKey: ['search-users'] });
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      refreshUserProfile();
      showToast('success', 'Photo Updated', 'Your profile picture has been updated!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to upload photo.';
      showToast('error', 'Upload Failed', msg);
    },
  });

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Invalid File', 'Please select an image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('error', 'File Too Large', 'Maximum avatar size is 10MB.');
      return;
    }

    uploadAvatarMutation.mutate(file);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectionApi.sendConnectionRequest(user.id);
      setCurrentStatus('pending_sent');
      showToast('success', 'Invitation Sent', `Sent a connection request to ${user.name}`);
      if (onConnectionChange) onConnectionChange();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send request.';
      showToast('error', 'Error', msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAccept = async () => {
    setIsConnecting(true);
    try {
      await connectionApi.acceptConnectionRequest(user.id);
      setCurrentStatus('connected');
      showToast('success', 'Connected', `You and ${user.name} are now 1st-degree connections!`);
      if (onConnectionChange) onConnectionChange();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to accept connection.';
      showToast('error', 'Error', msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('info', 'Profile Link Copied', 'Profile URL copied to clipboard');
  };

  return (
    <div className="rounded-3xl border border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-card dark:shadow-card-dark overflow-hidden">
      {/* Hero Cover Banner */}
      <div className="h-36 sm:h-44 w-full relative bg-gradient-to-r from-brand-800 via-indigo-900 to-purple-950">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Profile Details Container */}
      <div className="px-6 pb-6 pt-0 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 mb-4">
          {/* Avatar with Upload Capability */}
          <div className="relative inline-block group">
            <Avatar
              name={user.name}
              src={user.avatarUrl}
              size="2xl"
              isOnline={isActive}
              className="ring-4 ring-white dark:ring-dark-card shadow-elevated"
            />

            {/* If own profile, show photo change overlay */}
            {isSelf && (
              <>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadAvatarMutation.isPending}
                  className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                  title="Change Profile Photo"
                >
                  {uploadAvatarMutation.isPending ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span className="text-[9px] font-semibold tracking-wider uppercase">Edit</span>
                    </>
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </>
            )}

            <span className="absolute bottom-1 right-1 p-1.5 rounded-full bg-brand-600 text-white shadow-xs" title="Verified Member">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          {/* Action Buttons Bar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {isSelf ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                  onClick={() => setIsEditModalOpen(true)}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Share2 className="w-3.5 h-3.5" />}
                  onClick={handleShare}
                >
                  Share Profile Link
                </Button>
              </>
            ) : (
              <>
                {currentStatus === 'connected' ? (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                      onClick={() => openChatWith(user.id)}
                    >
                      Message
                    </Button>
                    <Button variant="outline" size="sm" disabled leftIcon={<Check className="w-3.5 h-3.5 text-emerald-500" />}>
                      Connected (1st)
                    </Button>
                  </>
                ) : currentStatus === 'pending_sent' ? (
                  <Button variant="outline" size="sm" disabled leftIcon={<Clock className="w-3.5 h-3.5 text-amber-500" />}>
                    Request Pending
                  </Button>
                ) : currentStatus === 'pending_received' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isConnecting}
                    onClick={handleAccept}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                  >
                    Accept Connection
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={isConnecting}
                    onClick={handleConnect}
                    leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                  >
                    Connect
                  </Button>
                )}

                <Button variant="secondary" size="sm" onClick={handleShare}>
                  Share Profile
                </Button>
              </>
            )}
          </div>
        </div>

        {/* User Name & Metadata */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-light-text dark:text-dark-text">
              {user.name}
            </h1>
            <Badge variant="brand" size="sm" dot>
              Member #{user.id}
            </Badge>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40'
                  : 'bg-slate-100 dark:bg-dark-elevated text-slate-500 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {isActive ? 'Active now' : 'Offline'}
            </span>
          </div>

          {user.headline && (
            <p className="text-sm font-medium text-light-text dark:text-dark-text">
              {user.headline}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-light-muted dark:text-dark-muted flex-wrap">
            <span className="font-mono">{user.email}</span>
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-500" />
                {user.location}
              </span>
            )}
          </div>

          {user.bio && (
            <p className="text-xs sm:text-sm text-light-muted dark:text-dark-muted pt-2 whitespace-pre-line border-t border-light-border/60 dark:border-dark-border/60">
              {user.bio}
            </p>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isSelf && (
        <ProfileEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={user}
        />
      )}
    </div>
  );
};
