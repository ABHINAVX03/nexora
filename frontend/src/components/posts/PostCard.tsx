import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Share2,
  MoreHorizontal,
  Trash2,
  Edit3,
  Check,
  X,
  Save,
  MessageSquare,
  Bookmark,
  BarChart2,
  CheckCircle2,
  Repeat,
} from 'lucide-react';
import { Post, UserDto, CommentDto, LikeStatusDto, PollDto } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import { CommentSection } from './CommentSection';
import { PostMediaCarousel } from './PostMediaCarousel';
import { QuotePostModal } from './QuotePostModal';
import { formatTimeAgo } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { postApi } from '../../api/postApi';
import { userApi } from '../../api/userApi';
import { commentApi } from '../../api/commentApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Embedded Quote Card Sub-component
const EmbeddedQuoteCard: React.FC<{ repostedPost: Post }> = ({ repostedPost }) => {
  const navigate = useNavigate();
  const { data: origAuthor } = useQuery<UserDto>({
    queryKey: ['user-info', repostedPost.userId],
    queryFn: async () => {
      try {
        return await userApi.getUserById(repostedPost.userId);
      } catch {
        return { id: repostedPost.userId, name: 'Nexora Member', email: '' };
      }
    },
    staleTime: 60000,
  });

  const origName = origAuthor?.name || repostedPost.authorName || 'Nexora Member';
  const origAvatar = origAuthor?.avatarUrl || repostedPost.authorAvatar;
  const origHeadline = origAuthor?.headline || repostedPost.authorHeadline || 'Tech Professional';

  const origMediaUrls = Array.from(
    new Set(
      [
        ...(Array.isArray(repostedPost.images) ? repostedPost.images : []),
        ...(Array.isArray(repostedPost.mediaUrls) ? repostedPost.mediaUrls : []),
        ...(typeof (repostedPost as any).imageUrl === 'string' && (repostedPost as any).imageUrl.trim() ? [(repostedPost as any).imageUrl.trim()] : []),
        ...(typeof repostedPost.mediaUrl === 'string' && repostedPost.mediaUrl.trim() ? [repostedPost.mediaUrl.trim()] : []),
      ].filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    )
  );

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/profile/${repostedPost.userId}`);
      }}
      className="mt-3 p-4 rounded-2xl bg-slate-50/90 dark:bg-dark-elevated/70 border border-light-border dark:border-dark-border hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all cursor-pointer space-y-2.5"
    >
      <div className="flex items-center gap-2.5">
        <Avatar name={origName} src={origAvatar} size="sm" />
        <div className="min-w-0 flex-1">
          <h5 className="text-xs font-bold text-light-text dark:text-dark-text hover:text-brand-600 dark:hover:text-brand-400 transition-colors truncate">
            {origName}
          </h5>
          <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">
            {origHeadline} • {formatTimeAgo(repostedPost.createdAt)}
          </p>
        </div>
      </div>

      <p className="text-xs text-light-text/90 dark:text-dark-text/90 leading-relaxed line-clamp-4">
        {repostedPost.content}
      </p>

      {origMediaUrls.length > 0 && (
        <div className="rounded-xl overflow-hidden max-h-60" onClick={(e) => e.stopPropagation()}>
          <PostMediaCarousel mediaUrls={origMediaUrls} />
        </div>
      )}
    </div>
  );
};

export interface PostCardProps {
  post: Post;
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [hasLiked, setHasLiked] = useState<boolean>(post.hasLiked ?? false);
  const [likesCount, setLikesCount] = useState<number>(post.likesCount ?? 0);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>(post.content);

  // Computed all media URLs (single or multi-photo)
  const allMediaUrls = Array.from(
    new Set(
      [
        ...(Array.isArray(post.images) ? post.images : []),
        ...(Array.isArray(post.mediaUrls) ? post.mediaUrls : []),
        ...(typeof (post as any).imageUrl === 'string' && (post as any).imageUrl.trim() ? [(post as any).imageUrl.trim()] : []),
        ...(typeof post.mediaUrl === 'string' && post.mediaUrl.trim() ? [post.mediaUrl.trim()] : []),
      ].filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    )
  );

  // Poll state
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [pollState, setPollState] = useState<PollDto | undefined>(post.poll);

  const isOwner = user?.id === post.userId;

  useEffect(() => {
    if (post.poll) {
      setPollState(post.poll);
    }
  }, [post.poll]);

  // Fetch author details from real User microservice
  const { data: author } = useQuery<UserDto>({
    queryKey: ['user-info', post.userId],
    queryFn: async () => {
      try {
        return await userApi.getUserById(post.userId);
      } catch {
        return {
          id: post.userId,
          name: 'Nexora Member',
          email: '',
        };
      }
    },
    staleTime: 60000,
  });

  // Fetch real like status and count from backend
  const { data: likeStatus } = useQuery<LikeStatusDto>({
    queryKey: ['post-like-status', post.id],
    queryFn: async () => {
      try {
        return await postApi.getLikeStatus(post.id);
      } catch {
        return { postId: post.id, hasLiked: false, likesCount: 0 };
      }
    },
    staleTime: 5000,
  });

  useEffect(() => {
    if (likeStatus) {
      setHasLiked(likeStatus.hasLiked);
      setLikesCount(likeStatus.likesCount);
    }
  }, [likeStatus]);

  // Fetch bookmark status for current user
  const { data: bookmarkStatus } = useQuery<boolean>({
    queryKey: ['post-bookmark-status', post.id],
    queryFn: async () => {
      try {
        return await postApi.isPostBookmarked(post.id);
      } catch {
        return false;
      }
    },
    staleTime: 10000,
    enabled: !!user,
  });

  useEffect(() => {
    if (bookmarkStatus !== undefined) {
      setIsBookmarked(bookmarkStatus);
    }
  }, [bookmarkStatus]);

  // Fetch comment count for this post (only when drawer is expanded)
  const { data: comments = [] } = useQuery<CommentDto[]>({
    queryKey: ['post-comments', post.id],
    queryFn: async () => {
      try {
        return await commentApi.getComments(post.id);
      } catch {
        return [];
      }
    },
    enabled: isCommentsOpen,
    staleTime: 10000,
  });

  const totalCommentsCount = isCommentsOpen ? comments.length : (post.commentsCount ?? 0);

  const authorName = author?.name || post.authorName || 'Nexora Member';
  const authorHeadline = author?.headline || 'Member @ Nexora';
  const authorAvatar = author?.avatarUrl || post.authorAvatar;

  // Toggle Like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      return await postApi.toggleLike(post.id);
    },
    onMutate: () => {
      setHasLiked((prev) => {
        const next = !prev;
        setLikesCount((cnt) => (next ? cnt + 1 : Math.max(0, cnt - 1)));
        return next;
      });
    },
    onSuccess: (status) => {
      setHasLiked(status.hasLiked);
      setLikesCount(status.likesCount);
      queryClient.setQueryData(['post-like-status', post.id], status);
    },
    onError: (err) => {
      setHasLiked((prev) => {
        const rollback = !prev;
        setLikesCount((cnt) => (rollback ? cnt + 1 : Math.max(0, cnt - 1)));
        return rollback;
      });
      showToast('error', 'Error', 'Failed to update reaction.');
      console.error(err);
    },
  });

  // Toggle Bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      return await postApi.toggleBookmark(post.id);
    },
    onMutate: () => {
      setIsBookmarked((prev) => !prev);
    },
    onSuccess: (data) => {
      setIsBookmarked(data.bookmarked);
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
      queryClient.setQueryData(['post-bookmark-status', post.id], data.bookmarked);
      showToast(
        'success',
        data.bookmarked ? 'Post Saved' : 'Post Removed',
        data.bookmarked
          ? 'Added to your Saved Items.'
          : 'Removed from your Saved Items.'
      );
    },
    onError: () => {
      setIsBookmarked((prev) => !prev);
      showToast('error', 'Error', 'Failed to update bookmark.');
    },
  });

  // Vote on Poll mutation
  const votePollMutation = useMutation({
    mutationFn: async ({ pollId, optionId }: { pollId: number; optionId: number }) => {
      return await postApi.votePoll(pollId, optionId);
    },
    onSuccess: (updatedPoll) => {
      setPollState(updatedPoll);
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      showToast('success', 'Vote Recorded', 'Your vote has been counted!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not record vote.';
      showToast('error', 'Vote Failed', msg);
    },
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: async (newText: string) => {
      const imagesList = post.images && post.images.length > 0
        ? post.images
        : (post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls : (post.mediaUrl ? [post.mediaUrl] : []));
      return await postApi.updatePost(post.id, {
        content: newText,
        mediaUrl: post.mediaUrl,
        mediaUrls: imagesList,
        images: imagesList,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['post-detail', post.id] });
      setIsEditing(false);
      showToast('success', 'Post Updated', 'Your post changes have been saved.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to update post.';
      showToast('error', 'Update Failed', msg);
    },
  });

  // Instant Repost mutation
  const instantRepostMutation = useMutation({
    mutationFn: async () => {
      return await postApi.createPost({
        content: `Shared a post by ${authorName}`,
        repostOfPostId: post.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      showToast('success', 'Post Reposted', 'The post has been shared to your feed.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to repost.';
      showToast('error', 'Repost Failed', msg);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await postApi.deletePost(post.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
      showToast('success', 'Post Deleted', 'Your post was removed.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not delete post.';
      showToast('error', 'Error', msg);
    },
  });

  // Handle Share
  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl);
    setIsCopied(true);
    showToast('info', 'Link Copied', 'Post URL copied to clipboard.');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    updatePostMutation.mutate(editContent.trim());
  };

  // Render text with clickable #hashtags
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        const tag = part.substring(1);
        return (
          <span
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/feed?tag=${tag}`);
            }}
            className="text-brand-600 dark:text-brand-400 font-semibold hover:underline cursor-pointer transition-colors"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const hasUserVoted = pollState?.hasVoted || isOwner;

  return (
    <Card className="border-light-border dark:border-dark-border shadow-subtle hover:border-slate-300 dark:hover:border-zinc-700 transition-all">
      <div className="p-5 space-y-4">
        {/* Post Author Header */}
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate(`/profile/${post.userId}`)}
          >
            <Avatar name={authorName} src={authorAvatar} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-light-text dark:text-dark-text group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {authorName}
                </h4>
                {isOwner && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300 font-semibold">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs text-light-muted dark:text-dark-muted truncate max-w-xs">
                {authorHeadline}
              </p>
              <span className="text-[11px] text-light-muted dark:text-dark-muted font-medium">
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>
          </div>

          {/* More actions dropdown */}
          <Dropdown
            trigger={
              <button className="text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            }
            items={[
              {
                label: isBookmarked ? 'Remove bookmark' : 'Save post',
                icon: (
                  <Bookmark
                    className={`w-4 h-4 ${
                      isBookmarked ? 'text-amber-500 fill-amber-500' : ''
                    }`}
                  />
                ),
                onClick: () => toggleBookmarkMutation.mutate(),
              },
              {
                label: 'Copy link to post',
                icon: <Share2 className="w-4 h-4" />,
                onClick: handleShare,
              },
              ...(isOwner
                ? [
                    {
                      label: 'Edit post',
                      icon: <Edit3 className="w-4 h-4" />,
                      onClick: () => {
                        setEditContent(post.content);
                        setIsEditing(true);
                      },
                    },
                    {
                      label: 'Delete post',
                      icon: <Trash2 className="w-4 h-4" />,
                      variant: 'danger' as const,
                      divider: true,
                      onClick: () => deleteMutation.mutate(),
                    },
                  ]
                : []),
            ]}
          />
        </div>

        {/* Post Content or In-Place Editor */}
        {isEditing ? (
          <form onSubmit={handleSaveEdit} className="space-y-3 pt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 dark:bg-dark-elevated text-sm text-light-text dark:text-dark-text rounded-xl p-3 border border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
              placeholder="Edit your post content..."
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(post.content);
                }}
                leftIcon={<X className="w-3.5 h-3.5" />}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={updatePostMutation.isPending}
                disabled={!editContent.trim()}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            {post.content && (
              <p className="text-sm text-light-text dark:text-dark-text whitespace-pre-line leading-relaxed">
                {renderFormattedContent(post.content)}
              </p>
            )}

            {/* Attached Interactive Community Poll */}
            {pollState && (
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-dark-elevated border border-brand-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400">
                    <BarChart2 className="w-4 h-4" />
                    <span>Poll</span>
                  </div>
                  <span className="text-[11px] text-light-muted dark:text-dark-muted font-medium">
                    {pollState.totalVotes} {pollState.totalVotes === 1 ? 'vote' : 'votes'}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-light-text dark:text-dark-text">
                  {pollState.question}
                </h4>

                <div className="space-y-2 pt-1">
                  {pollState.options.map((opt) => {
                    const isVotedChoice = pollState.userVotedOptionId === opt.id;
                    const percent = opt.votePercentage ?? 0;

                    return (
                      <div key={opt.id}>
                        {hasUserVoted ? (
                          // Result Bar View
                          <div className="relative overflow-hidden rounded-xl border border-light-border dark:border-dark-border p-2.5 bg-white dark:bg-dark-card transition-all">
                            {/* Animated progress bar fill */}
                            <div
                              className={`absolute inset-0 transition-all duration-700 ease-out ${
                                isVotedChoice
                                  ? 'bg-brand-500/20 dark:bg-brand-500/30'
                                  : 'bg-slate-200/50 dark:bg-zinc-800/60'
                              }`}
                              style={{ width: `${percent}%` }}
                            />

                            <div className="relative flex items-center justify-between z-10 text-xs">
                              <div className="flex items-center gap-1.5 font-semibold text-light-text dark:text-dark-text">
                                {isVotedChoice && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400 shrink-0" />
                                )}
                                <span>{opt.optionText}</span>
                              </div>
                              <div className="flex items-center gap-2 font-bold text-light-text dark:text-dark-text">
                                <span>{percent}%</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Interactive Voting Option
                          <button
                            type="button"
                            onClick={() => setSelectedOptionId(opt.id)}
                            className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                              selectedOptionId === opt.id
                                ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 ring-1 ring-brand-500'
                                : 'border-light-border dark:border-dark-border hover:border-brand-300 dark:hover:border-zinc-700 bg-white dark:bg-dark-card text-light-text dark:text-dark-text'
                            }`}
                          >
                            <span>{opt.optionText}</span>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                selectedOptionId === opt.id
                                  ? 'border-brand-500 bg-brand-500 text-white'
                                  : 'border-slate-300 dark:border-zinc-600'
                              }`}
                            >
                              {selectedOptionId === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!hasUserVoted && (
                  <div className="flex items-center justify-end pt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!selectedOptionId || votePollMutation.isPending}
                      isLoading={votePollMutation.isPending}
                      onClick={() => {
                        if (selectedOptionId && pollState) {
                          votePollMutation.mutate({
                            pollId: pollState.id,
                            optionId: selectedOptionId,
                          });
                        }
                      }}
                      className="text-xs h-7 px-3"
                    >
                      Submit Vote
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Attached Media / Photos (Single or Multi-Photo Carousel) */}
            {allMediaUrls.length > 0 && (
              <PostMediaCarousel mediaUrls={allMediaUrls} />
            )}

            {/* Embedded Quote Repost Card */}
            {post.repostedPost && (
              <EmbeddedQuoteCard repostedPost={post.repostedPost} />
            )}
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-light-border/60 dark:border-dark-border/60">
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Like Toggle Button (+1 / -1) */}
            <button
              onClick={() => {
                if (!toggleLikeMutation.isPending) {
                  toggleLikeMutation.mutate();
                }
              }}
              disabled={toggleLikeMutation.isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all select-none ${
                hasLiked
                  ? 'text-rose-600 bg-rose-50/80 dark:bg-rose-950/40 dark:text-rose-400'
                  : 'text-light-muted dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-elevated hover:text-rose-600'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-transform active:scale-125 ${
                  hasLiked ? 'fill-rose-500 text-rose-500 scale-110' : ''
                }`}
              />
              <span>{hasLiked ? 'Liked' : 'Like'}</span>
              {likesCount > 0 && (
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                    hasLiked
                      ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300'
                      : 'bg-slate-100 dark:bg-dark-elevated text-light-muted dark:text-dark-muted'
                  }`}
                >
                  {likesCount}
                </span>
              )}
            </button>

            {/* Comment button */}
            <button
              onClick={() => setIsCommentsOpen(!isCommentsOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isCommentsOpen
                  ? 'text-brand-600 bg-brand-50/70 dark:bg-brand-950/40 dark:text-brand-400'
                  : 'text-light-muted dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-elevated hover:text-brand-600'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Comment</span>
              {totalCommentsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-dark-elevated text-light-muted dark:text-dark-muted font-bold ml-0.5">
                  {totalCommentsCount}
                </span>
              )}
            </button>

            {/* Repost / Quote Button with Dropdown */}
            <Dropdown
              trigger={
                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-light-muted dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-elevated hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  <Repeat className="w-4 h-4" />
                  <span>Repost</span>
                </button>
              }
              items={[
                {
                  label: 'Instant Repost',
                  icon: <Repeat className="w-4 h-4 text-emerald-500" />,
                  onClick: () => instantRepostMutation.mutate(),
                },
                {
                  label: 'Repost with thoughts',
                  icon: <Edit3 className="w-4 h-4 text-brand-500" />,
                  onClick: () => setIsQuoteModalOpen(true),
                },
              ]}
            />
          </div>

          <div className="flex items-center gap-1">
            {/* Bookmark Toggle Button */}
            <button
              onClick={() => toggleBookmarkMutation.mutate()}
              title={isBookmarked ? 'Saved to Bookmarks' : 'Save post'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                isBookmarked
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/40'
                  : 'text-light-muted dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-elevated hover:text-amber-500'
              }`}
            >
              <Bookmark
                className={`w-4 h-4 transition-transform active:scale-125 ${
                  isBookmarked ? 'fill-amber-500 text-amber-500' : ''
                }`}
              />
              <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-light-muted dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-elevated hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isCopied ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Comment Section */}
        {isCommentsOpen && (
          <CommentSection postId={post.id} postAuthorId={post.userId} />
        )}

        {/* Quote Post Modal */}
        {isQuoteModalOpen && (
          <QuotePostModal
            isOpen={isQuoteModalOpen}
            onClose={() => setIsQuoteModalOpen(false)}
            originalPost={post}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
              queryClient.invalidateQueries({ queryKey: ['user-posts'] });
            }}
          />
        )}
      </div>
    </Card>
  );
};
