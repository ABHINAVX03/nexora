import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Compass, Search, UserPlus, Users, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { userApi } from '../api/userApi';
import { connectionApi } from '../api/connectionApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserDto } from '../types';

export const DiscoverPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [sentMap, setSentMap] = useState<Record<number, boolean>>({});

  // Query real users from GET /api/v1/users?query=...
  const {
    data: searchResults = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<UserDto[]>({
    queryKey: ['search-users', activeQuery],
    queryFn: async () => {
      return await userApi.searchUsers(activeQuery);
    },
    staleTime: 10000,
  });

  const sendRequestMutation = useMutation({
    mutationFn: async (receiverId: number) => {
      await connectionApi.sendConnectionRequest(receiverId);
      return receiverId;
    },
    onSuccess: (receiverId) => {
      setSentMap((prev) => ({ ...prev, [receiverId]: true }));
      showToast('success', 'Invitation Sent', `Connection request sent to member #${receiverId}`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to send connection request.';
      showToast('error', 'Request Failed', msg);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveQuery(searchQuery.trim());
  };

  const visibleResults = searchResults.filter((u) => u.id !== currentUser?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-light-border/60 dark:border-dark-border/60 pb-4">
        <h2 className="text-xl font-bold tracking-tight text-light-text dark:text-dark-text flex items-center gap-2">
          <Compass className="w-5 h-5 text-brand-500" />
          Discover & Connect
        </h2>
        <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
          Search and connect with professionals across the Nexora network by name or email
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="max-w-xl mx-auto space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-light-muted dark:text-dark-muted absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by name, email, or keywords..."
              className="w-full h-11 pl-10 pr-4 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-subtle"
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            isLoading={isFetching}
          >
            Search
          </Button>
        </form>

        {/* Results List */}
        <div className="space-y-3 pt-2">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ) : visibleResults.length > 0 ? (
            <div className="space-y-3 animate-fade-in">
              <p className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted px-1">
                Found Members ({visibleResults.length})
              </p>
              {visibleResults.map((targetUser) => {
                const hasSent = sentMap[targetUser.id];
                return (
                  <Card
                    key={targetUser.id}
                    className="p-4 border-light-border dark:border-dark-border shadow-subtle hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div
                      className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0"
                      onClick={() => navigate(`/profile/${targetUser.id}`)}
                    >
                      <Avatar name={targetUser.name} size="lg" />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-light-text dark:text-dark-text hover:text-brand-600 dark:hover:text-brand-400 truncate">
                          {targetUser.name}
                        </h4>
                        <p className="text-xs text-light-muted dark:text-dark-muted truncate">
                          {targetUser.headline || targetUser.email}
                        </p>
                        <p className="text-[11px] text-light-muted dark:text-dark-muted">
                          Member ID: #{targetUser.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-initial text-xs"
                        onClick={() => navigate(`/profile/${targetUser.id}`)}
                      >
                        Profile
                      </Button>
                      <Button
                        variant={hasSent ? 'outline' : 'primary'}
                        size="sm"
                        disabled={hasSent}
                        isLoading={sendRequestMutation.isPending && sendRequestMutation.variables === targetUser.id}
                        onClick={() => sendRequestMutation.mutate(targetUser.id)}
                        className="flex-1 sm:flex-initial text-xs"
                        leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                      >
                        {hasSent ? 'Invitation Sent' : 'Connect'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<Users className="w-7 h-7" />}
              title="No members found"
              description="Try searching with a different name, keyword, or clear your search to browse all registered members."
              actionLabel="Show All Members"
              onAction={() => {
                setSearchQuery('');
                setActiveQuery('');
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
