import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  Search,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionApi } from '../api/connectionApi';
import { ConnectionCard } from '../components/connections/ConnectionCard';
import { RequestCard } from '../components/connections/RequestCard';
import { ConnectionCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import { useChat } from '../context/ChatContext';
import { Person } from '../types';
import { useDocumentTitle } from '../utils/useDocumentTitle';

export const NetworkPage: React.FC = () => {
  useDocumentTitle('My Network', 'Manage your 1st-degree connections and pending invitations on Nexora.');
  const [activeTab, setActiveTab] = useState<'first-degree' | 'requests'>('first-degree');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { openChatWith } = useChat();
  const navigate = useNavigate();

  // 1. Fetch 1st Degree Connections
  const {
    data: firstDegree = [],
    isLoading: isFirstDegreeLoading,
    refetch: refetchFirstDegree,
  } = useQuery<Person[]>({
    queryKey: ['my-first-degree-connections'],
    queryFn: async () => {
      try {
        return await connectionApi.getMyFirstConnections();
      } catch {
        return [];
      }
    },
  });

  // 2. Fetch Pending Connection Requests
  const {
    data: requests = [],
    isLoading: isRequestsLoading,
    refetch: refetchRequests,
  } = useQuery<Person[]>({
    queryKey: ['pending-connection-requests'],
    queryFn: async () => {
      try {
        return await connectionApi.getPendingRequests();
      } catch {
        return [];
      }
    },
  });

  // Accept request mutation
  const acceptMutation = useMutation({
    mutationFn: async (senderId: number) => {
      await connectionApi.acceptConnectionRequest(senderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-connection-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-first-degree-connections'] });
      showToast('success', 'Invitation Accepted', 'Connection successfully established.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to accept connection request.';
      showToast('error', 'Action Failed', msg);
    },
  });

  // Reject request mutation
  const rejectMutation = useMutation({
    mutationFn: async (senderId: number) => {
      await connectionApi.rejectConnectionRequest(senderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-connection-requests'] });
      showToast('info', 'Invitation Declined', 'Connection request was removed.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to decline request.';
      showToast('error', 'Error', msg);
    },
  });

  const filteredFirstDegree = firstDegree.filter(
    (p: Person) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-light-border/60 dark:border-dark-border/60 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-light-text dark:text-dark-text flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-500 shrink-0" />
            <span>Professional Network</span>
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
            Manage your verified 1st-degree connections and incoming invitations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Tabs
            tabs={[
              {
                id: 'first-degree',
                label: '1st Degree',
                count: firstDegree.length,
                icon: <Users className="w-3.5 h-3.5" />,
              },
              {
                id: 'requests',
                label: 'Pending Requests',
                count: requests.length,
                icon: <Clock className="w-3.5 h-3.5" />,
              },
            ]}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab as 'first-degree' | 'requests')}
          />

          <Button
            size="sm"
            variant="outline"
            className="text-xs h-9 items-center gap-1.5"
            leftIcon={<Compass className="w-3.5 h-3.5 text-brand-500" />}
            onClick={() => navigate('/discover')}
          >
            Find Members
          </Button>
        </div>
      </div>

      {/* Search Filter for 1st-degree list */}
      {activeTab === 'first-degree' && firstDegree.length > 0 && (
        <div className="relative flex items-center max-w-md">
          <Search className="w-4 h-4 text-light-muted dark:text-dark-muted absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter connections by name or email..."
            className="w-full h-10 pl-10 pr-4 text-xs rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      )}

      {/* TAB 1: 1ST DEGREE CONNECTIONS */}
      {activeTab === 'first-degree' && (
        <div className="space-y-4">
          {isFirstDegreeLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ConnectionCardSkeleton />
              <ConnectionCardSkeleton />
              <ConnectionCardSkeleton />
              <ConnectionCardSkeleton />
            </div>
          ) : filteredFirstDegree.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredFirstDegree.map((person) => (
                <ConnectionCard
                  key={person.userId}
                  person={person}
                  onMessage={(userId) => openChatWith(userId)}
                />
              ))}
            </div>
          ) : firstDegree.length > 0 && filteredFirstDegree.length === 0 ? (
            <EmptyState
              icon={<Search className="w-8 h-8" />}
              title="No matches found"
              description={`No connections matched "${searchQuery}".`}
            />
          ) : (
            <EmptyState
              icon={<Users className="w-8 h-8 text-brand-500" />}
              title="No connections yet"
              description="Discover and connect with engineers, designers, and leaders across the network."
              actionLabel="Discover Members"
              onAction={() => navigate('/discover')}
            />
          )}
        </div>
      )}

      {/* TAB 2: PENDING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {isRequestsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ConnectionCardSkeleton />
              <ConnectionCardSkeleton />
            </div>
          ) : requests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {requests.map((person) => (
                <RequestCard
                  key={person.userId}
                  person={person}
                  onAccept={() => acceptMutation.mutate(person.userId)}
                  onReject={() => rejectMutation.mutate(person.userId)}
                  isLoading={acceptMutation.isPending || rejectMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Clock className="w-8 h-8 text-brand-500" />}
              title="No pending requests"
              description="You have responded to all incoming invitations."
            />
          )}
        </div>
      )}
    </div>
  );
};
