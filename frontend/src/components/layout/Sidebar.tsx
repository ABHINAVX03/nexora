import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, FileText, Compass, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { useQuery } from '@tanstack/react-query';
import { connectionApi } from '../../api/connectionApi';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch real count of 1st degree connections from backend
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

  if (!user) return null;

  return (
    <aside className="w-full space-y-4">
      {/* Identity Card */}
      <Card className="overflow-hidden border-light-border dark:border-dark-border">
        {/* Banner */}
        <div className="h-20 w-full relative bg-gradient-to-r from-brand-700 via-indigo-700 to-purple-800" />

        {/* Profile Info */}
        <div className="p-4 pt-0 text-center relative">
          <div className="-mt-10 mb-3 flex justify-center">
            <Avatar
              name={user.name}
              size="xl"
              isOnline={true}
              onClick={() => navigate(`/profile/${user.id}`)}
              className="ring-4 ring-white dark:ring-dark-card shadow-card"
            />
          </div>

          <h3
            onClick={() => navigate(`/profile/${user.id}`)}
            className="text-base font-bold text-light-text dark:text-dark-text tracking-tight hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer transition-colors"
          >
            {user.name}
          </h3>

          <p className="text-xs text-light-muted dark:text-dark-muted mt-1 truncate">
            {user.email}
          </p>

          <p className="text-[11px] text-light-muted dark:text-dark-muted mt-0.5">
            Member ID: #{user.id}
          </p>

          {/* Network Stat */}
          <div className="mt-4 pt-3 border-t border-light-border/60 dark:border-dark-border/60">
            <Link
              to="/network"
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-elevated transition-colors text-xs"
            >
              <div className="flex items-center gap-2 text-light-muted dark:text-dark-muted">
                <Users className="w-4 h-4 text-brand-500" />
                <span className="font-medium">1st-Degree Connections</span>
              </div>
              <span className="font-bold text-brand-600 dark:text-brand-400">
                {firstConnections.length}
              </span>
            </Link>
          </div>
        </div>
      </Card>

      {/* Quick Access Navigation */}
      <Card className="p-3 border-light-border dark:border-dark-border space-y-1">
        <Link
          to={`/profile/${user.id}`}
          className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-elevated transition-colors"
        >
          <Briefcase className="w-4 h-4 text-indigo-500" />
          <span>My Profile & Posts</span>
        </Link>
        <Link
          to="/network"
          className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-elevated transition-colors"
        >
          <Users className="w-4 h-4 text-emerald-500" />
          <span>Manage Connections</span>
        </Link>
        <Link
          to="/discover"
          className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-slate-50 dark:hover:bg-dark-elevated transition-colors"
        >
          <Compass className="w-4 h-4 text-amber-500" />
          <span>Connect by User ID</span>
        </Link>
      </Card>
    </aside>
  );
};
