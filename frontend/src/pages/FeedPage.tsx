import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, MessageSquare, Hash, X } from 'lucide-react';
import { PostComposer } from '../components/posts/PostComposer';
import { PostCard } from '../components/posts/PostCard';
import { PostCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { postApi } from '../api/postApi';
import { Post, PostDto } from '../types';

export const FeedPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTag = searchParams.get('tag');

  const {
    data: allPosts = [],
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

  // Filter posts if tag is present in URL
  const displayedPosts = currentTag
    ? allPosts.filter((post) =>
        post.content?.toLowerCase().includes(`#${currentTag.toLowerCase()}`)
      )
    : allPosts;

  const clearTagFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.delete('tag');
    setSearchParams(params);
  };

  return (
    <div className="space-y-5">
      {/* Top Post Creator */}
      <PostComposer onPostCreated={() => refetch()} />

      {/* Active Hashtag Filter Banner */}
      {currentTag && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-brand-50/80 dark:bg-brand-950/40 border border-brand-500/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-300">
            <Hash className="w-4 h-4 text-brand-500" />
            <span>
              Showing posts tagged with <strong className="text-brand-600 dark:text-brand-400">#{currentTag}</strong>
            </span>
          </div>
          <button
            onClick={clearTagFilter}
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 hover:bg-brand-200 dark:hover:bg-brand-800/60 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filter</span>
          </button>
        </div>
      )}

      {/* Feed Stream Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
          {currentTag ? `Topic Stream (#${currentTag})` : 'Your Network Stream'} ({displayedPosts.length})
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
      {!isLoading && !isError && displayedPosts.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          {displayedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && displayedPosts.length === 0 && (
        <EmptyState
          icon={<MessageSquare className="w-7 h-7" />}
          title={currentTag ? `No posts found for #${currentTag}` : "Your feed is waiting for its first story"}
          description={
            currentTag
              ? "Try creating a post with this hashtag or clear the filter to see all posts."
              : "Create a post above or connect with colleagues in your network to see their updates here."
          }
          actionLabel={currentTag ? "Clear Filter" : undefined}
          onAction={currentTag ? clearTagFilter : undefined}
        />
      )}
    </div>
  );
};
