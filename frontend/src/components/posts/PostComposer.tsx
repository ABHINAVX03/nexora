import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, X } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { postApi } from '../../api/postApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface PostComposerProps {
  onPostCreated?: () => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Invalid File', 'Please select an image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('error', 'File Too Large', 'Maximum image size is 15MB.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setIsExpanded(true);
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createPostMutation = useMutation({
    mutationFn: async ({ text, file }: { text: string; file: File | null }) => {
      let mediaUrl: string | undefined;
      if (file) {
        setIsUploading(true);
        try {
          const uploadRes = await postApi.uploadMedia(file);
          mediaUrl = uploadRes.url;
        } finally {
          setIsUploading(false);
        }
      }
      return await postApi.createPost({ content: text, mediaUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      setContent('');
      removeSelectedFile();
      setIsExpanded(false);
      showToast('success', 'Post Published', 'Your post is now live on Nexora!');
      if (onPostCreated) onPostCreated();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not create post. Please try again.';
      showToast('error', 'Failed to publish', msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;
    createPostMutation.mutate({ text: content.trim(), file: selectedFile });
  };

  if (!user) return null;

  return (
    <Card className="p-4 border-light-border dark:border-dark-border shadow-card dark:shadow-card-dark transition-all">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Top bar: Avatar + input */}
        <div className="flex items-start gap-3">
          <Avatar name={user.name} src={user.avatarUrl} size="md" />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="What's on your mind? Share a thought or engineering insight..."
              rows={isExpanded ? 3 : 2}
              className="w-full bg-slate-50 dark:bg-dark-elevated text-sm text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted rounded-xl p-3 border border-light-border/60 dark:border-dark-border/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* Media Preview Box */}
        {previewUrl && (
          <div className="relative rounded-xl overflow-hidden border border-light-border dark:border-dark-border bg-slate-100 dark:bg-dark-elevated max-h-60 flex items-center justify-center">
            <img
              src={previewUrl}
              alt="Upload preview"
              className="w-full h-full max-h-60 object-cover"
            />
            <button
              type="button"
              onClick={removeSelectedFile}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-light-border/40 dark:border-dark-border/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-light-muted dark:text-dark-muted hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              <span>Photo</span>
            </button>
            <span className="text-[11px] text-light-muted dark:text-dark-muted hidden sm:inline">
              Visible to 1st-degree circle
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isExpanded && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsExpanded(false);
                  setContent('');
                  removeSelectedFile();
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={(!content.trim() && !selectedFile) || createPostMutation.isPending || isUploading}
              isLoading={createPostMutation.isPending || isUploading}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Post
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};
