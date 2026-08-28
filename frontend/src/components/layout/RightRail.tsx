import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, ShieldCheck, Clock, Hash, TrendingUp, Compass, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { connectionApi } from '../../api/connectionApi';
import { useQuery } from '@tanstack/react-query';
import { Person } from '../../types';

const TRENDING_TOPICS = [
  { tag: 'microservices', postsCount: '1.2k' },
  { tag: 'java21', postsCount: '980' },
  { tag: 'kafka', postsCount: '840' },
  { tag: 'cloud', postsCount: '650' },
  { tag: 'react', postsCount: '520' },
  { tag: 'nexora', postsCount: '340' },
];

export const RightRail: React.FC = () => {
  const navigate = useNavigate();

  // Fetch real pending connection requests
  const { data: pendingRequests = [] } = useQuery<Person[]>({
    queryKey: ['pending-connection-requests'],
    queryFn: async () => {
      try {
        return await connectionApi.getPendingRequests();
      } catch {
        return [];
      }
    },
    staleTime: 10000,
  });

  return (
    <aside className="w-full space-y-4">
      {/* Grow Your Network Card */}
      <Card className="border-light-border dark:border-dark-border bg-gradient-to-br from-brand-50/40 via-white to-indigo-50/20 dark:from-dark-card dark:to-dark-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wider text-light-muted dark:text-dark-muted font-bold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-brand-500" />
            Discover & Connect
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-1 space-y-3">
          <p className="text-xs text-light-muted dark:text-dark-muted leading-relaxed">
            Find engineers, leaders, and peers by name, title, or skills across Nexora.
          </p>
          <Button
            size="sm"
            variant="primary"
            className="w-full text-xs h-8 shadow-sm"
            leftIcon={<Users className="w-3.5 h-3.5" />}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            onClick={() => navigate('/discover')}
          >
            Explore Members
          </Button>
        </CardContent>
      </Card>

      {/* Trending Topics & Hashtags */}
      <Card className="border-light-border dark:border-dark-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs uppercase tracking-wider text-light-muted dark:text-dark-muted font-bold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
            Trending Topics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 pt-0 space-y-1">
          {TRENDING_TOPICS.map((item) => (
            <button
              key={item.tag}
              onClick={() => navigate(`/feed?tag=${item.tag}`)}
              className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-dark-elevated transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-brand-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-light-text dark:text-dark-text group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {item.tag}
                </span>
              </div>
              <span className="text-[10px] font-medium text-light-muted dark:text-dark-muted">
                {item.postsCount} posts
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Pending Requests Alert if any */}
      {pendingRequests.length > 0 && (
        <Card className="border-brand-500/30 bg-brand-50/30 dark:bg-brand-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {pendingRequests.length} Pending Invitation{pendingRequests.length > 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <p className="text-xs text-light-muted dark:text-dark-muted mb-2">
              You have incoming connection requests waiting for review.
            </p>
            <Link to="/network">
              <Button size="sm" variant="outline" className="w-full text-xs h-7">
                Review in Network
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Architecture Insight */}
      <div className="p-3.5 rounded-2xl border border-light-border/80 dark:border-dark-border/80 bg-white/40 dark:bg-dark-card text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-brand-600 dark:text-brand-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Microservices Infrastructure</span>
        </div>
        <p className="text-[11px] text-light-muted dark:text-dark-muted leading-relaxed">
          Spring Cloud API Gateway routing to User, Posts, Connection (Neo4j), and Notification (Kafka) microservices.
        </p>
      </div>

      {/* GitHub Star Project Card */}
      <a
        href="https://github.com/ABHINAVX03/nexora"
        target="_blank"
        rel="noopener noreferrer"
        className="block p-3 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-50/50 via-white to-amber-50/30 dark:from-amber-950/20 dark:to-dark-card hover:border-amber-500/60 transition-all text-xs group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
            <span className="text-sm group-hover:rotate-12 transition-transform">⭐</span>
            <span>Star on GitHub</span>
          </div>
          <span className="text-[10px] font-semibold text-light-muted dark:text-dark-muted group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            ABHINAVX03/nexora →
          </span>
        </div>
        <p className="text-[11px] text-light-muted dark:text-dark-muted mt-1 leading-snug">
          Support Nexora open source development with a star on GitHub!
        </p>
      </a>
    </aside>
  );
};
