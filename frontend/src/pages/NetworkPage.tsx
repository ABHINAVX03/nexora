import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Clock, UserPlus, Search, Check } from 'lucide-react';
import { Tabs } from '../components/ui/Tabs';
import { ConnectionCard } from '../components/connections/ConnectionCard';
import { RequestCard } from '../components/connections/RequestCard';
import { ConnectionCardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { connectionApi } from '../api/connectionApi';
import { useToast } from '../context/ToastContext';
import { Person } from '../types';

export const NetworkPage: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'first-degree' | 'requests' | 'connect'>('first-degree');
  const [searchQuery, setSearchQuery] = useState('');
  const [connectUserId, setConnectUserId] = useState('');

  // 1. Fetch 1st Degree Connections from real Connection Service
  const {
    data: firstDegree = [],
    isLoading: isFirstDegreeLoading,
    isError: isFirstDegreeError,
    refetch: refetchFirstDegree,
  } = useQuery<Person[]>({
    queryKey: ['my-first-degree-connections'],
    queryFn: async () => {
      return await connectionApi.getMyFirstConnections();
    },
    staleTime: 5000,
  });

  // 2. Fetch Pending Requests from real Connection Service
  const {
    data: requests = [],
    isLoading: isRequestsLoading,
    isError: isRequestsError,
    refetch: refetchRequests,
  } = useQuery<Person[]>({
    queryKey: ['pending-connection-requests'],
    queryFn: async () => {
      return await connectionApi.getPendingRequests();
    },
    staleTime: 5000,
  });

  // Accept Mutation
  const acceptMutation = useMutation({
    mutationFn: async (senderId: number) => {
      await connectionApi.acceptConnectionRequest(senderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-connection-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-first-degree-connections'] });
      showToast('success', 'Invitation Accepted', 'You are now 1st-degree connections!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to accept invitation.';
      showToast('error', 'Error', msg);
    },
  });

  // Reject Mutation
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

  // Send request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async (receiverId: number) => {
      await connectionApi.sendConnectionRequest(receiverId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-connection-requests'] });
      showToast('success', 'Request Sent', 'Connection invitation sent successfully!');
      setConnectUserId('');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to send connection request.';
      showToast('error', 'Request Failed', msg);
    },
  });

  const handleSendConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = parseInt(connectUserId.trim(), 10);
    if (isNaN(idNum) || idNum <= 0) {
      showToast('warning', 'Invalid ID', 'Please enter a valid numeric User ID.');
      return;
    }
    sendRequestMutation.mutate(idNum);
  };

  const filteredFirstDegree = firstDegree.filter(
    (p: Person) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.userId).includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-light-border/60 dark:border-dark-border/60 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-light-text dark:text-dark-text flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-500" />
            Professional Network
          </h2>
          <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
            Manage your verified 1st-degree connections and pending invitations
          </p>
        </div>

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
            {
              id: 'connect',
              label: 'Connect by ID',
              icon: <UserPlus className="w-3.5 h-3.5" />,
            },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as 'first-degree' | 'requests' | 'connect')}
        />
      </div>

      {/* Search Filter for 1st-degree list */}
      {activeTab === 'first-degree' && firstDegree.length > 0 && (
        <div className="relative flex items-center max-w-md">
          <Search className="w-4 h-4 text-light-muted dark:text-dark-muted absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter connections by name, ID..."
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
            </div>
          ) : isFirstDegreeError ? (
            <ErrorState
              title="Unable to load connections"
              message="Failed to connect to Connection microservice."
              onRetry={() => refetchFirstDegree()}
            />
          ) : filteredFirstDegree.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
              {filteredFirstDegree.map((person: Person) => (
                <ConnectionCard key={person.userId} person={person} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users className="w-7 h-7" />}
              title="Your professional circle starts here"
              description="You do not have any active 1st-degree connections yet. Send an invitation or accept incoming requests to grow your network."
              actionLabel="Connect with a Member"
              onAction={() => setActiveTab('connect')}
            />
          )}
        </div>
      )}

      {/* TAB 2: PENDING REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {isRequestsLoading ? (
            <div className="space-y-3">
              <ConnectionCardSkeleton />
            </div>
          ) : isRequestsError ? (
            <ErrorState
              title="Unable to load requests"
              message="Failed to connect to Connection microservice."
              onRetry={() => refetchRequests()}
            />
          ) : requests.length > 0 ? (
            <div className="space-y-3 animate-fade-in">
              {requests.map((person: Person) => (
                <RequestCard
                  key={person.userId}
                  person={person}
                  isLoading={acceptMutation.isPending || rejectMutation.isPending}
                  onAccept={(id) => acceptMutation.mutate(id)}
                  onReject={(id) => rejectMutation.mutate(id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Clock className="w-7 h-7" />}
              title="No pending requests"
              description="You have responded to all incoming invitations."
            />
          )}
        </div>
      )}

      {/* TAB 3: CONNECT BY USER ID */}
      {activeTab === 'connect' && (
        <div className="max-w-md mx-auto py-4 animate-fade-in">
          <Card className="p-6 border-light-border dark:border-dark-border">
            <CardHeader className="pb-3 text-center">
              <CardTitle className="text-base font-bold flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-500" />
                Send Connection Invitation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-light-muted dark:text-dark-muted text-center leading-relaxed">
                Connect with any member across the Nexora microservices platform by entering their unique User ID.
              </p>
              <form onSubmit={handleSendConnect} className="space-y-3">
                <input
                  type="number"
                  min="1"
                  placeholder="Enter User ID (e.g. 1, 10)..."
                  value={connectUserId}
                  onChange={(e) => setConnectUserId(e.target.value)}
                  className="w-full h-11 px-3.5 text-sm rounded-xl bg-slate-50 dark:bg-dark-elevated border border-light-border dark:border-dark-border text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={sendRequestMutation.isPending}
                  disabled={!connectUserId.trim()}
                  leftIcon={<UserPlus className="w-4 h-4" />}
                >
                  Send Invitation
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
