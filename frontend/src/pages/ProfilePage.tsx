import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Users } from 'lucide-react';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { PostCard } from '../components/posts/PostCard';
import { ConnectionCard } from '../components/connections/ConnectionCard';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { userApi } from '../api/userApi';
import { postApi } from '../api/postApi';
import { connectionApi } from '../api/connectionApi';
import { useAuth } from '../context/AuthContext';
import { User, Post, Person, ConnectionStatus, PostDto } from '../types';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'posts' | 'connections'>('posts');

  const resolvedUserId = id ? parseInt(id, 10) : currentUser?.id || 1;
  const isSelf = currentUser ? currentUser.id === resolvedUserId : false;

  // 1. Fetch real user profile from User Service
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useQuery<User>({
    queryKey: ['user-profile', resolvedUserId],
    queryFn: async () => {
      const userDto = await userApi.getUserById(resolvedUserId);
      return {
        id: userDto.id,
        name: userDto.name,
        email: userDto.email,
        headline: userDto.headline || 'Member @ Nexora',
        bio: userDto.bio,
        location: userDto.location,
        avatarUrl: userDto.avatarUrl,
      };
    },
    staleTime: 30000,
  });

  // 2. Check Connection Status with target user (from Neo4j Connection Service)
  const { data: isConnected = false } = useQuery<boolean>({
    queryKey: ['connection-status-check', resolvedUserId],
    queryFn: async () => {
      if (isSelf || !currentUser) return false;
      try {
        return await connectionApi.areConnected(resolvedUserId);
      } catch {
        return false;
      }
    },
    enabled: !isSelf && !!currentUser,
    staleTime: 5000,
  });

  // 3. Fetch User Posts from Posts Service
  const { data: userPosts = [], isLoading: isPostsLoading } = useQuery<Post[]>({
    queryKey: ['user-posts', resolvedUserId],
    queryFn: async () => {
      try {
        const postsDto = await postApi.getUserPosts(resolvedUserId);
        if (!postsDto) return [];
        return postsDto.map((p: PostDto) => ({
          id: p.id,
          userId: p.userId,
          content: p.content,
          mediaUrl: p.mediaUrl,
          createdAt: p.createdAt,
          authorName: profile?.name,
          authorAvatar: profile?.avatarUrl,
        }));
      } catch {
        return [];
      }
    },
    enabled: !!profile,
    staleTime: 10000,
  });

  // 4. Fetch User First Connections from Connection Service
  const { data: userConnections = [], isLoading: isConnectionsLoading } = useQuery<Person[]>({
    queryKey: ['user-connections', resolvedUserId],
    queryFn: async () => {
      try {
        return await connectionApi.getUserFirstConnections(resolvedUserId);
      } catch {
        return [];
      }
    },
    staleTime: 10000,
  });

  if (isProfileLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (isProfileError || !profile) {
    return (
      <ErrorState
        title="Member Not Found"
        message={`Could not load profile for User #${resolvedUserId}. The user may not exist in the database.`}
        onRetry={() => navigate('/feed')}
      />
    );
  }

  const resolvedConnectionStatus: ConnectionStatus = isConnected ? 'connected' : 'none';

  return (
    <div className="space-y-6">
      {/* Top Profile Header */}
      <ProfileHeader
        user={profile}
        isSelf={isSelf}
        connectionStatus={resolvedConnectionStatus}
      />

      {/* Profile Section Tabs */}
      <Tabs
        tabs={[
          {
            id: 'posts',
            label: 'Posts',
            count: userPosts.length,
            icon: <FileText className="w-3.5 h-3.5" />,
          },
          {
            id: 'connections',
            label: '1st-Degree Circle',
            count: userConnections.length,
            icon: <Users className="w-3.5 h-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t as 'posts' | 'connections')}
      />

      {/* TAB 1: POSTS */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {isPostsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </div>
          ) : userPosts.length > 0 ? (
            <div className="space-y-4 animate-fade-in">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FileText className="w-7 h-7" />}
              title="No posts published yet"
              description={
                isSelf
                  ? 'Share your insights with your 1st-degree connections.'
                  : `${profile.name} has not published any posts yet.`
              }
              actionLabel={isSelf ? 'Create Post' : undefined}
              onAction={isSelf ? () => navigate('/feed') : undefined}
            />
          )}
        </div>
      )}

      {/* TAB 2: 1ST-DEGREE CIRCLE */}
      {activeTab === 'connections' && (
        <div className="space-y-4 animate-fade-in">
          {isConnectionsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          ) : userConnections.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userConnections.map((person) => (
                <ConnectionCard key={person.userId} person={person} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users className="w-7 h-7" />}
              title="No 1st-degree connections"
              description="This member currently has no public 1st-degree connections listed."
            />
          )}
        </div>
      )}
    </div>
  );
};
