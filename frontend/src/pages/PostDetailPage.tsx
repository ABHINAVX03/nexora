import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { PostCard } from '../components/posts/PostCard';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Button } from '../components/ui/Button';
import { postApi } from '../api/postApi';
import { Post } from '../types';

export const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const postId = id ? parseInt(id, 10) : 0;

  const {
    data: post,
    isLoading,
    isError,
  } = useQuery<Post | null>({
    queryKey: ['post-detail', postId],
    queryFn: async () => {
      const dto = await postApi.getPostById(postId);
      if (!dto) return null;
      return {
        id: dto.id,
        userId: dto.userId,
        content: dto.content,
        mediaUrl: dto.mediaUrl,
        createdAt: dto.createdAt,
      };
    },
    enabled: postId > 0,
  });

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back
        </Button>
        <span className="text-xs text-light-muted dark:text-dark-muted font-mono">
          Post #{postId}
        </span>
      </div>

      {isLoading ? (
        <PostCardSkeleton />
      ) : isError ? (
        <ErrorState
          title="Post Not Found"
          message="The post could not be loaded or may have been removed."
          onRetry={() => navigate('/feed')}
        />
      ) : post ? (
        <PostCard post={post} />
      ) : (
        <EmptyState
          icon={<MessageSquare className="w-7 h-7" />}
          title="Post not found"
          description="This post does not exist or has been deleted."
          actionLabel="Return to Feed"
          onAction={() => navigate('/feed')}
        />
      )}
    </div>
  );
};
