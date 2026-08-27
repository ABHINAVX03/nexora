import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, MessageSquare } from 'lucide-react';
import { PostComposer } from '../components/posts/PostComposer';
import { PostCard } from '../components/posts/PostCard';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { postApi } from '../api/postApi';
import { Post, PostDto } from '../types';

export const FeedPage: React.FC = () => {
  const {
    data: posts = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<Post[]>({
    queryKey: ['feed-posts'],
    queryFn: async () => {
      const backendPosts = await postApi.getFeed();
      if (!backendPosts) return [];
      return backendPosts.map((bp: PostDto) => ({
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
    <div className="space-y-5">
      {/* Top Post Creator */}
      <PostComposer onPostCreated={() => refetch()} />

      {/* Feed Stream Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
          Your Network Stream ({posts.length})
        </h3>

        {/* Refetch button */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-xl text-light-muted hover:text-brand-600 dark:text-dark-muted dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors"
          title="Refresh Feed"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-brand-500' : ''}`} />
        </button>
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
          title="Unable to load feed"
          message="Could not connect to the posts service gateway. Please try again."
          onRetry={() => refetch()}
        />
      )}

      {/* Posts Stream */}
      {!isLoading && !isError && posts.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && posts.length === 0 && (
        <EmptyState
          icon={<MessageSquare className="w-7 h-7" />}
          title="Your feed is waiting for its first story"
          description="Create a post above or connect with colleagues in your network to see their updates here."
        />
      )}
    </div>
  );
};
