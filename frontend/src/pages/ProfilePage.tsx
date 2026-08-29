import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Users,
  Eye,
  TrendingUp,
  Sparkles,
  Heart,
  Briefcase,
  Layers,
  Code,
} from 'lucide-react';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { CareerTimeline } from '../components/profile/CareerTimeline';
import { ExperienceSection } from '../components/profile/ExperienceSection';
import { EducationSection } from '../components/profile/EducationSection';
import { SkillsSection } from '../components/profile/SkillsSection';
import { PostCard } from '../components/posts/PostCard';
import { ConnectionCard } from '../components/connections/ConnectionCard';
import { Tabs } from '../components/ui/Tabs';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { userApi } from '../api/userApi';
import { postApi } from '../api/postApi';
import { connectionApi } from '../api/connectionApi';
import { profileApi } from '../api/profileApi';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../utils/useDocumentTitle';
import {
  User,
  Post,
  Person,
  ConnectionStatus,
  PostDto,
  ExperienceDto,
  ExperienceCreateInput,
  EducationDto,
  EducationCreateInput,
  UserSkillDto,
  AddSkillInput,
  EndorserSummaryDto,
} from '../types';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'journey' | 'posts' | 'connections'>('journey');

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
        bannerUrl: userDto.bannerUrl,
      };
    },
    staleTime: 30000,
  });

  useDocumentTitle(
    profile ? `${profile.name}` : 'Member Profile',
    profile?.bio || profile?.headline || 'View member experience, education, skills, and timeline on Nexora.'
  );

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

  // 3. Fetch User Experiences
  const { data: experiences = [], isLoading: isExpLoading } = useQuery<ExperienceDto[]>({
    queryKey: ['user-experiences', resolvedUserId],
    queryFn: async () => {
      try {
        return await profileApi.getUserExperiences(resolvedUserId);
      } catch {
        return [];
      }
    },
    staleTime: 10000,
  });

  // 4. Fetch User Educations
  const { data: educations = [], isLoading: isEduLoading } = useQuery<EducationDto[]>({
    queryKey: ['user-educations', resolvedUserId],
    queryFn: async () => {
      try {
        return await profileApi.getUserEducations(resolvedUserId);
      } catch {
        return [];
      }
    },
    staleTime: 10000,
  });

  // 5. Fetch User Skills & Endorsements
  const { data: skills = [], isLoading: isSkillsLoading } = useQuery<UserSkillDto[]>({
    queryKey: ['user-skills', resolvedUserId],
    queryFn: async () => {
      try {
        return await profileApi.getUserSkills(resolvedUserId);
      } catch {
        return [];
      }
    },
    staleTime: 10000,
  });

  // 6. Fetch User Posts from Posts Service
  const { data: userPosts = [], isLoading: isPostsLoading } = useQuery<Post[]>({
    queryKey: ['user-posts', resolvedUserId],
    queryFn: async () => {
      try {
        const postsDto = await postApi.getUserPosts(resolvedUserId);
        if (!postsDto) return [];
        return postsDto.map((p: PostDto) => ({
          ...p,
          images: p.images || p.mediaUrls || (p.mediaUrl ? [p.mediaUrl] : []),
          mediaUrls: p.mediaUrls || p.images || (p.mediaUrl ? [p.mediaUrl] : []),
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

  // 7. Fetch User First Connections from Connection Service
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

  // --- Experience Mutations ---
  const addExperienceMutation = useMutation({
    mutationFn: (data: ExperienceCreateInput) => profileApi.createExperience(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-experiences', resolvedUserId] });
    },
  });

  const updateExperienceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExperienceCreateInput }) =>
      profileApi.updateExperience(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-experiences', resolvedUserId] });
    },
  });

  const deleteExperienceMutation = useMutation({
    mutationFn: (id: number) => profileApi.deleteExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-experiences', resolvedUserId] });
    },
  });

  // --- Education Mutations ---
  const addEducationMutation = useMutation({
    mutationFn: (data: EducationCreateInput) => profileApi.createEducation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-educations', resolvedUserId] });
    },
  });

  const updateEducationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EducationCreateInput }) =>
      profileApi.updateEducation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-educations', resolvedUserId] });
    },
  });

  const deleteEducationMutation = useMutation({
    mutationFn: (id: number) => profileApi.deleteEducation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-educations', resolvedUserId] });
    },
  });

  // --- Skills & Endorsement Mutations ---
  const addSkillMutation = useMutation({
    mutationFn: (data: AddSkillInput) => profileApi.addSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills', resolvedUserId] });
    },
  });

  const removeSkillMutation = useMutation({
    mutationFn: (userSkillId: number) => profileApi.removeSkill(userSkillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills', resolvedUserId] });
    },
  });

  const endorseSkillMutation = useMutation({
    mutationFn: (userSkillId: number) => profileApi.endorseSkill(resolvedUserId, userSkillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills', resolvedUserId] });
    },
  });

  const removeEndorsementMutation = useMutation({
    mutationFn: (userSkillId: number) => profileApi.removeEndorsement(resolvedUserId, userSkillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills', resolvedUserId] });
    },
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
        message="This profile could not be found or may have been removed from the network."
        onRetry={() => navigate('/feed')}
      />
    );
  }

  const resolvedConnectionStatus: ConnectionStatus = isConnected ? 'connected' : 'none';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Profile Header */}
      <ProfileHeader
        user={profile}
        isSelf={isSelf}
        connectionStatus={resolvedConnectionStatus}
      />

      {/* Member Analytics Card */}
      <Card className="p-4 border-light-border dark:border-dark-border bg-white dark:bg-dark-card shadow-subtle rounded-3xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-light-text dark:text-dark-text">
              {isSelf ? 'Your Analytics & Insights' : 'Member Activity Overview'}
            </h3>
          </div>
          {isSelf && (
            <span className="text-[11px] text-light-muted dark:text-dark-muted flex items-center gap-1 font-medium">
              <Sparkles className="w-3 h-3 text-amber-500" /> Private to you
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-light-border/60 dark:border-dark-border/60">
            <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-[11px] font-semibold">Connections</span>
            </div>
            <p className="text-lg font-bold text-light-text dark:text-dark-text">
              {userConnections.length}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-light-border/60 dark:border-dark-border/60">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <FileText className="w-4 h-4" />
              <span className="text-[11px] font-semibold">Posts Published</span>
            </div>
            <p className="text-lg font-bold text-light-text dark:text-dark-text">
              {userPosts.length}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-light-border/60 dark:border-dark-border/60">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
              <Heart className="w-4 h-4" />
              <span className="text-[11px] font-semibold">Reactions Received</span>
            </div>
            <p className="text-lg font-bold text-light-text dark:text-dark-text">
              {userPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0)}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-dark-elevated border border-light-border/60 dark:border-dark-border/60">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-[11px] font-semibold">Skills Listed</span>
            </div>
            <p className="text-lg font-bold text-light-text dark:text-dark-text">
              {skills.length}
            </p>
          </div>
        </div>
      </Card>

      {/* Profile Section Tabs */}
      <Tabs
        tabs={[
          {
            id: 'journey',
            label: 'Experience & Skills',
            count: experiences.length + educations.length + skills.length,
            icon: <Briefcase className="w-3.5 h-3.5" />,
          },
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
        onChange={(t) => setActiveTab(t as 'journey' | 'posts' | 'connections')}
      />

      {/* TAB 1: JOURNEY (TIMELINE, EXPERIENCE, EDUCATION, SKILLS) */}
      {activeTab === 'journey' && (
        <div className="space-y-6 animate-fade-in">
          {/* 1. Interactive Career Timeline */}
          {(experiences.length > 0 || educations.length > 0) && (
            <CareerTimeline experiences={experiences} educations={educations} />
          )}

          {/* 2. Work Experience Section */}
          <ExperienceSection
            experiences={experiences}
            isSelf={isSelf}
            onAdd={async (data) => {
              await addExperienceMutation.mutateAsync(data);
            }}
            onUpdate={async (id, data) => {
              await updateExperienceMutation.mutateAsync({ id, data });
            }}
            onDelete={async (id) => {
              await deleteExperienceMutation.mutateAsync(id);
            }}
            isLoading={isExpLoading}
          />

          {/* 3. Education Section */}
          <EducationSection
            educations={educations}
            isSelf={isSelf}
            onAdd={async (data) => {
              await addEducationMutation.mutateAsync(data);
            }}
            onUpdate={async (id, data) => {
              await updateEducationMutation.mutateAsync({ id, data });
            }}
            onDelete={async (id) => {
              await deleteEducationMutation.mutateAsync(id);
            }}
            isLoading={isEduLoading}
          />

          {/* 4. Skills & 1st-Degree Endorsements Section */}
          <SkillsSection
            skills={skills}
            isSelf={isSelf}
            isConnected={isConnected}
            onAddSkill={async (data) => {
              await addSkillMutation.mutateAsync(data);
            }}
            onRemoveSkill={async (id) => {
              await removeSkillMutation.mutateAsync(id);
            }}
            onEndorseSkill={async (id) => {
              await endorseSkillMutation.mutateAsync(id);
            }}
            onRemoveEndorsement={async (id) => {
              await removeEndorsementMutation.mutateAsync(id);
            }}
            onViewEndorsers={(id) => profileApi.getSkillEndorsers(resolvedUserId, id)}
            isLoading={isSkillsLoading}
          />
        </div>
      )}

      {/* TAB 2: POSTS */}
      {activeTab === 'posts' && (
        <div className="space-y-4 animate-fade-in">
          {isPostsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </div>
          ) : userPosts.length > 0 ? (
            <div className="space-y-4">
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

      {/* TAB 3: 1ST-DEGREE CIRCLE */}
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
