import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, FileText, Compass, Briefcase, Bookmark, TrendingUp, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { useQuery } from '@tanstack/react-query';
import { connectionApi } from '../../api/connectionApi';
import { postApi } from '../../api/postApi';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bannerError, setBannerError] = useState<boolean>(false);

  // Fetch real count of 1st degree connections
  const { data: firstConnections = [] } = useQuery({
    queryKey: ['my-first-degree-connections'],
    queryFn: async () => {
      try {
        return await connectionApi.getMyFirstConnections();
      } catch {
        return [];
      }
    },
    staleTime: 10000,
  });

  // Fetch real count of user's own posts
  const { data: myPosts = [] } = useQuery({
    queryKey: ['my-posts-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        return await postApi.getUserPosts(user.id);
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 15000,
  });

  // Fetch saved / bookmarked posts count
  const { data: savedPosts = [] } = useQuery({
    queryKey: ['saved-posts'],
    queryFn: async () => {
      try {
        return await postApi.getBookmarkedPosts();
      } catch {
        return [];
      }
    },
    staleTime: 10000,
  });

  if (!user) return null;

  return (
    <aside className="w-full space-y-4">
      {/* Identity Card */}
      <Card className="overflow-hidden border-light-border dark:border-dark-border">
        {/* Banner */}
        <div className="h-20 w-full relative bg-gradient-to-r from-brand-700 via-indigo-700 to-purple-800 overflow-hidden">
          {user.bannerUrl && !bannerError ? (
            <img
              key={user.bannerUrl}
              src={user.bannerUrl}
              alt=""
              onError={() => setBannerError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-brand-700 via-indigo-700 to-purple-800" />
          )}
          <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        </div>

        {/* Profile Info */}
        <div className="p-4 pt-0 text-center relative">
          <div className="-mt-10 mb-3 flex justify-center">
            <Avatar
              name={user.name}
              src={user.avatarUrl}
              size="xl"
              isOnline={true}
              onClick={() => navigate(`/profile/${user.id}`)}
              className="ring-4 ring-white dark:ring-dark-card shadow-card cursor-pointer"
            />
          </div>

          <h3
            onClick={() => navigate(`/profile/${user.id}`)}
            className="text-base font-bold text-light-text dark:text-dark-text tracking-tight hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer transition-colors"
          >
            {user.name}
          </h3>

          <p className="text-xs text-light-muted dark:text-dark-muted mt-1 truncate">
            {user.headline || 'Member @ Nexora'}
          </p>

          {/* Member Analytics Highlights */}
          <div className="mt-4 pt-3 border-t border-light-border/60 dark:border-dark-border/60 space-y-2">
            <Link
              to="/network"
              className="flex items-center justify-between p-1.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-elevated transition-colors text-xs"
            >
              <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted">
                <Users className="w-3.5 h-3.5 text-brand-500" />
                <span className="font-medium">Connections</span>
              </div>
              <span className="font-bold text-brand-600 dark:text-brand-400">
                {firstConnections.length}
              </span>
            </Link>

            <Link
              to={`/profile/${user.id}`}
              className="flex items-center justify-between p-1.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-elevated transition-colors text-xs"
            >
              <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-medium">Posts Published</span>
              </div>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {myPosts.length}
              </span>
            </Link>
          </div>
        </div>
      </Card>

      {/* Quick Access Navigation */}
      <Card className="p-3 border-light-border dark:border-dark-border space-y-1">
        <Link
          to="/saved"
          className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-elevated transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500/20 group-hover:fill-amber-500 transition-colors" />
            <span>Saved Posts</span>
          </div>
          {savedPosts.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 font-bold">
              {savedPosts.length}
            </span>
          )}
        </Link>

        <Link
          to={`/profile/${user.id}`}
          className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-elevated transition-colors"
        >
          <Briefcase className="w-4 h-4 text-indigo-500" />
          <span>My Profile</span>
        </Link>

        <Link
          to="/network"
          className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-elevated transition-colors"
        >
          <Users className="w-4 h-4 text-emerald-500" />
          <span>Manage Network</span>
        </Link>

        <Link
          to="/discover"
          className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-elevated transition-colors"
        >
          <Compass className="w-4 h-4 text-brand-500" />
          <span>Discover Members</span>
        </Link>

        <a
          href="https://github.com/ABHINAVX03/nexora"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm">⭐</span>
            <span className="font-semibold">Star on GitHub</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-200/50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
            Open Source
          </span>
        </a>
      </Card>
    </aside>
  );
};
