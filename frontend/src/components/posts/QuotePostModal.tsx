import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Send, Repeat, Plus, Trash2, Calendar } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { PostMediaCarousel } from './PostMediaCarousel';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { postApi } from '../../api/postApi';
import { Post, PostCreateInput } from '../../types';
import { formatTimeAgo } from '../../utils/formatters';

interface QuotePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalPost: Post;
  onSuccess?: () => void;
}

export const QuotePostModal: React.FC<QuotePostModalProps> = ({
  isOpen,
  onClose,
  originalPost,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [commentary, setCommentary] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (selectedFiles.length + files.length > 4) {
      showToast('error', 'Too Many Files', 'You can upload a maximum of 4 images.');
      return;
    }

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        showToast('error', 'Invalid File', 'Only image files (JPG, PNG, WEBP, GIF) are allowed.');
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        showToast('error', 'File Too Large', `File '${file.name}' exceeds 15MB limit.`);
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviewUrls((prev) => [...prev, ...validPreviews]);
  };

  const removeSelectedFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentary.trim() && selectedFiles.length === 0) {
      showToast('error', 'Empty Quote', 'Please add your thoughts or attach an image.');
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedMediaUrls: string[] = [];
      if (selectedFiles.length > 0) {
        uploadedMediaUrls = await postApi.uploadMultipleMedia(selectedFiles);
      }

      const payload: PostCreateInput = {
        content: commentary.trim() || 'Shared a post',
        repostOfPostId: originalPost.id,
        mediaUrls: uploadedMediaUrls.length > 0 ? uploadedMediaUrls : undefined,
        mediaUrl: uploadedMediaUrls.length > 0 ? uploadedMediaUrls[0] : undefined,
      };

      await postApi.createPost(payload);
      showToast('success', 'Quote Post Published', 'Your thoughts have been shared with your network!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to publish quote repost');
    } finally {
      setIsSubmitting(false);
    }
  };

  const origMediaUrls =
    originalPost.mediaUrls && originalPost.mediaUrls.length > 0
      ? originalPost.mediaUrls
      : originalPost.mediaUrl
      ? [originalPost.mediaUrl]
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-elevated/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-light-text dark:text-dark-text">
                Repost with Thoughts
              </h2>
              <p className="text-xs text-light-muted dark:text-dark-muted">
                Add your perspective to {originalPost.authorName || 'this post'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* User Commentary */}
          <div className="flex gap-3">
            <Avatar
              src={user?.avatarUrl}
              name={user?.name || 'Member'}
              size="md"
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-light-text dark:text-dark-text">
                {user?.name || 'You'}
              </p>
              <textarea
                value={commentary}
                onChange={(e) => setCommentary(e.target.value)}
                placeholder="What do you think about this post? Add your insights..."
                rows={3}
                className="w-full mt-2 p-3 bg-slate-50 dark:bg-dark-elevated border border-slate-200 dark:border-dark-border rounded-2xl text-sm text-light-text dark:text-dark-text placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                autoFocus
              />
            </div>
          </div>

          {/* Uploaded Photos Preview Grid */}
          {previewUrls.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-light-muted dark:text-dark-muted">
                <span>Attached Photos ({previewUrls.length}/4)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden aspect-[16/10] bg-slate-900 group">
                    <img src={url} alt={`Upload preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeSelectedFile(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/70 text-white hover:bg-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attached Original Post Preview Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-dark-elevated/70 border border-slate-200 dark:border-dark-border space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar
                src={originalPost.authorAvatar}
                name={originalPost.authorName || 'Member'}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-light-text dark:text-dark-text truncate">
                  {originalPost.authorName || 'Member'}
                </p>
                <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">
                  {originalPost.authorHeadline || 'Nexora Member'} • {formatTimeAgo(originalPost.createdAt)}
                </p>
              </div>
            </div>

            <p className="text-xs text-light-text/90 dark:text-dark-text/80 line-clamp-3 leading-relaxed">
              {originalPost.content}
            </p>

            {origMediaUrls.length > 0 && (
              <div className="rounded-xl overflow-hidden max-h-40 border border-slate-200/60 dark:border-dark-border/60">
                <img
                  src={origMediaUrls[0]}
                  alt="Original post media"
                  className="w-full h-40 object-cover"
                />
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-dark-border">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                multiple
                className="hidden"
              />
              {selectedFiles.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-brand-500" />
                  <span>Add Photo ({selectedFiles.length}/4)</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting} className="flex items-center gap-1.5">
                <Repeat className="w-4 h-4" /> Post Quote
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
