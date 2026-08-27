import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, MessageSquare } from 'lucide-react';
import { CommentItem } from './CommentItem';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { commentApi } from '../../api/commentApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CommentDto } from '../../types';

export interface CommentSectionProps {
  postId: number;
  postAuthorId: number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  postAuthorId,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');

  // Fetch real comments for this post
  const {
    data: comments = [],
    isLoading,
    isError,
  } = useQuery<CommentDto[]>({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      return await commentApi.getComments(postId);
    },
    staleTime: 5000,
  });

  // Add Comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      return await commentApi.addComment(postId, { content: text });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      setContent('');
      showToast('success', 'Comment Added', 'Your comment has been posted.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to post comment.';
      showToast('error', 'Error', msg);
    },
  });

  // Delete Comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await commentApi.deleteComment(postId, commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      showToast('info', 'Comment Removed', 'Your comment was deleted.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to delete comment.';
      showToast('error', 'Error', msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addCommentMutation.mutate(content.trim());
  };

  return (
    <div className="space-y-3 pt-3 border-t border-light-border/50 dark:border-dark-border/50 animate-fade-in">
      {/* Add Comment Input */}
      {user && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
          <Avatar name={user.name} size="sm" className="flex-shrink-0" />
          <div className="relative flex-1">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a thoughtful comment..."
              className="w-full h-9 pl-3.5 pr-10 text-xs rounded-xl bg-slate-50 dark:bg-dark-elevated border border-light-border/60 dark:border-dark-border/60 text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={!content.trim() || addCommentMutation.isPending}
              className="absolute right-1.5 top-1.5 p-1 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950 disabled:opacity-40 transition-all"
              title="Send Comment"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-2 pt-1">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postAuthorId={postAuthorId}
                onDelete={(commentId) => deleteCommentMutation.mutate(commentId)}
                isDeleting={
                  deleteCommentMutation.isPending &&
                  deleteCommentMutation.variables === comment.id
                }
              />
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-light-muted dark:text-dark-muted italic py-1 px-1">
            No comments yet. Be the first to share your thoughts.
          </p>
        )}
      </div>
    </div>
  );
};
