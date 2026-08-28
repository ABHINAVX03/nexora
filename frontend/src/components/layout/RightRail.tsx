import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, ShieldCheck, Clock, Hash, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { connectionApi } from '../../api/connectionApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [targetUserId, setTargetUserId] = useState('');

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

  const sendRequestMutation = useMutation({
    mutationFn: async (receiverId: number) => {
      await connectionApi.sendConnectionRequest(receiverId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-connection-requests'] });
      showToast('success', 'Invitation Sent', `Sent connection request to User #${targetUserId}`);
      setTargetUserId('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Could not send request. Check user ID.';
      showToast('error', 'Request Failed', msg);
    },
  });

  const handleQuickConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = parseInt(targetUserId.trim(), 10);
    if (isNaN(idNum) || idNum <= 0) {
      showToast('warning', 'Invalid ID', 'Please enter a valid numeric User ID');
      return;
    }
    sendRequestMutation.mutate(idNum);
  };

  return (
    <aside className="w-full space-y-4">
      {/* Quick Connect by User ID */}
      <Card className="border-light-border dark:border-dark-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs uppercase tracking-wider text-light-muted dark:text-dark-muted font-bold flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-brand-500" />
            Connect With A Member
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-3">
          <form onSubmit={handleQuickConnect} className="space-y-2">
            <input
              type="number"
              min="1"
              placeholder="Enter User ID (e.g. 10)"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded-xl bg-slate-50 dark:bg-dark-elevated border border-light-border/60 dark:border-dark-border/60 text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              isLoading={sendRequestMutation.isPending}
              disabled={!targetUserId.trim()}
              className="w-full text-xs h-8"
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Send Request
            </Button>
          </form>
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
    </aside>
  );
};
