import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, BarChart2, X, Plus, Trash2 } from 'lucide-react';
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Poll state
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 6 - selectedFiles.length;
    if (remainingSlots <= 0) {
      showToast('warning', 'Limit Reached', 'You can upload a maximum of 6 images per post.');
      e.target.value = '';
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      showToast('info', 'Image Limit', `Only the first ${remainingSlots} images were added (max 6).`);
    }

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        showToast('error', 'Invalid File', `File '${file.name}' is not an image (PNG, JPG, WEBP, GIF).`);
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        showToast('error', 'File Too Large', `File '${file.name}' exceeds 15MB limit.`);
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...validFiles]);
      setPreviewUrls((prev) => [...prev, ...validPreviews]);
      setIsExpanded(true);
    }

    // Always clear input value so subsequent selections fire onChange
    e.target.value = '';
  };

  const removeSelectedFile = (index: number) => {
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handlePollOptionChange = (index: number, val: string) => {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  };

  const resetForm = () => {
    setContent('');
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
    setShowPollBuilder(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setIsExpanded(false);
  };

  const createPostMutation = useMutation({
    mutationFn: async ({
      text,
      files,
      pollData,
    }: {
      text: string;
      files: File[];
      pollData: { question: string; options: string[] } | null;
    }) => {
      let mediaUrls: string[] | undefined;
      let mediaUrl: string | undefined;

      if (files && files.length > 0) {
        setIsUploading(true);
        try {
          mediaUrls = await postApi.uploadMultipleMedia(files);
          if (mediaUrls && mediaUrls.length > 0) {
            mediaUrl = mediaUrls[0];
          }
        } finally {
          setIsUploading(false);
        }
      }

      return await postApi.createPost({
        content: text,
        mediaUrl,
        mediaUrls,
        poll: pollData ? pollData : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      resetForm();
      showToast('success', 'Post Published', 'Your post is now live on Nexora!');
      if (onPostCreated) onPostCreated();
    },
    onError: (err: any) => {
      showToast(
        'error',
        'Post Failed',
        err.response?.data?.message || 'Failed to publish post. Please try again.'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedFiles.length === 0 && !showPollBuilder) {
      showToast('warning', 'Empty Post', 'Please write something or attach a photo.');
      return;
    }

    let pollData = null;
    if (showPollBuilder) {
      if (!pollQuestion.trim()) {
        showToast('error', 'Poll Question Required', 'Please provide a question for your poll.');
        return;
      }
      const validOpts = pollOptions.filter((opt) => opt.trim().length > 0);
      if (validOpts.length < 2) {
        showToast('error', 'Poll Options Required', 'Please provide at least 2 valid poll options.');
        return;
      }
      pollData = {
        question: pollQuestion.trim(),
        options: validOpts.map((o) => o.trim()),
      };
    }

    createPostMutation.mutate({
      text: content.trim(),
      files: selectedFiles,
      pollData,
    });
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
              placeholder="What's on your mind? Share a thought, engineering insight, or #hashtag..."
              rows={isExpanded ? 3 : 2}
              className="w-full bg-slate-50 dark:bg-dark-elevated text-sm text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted rounded-xl p-3 border border-light-border/60 dark:border-dark-border/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none"
            />
          </div>
        </div>

        {/* Multi-Photo Preview Grid */}
        {previewUrls.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-light-muted dark:text-dark-muted px-1">
              <span>Attached Photos ({previewUrls.length}/4)</span>
              {previewUrls.length > 1 && (
                <span className="text-[11px] text-brand-600 dark:text-brand-400 font-normal">
                  Will be displayed as an interactive carousel
                </span>
              )}
            </div>
            <div className={`grid gap-2 ${previewUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {previewUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl overflow-hidden border border-light-border dark:border-dark-border bg-slate-900 aspect-[16/10] max-h-56 group"
                >
                  <img
                    src={url}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/70 text-white text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-xl bg-slate-950/80 hover:bg-rose-600 text-white transition-colors shadow-md"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Poll Builder Box */}
        {showPollBuilder && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-brand-500/30 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-brand-600 dark:text-brand-400">
                <BarChart2 className="w-4 h-4" />
                <span>Create Community Poll</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPollBuilder(false)}
                className="text-light-muted hover:text-rose-500 p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Ask a question (e.g. Which backend do you prefer?)"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border/60 dark:border-dark-border/60 text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-brand-500"
            />

            <div className="space-y-2">
              {pollOptions.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-light-muted dark:text-dark-muted w-4">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handlePollOptionChange(idx, e.target.value)}
                    className="flex-1 h-8 px-3 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border/60 dark:border-dark-border/60 text-light-text dark:text-dark-text focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePollOption(idx)}
                      className="text-light-muted hover:text-rose-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {pollOptions.length < 4 && (
              <button
                type="button"
                onClick={handleAddPollOption}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline pt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Option (up to 4)</span>
              </button>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-light-border/40 dark:border-dark-border/40">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-light-muted dark:text-dark-muted hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              <span>Photo {selectedFiles.length > 0 ? `(${selectedFiles.length}/4)` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowPollBuilder(!showPollBuilder);
                setIsExpanded(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                showPollBuilder
                  ? 'text-brand-600 bg-brand-50 dark:bg-brand-950 dark:text-brand-300'
                  : 'text-light-muted dark:text-dark-muted hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-dark-elevated'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-brand-500" />
              <span>Poll</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isExpanded && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={(!content.trim() && selectedFiles.length === 0 && !showPollBuilder) || createPostMutation.isPending || isUploading}
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
