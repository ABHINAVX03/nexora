import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, X, Camera, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Avatar } from '../ui/Avatar';
import { User, UserProfileUpdateRequest } from '../../types';
import { userApi } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const { showToast } = useToast();
  const { updateCurrentUser, refreshUserProfile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name);
  const [headline, setHeadline] = useState(user.headline || '');
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      return await userApi.uploadAvatar(user.id, file);
    },
    onSuccess: (updatedDto) => {
      setAvatarUrl(updatedDto.avatarUrl || '');
      updateCurrentUser({ avatarUrl: updatedDto.avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-info', user.id] });
      refreshUserProfile();
      showToast('success', 'Photo Uploaded', 'New profile picture uploaded successfully!');
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

  const updateMutation = useMutation({
    mutationFn: async (payload: UserProfileUpdateRequest) => {
      return await userApi.updateUserProfile(user.id, payload);
    },
    onSuccess: (updatedDto) => {
      updateCurrentUser({
        name: updatedDto.name,
        headline: updatedDto.headline,
        bio: updatedDto.bio,
        location: updatedDto.location,
        avatarUrl: updatedDto.avatarUrl,
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-info', user.id] });
      refreshUserProfile();
      showToast('success', 'Profile Updated', 'Your profile details have been saved.');
      onClose();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to update profile.';
      showToast('error', 'Update Failed', msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('warning', 'Name required', 'Please enter your name.');
      return;
    }
    updateMutation.mutate({
      name: name.trim(),
      headline: headline.trim(),
      bio: bio.trim(),
      location: location.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Professional Profile" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Profile Picture Upload Section */}
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-light-border dark:border-dark-border">
          <Avatar name={name} src={avatarUrl} size="xl" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-light-text dark:text-dark-text uppercase tracking-wider mb-1">
              Profile Photo
            </h4>
            <p className="text-[11px] text-light-muted dark:text-dark-muted mb-2">
              JPG, PNG, WEBP, or GIF up to 10MB
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadAvatarMutation.isPending}
              isLoading={uploadAvatarMutation.isPending}
              leftIcon={<Camera className="w-3.5 h-3.5" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
          </div>
        </div>

        <Input
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alex Morgan"
          required
        />

        <Input
          label="Professional Headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g. Principal Distributed Systems Architect"
        />

        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. San Francisco, CA"
        />

        <Textarea
          label="Professional Bio / Summary"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Describe your domain focus, systems built, or research interests..."
          rows={4}
        />

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-light-border/60 dark:border-dark-border/60">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} leftIcon={<X className="w-4 h-4" />}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={updateMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
};
