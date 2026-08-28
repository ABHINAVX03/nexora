import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, ArrowLeft } from 'lucide-react';
import { PostCard } from '../components/posts/PostCard';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Button } from '../components/ui/Button';
import { postApi } from '../api/postApi';
import { Post, PostDto } from '../types';

export const SavedPostsPage: React.FC = () => {
  const navigate = useNavigate();

  const {
    data: savedPosts = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Post[]>({
    queryKey: ['saved-posts'],
    queryFn: async () => {
      const dtoList = await postApi.getBookmarkedPosts();
      if (!dtoList) return [];
      return dtoList.map((bp: PostDto) => ({
        id: bp.id,
        userId: bp.userId,
        content: bp.content,
        mediaUrl: bp.mediaUrl,
        createdAt: bp.createdAt,
      }));
    },
    staleTime: 5000,
  });

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-lg font-bold text-light-text dark:text-dark-text">
              Saved Posts ({savedPosts.length})
            </h2>
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <ErrorState
          title="Unable to load saved posts"
          message="Could not retrieve your bookmarked items. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {/* Saved Posts Stream */}
      {!isLoading && !isError && savedPosts.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          {savedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && savedPosts.length === 0 && (
        <EmptyState
          icon={<Bookmark className="w-8 h-8 text-amber-500" />}
          title="No saved posts yet"
          description="Bookmark posts you want to revisit later by clicking the save icon on any post in your feed."
          actionLabel="Explore Feed"
          onAction={() => navigate('/feed')}
        />
      )}
    </div>
  );
};
