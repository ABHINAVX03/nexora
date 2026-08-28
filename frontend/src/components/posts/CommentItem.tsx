import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { CommentDto, UserDto } from '../../types';
import { Avatar } from '../ui/Avatar';
import { formatTimeAgo } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../api/userApi';

export interface CommentItemProps {
  comment: CommentDto;
  postAuthorId: number;
  onDelete: (commentId: number) => void;
  isDeleting?: boolean;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postAuthorId,
  onDelete,
  isDeleting = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isCommentOwner = user?.id === comment.userId;
  const isPostOwner = user?.id === postAuthorId;
  const canDelete = isCommentOwner || isPostOwner;

  // Fetch comment author name from User Service
  const { data: author } = useQuery<UserDto>({
    queryKey: ['user-info', comment.userId],
    queryFn: async () => {
      try {
        return await userApi.getUserById(comment.userId);
      } catch {
        return {
          id: comment.userId,
          name: 'Nexora Member',
          email: '',
        };
      }
    },
    staleTime: 60000,
  });

  const authorName = author?.name || 'Nexora Member';

  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50/70 dark:bg-dark-elevated/50 border border-light-border/40 dark:border-dark-border/40 text-xs">
      <Avatar
        name={authorName}
        src={author?.avatarUrl}
        size="sm"
        onClick={() => navigate(`/profile/${comment.userId}`)}
        className="cursor-pointer flex-shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              onClick={() => navigate(`/profile/${comment.userId}`)}
              className="font-bold text-light-text dark:text-dark-text hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer truncate"
            >
              {authorName}
            </span>
            {isCommentOwner && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold">
                You
              </span>
            )}
            <span className="text-[10px] text-light-muted dark:text-dark-muted font-medium">
              · {formatTimeAgo(comment.createdAt)}
            </span>
          </div>

          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              disabled={isDeleting}
              className="text-light-muted dark:text-dark-muted hover:text-rose-500 p-1 rounded transition-colors"
              title="Delete comment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <p className="text-light-text dark:text-dark-text mt-1 whitespace-pre-line leading-relaxed">
          {comment.content}
        </p>
      </div>
    </div>
  );
};
