import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Check, ExternalLink } from 'lucide-react';
import { Person, UserDto } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../api/userApi';

export interface DiscoverCardProps {
  person: Person;
  onConnect: (userId: number) => Promise<void>;
}

export const DiscoverCard: React.FC<DiscoverCardProps> = ({ person, onConnect }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'pending' | 'sent'>('idle');

  // Fetch real user name & headline
  const { data: userProfile } = useQuery<UserDto>({
    queryKey: ['discover-user', person.userId],
    queryFn: async () => {
      try {
        return await userApi.getUserById(person.userId);
      } catch {
        return {
          id: person.userId,
          name: person.name || person.username || 'Nexora Member',
          email: person.email || '',
        };
      }
    },
    staleTime: 60000,
  });

  const displayName = userProfile?.name || person.name || person.username || 'Nexora Member';
  const displayHeadline = userProfile?.headline || 'Member @ Nexora';

  const handleConnectClick = async () => {
    setStatus('pending');
    try {
      await onConnect(person.userId);
      setStatus('sent');
    } catch {
      setStatus('idle');
    }
  };

  return (
    <Card className="p-4 border-light-border dark:border-dark-border shadow-subtle hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start gap-3">
          <Avatar
            name={displayName}
            src={userProfile?.avatarUrl}
            size="lg"
            onClick={() => navigate(`/profile/${person.userId}`)}
          />
          <div className="flex-1 min-w-0">
            <h4
              onClick={() => navigate(`/profile/${person.userId}`)}
              className="text-sm font-bold text-light-text dark:text-dark-text hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer truncate"
            >
              {displayName}
            </h4>
            <p className="text-xs text-light-muted dark:text-dark-muted truncate mt-0.5">
              {displayHeadline}
            </p>
            {userProfile?.location && (
              <p className="text-[11px] text-light-muted dark:text-dark-muted truncate mt-0.5">
                {userProfile.location}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-light-border/60 dark:border-dark-border/60">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs"
          leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
          onClick={() => navigate(`/profile/${person.userId}`)}
        >
          Profile
        </Button>
        <Button
          variant={status === 'sent' ? 'outline' : 'primary'}
          size="sm"
          className="flex-1 text-xs"
          disabled={status === 'pending' || status === 'sent'}
          isLoading={status === 'pending'}
          leftIcon={status === 'sent' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <UserPlus className="w-3.5 h-3.5" />}
          onClick={handleConnectClick}
        >
          {status === 'sent' ? 'Sent' : 'Connect'}
        </Button>
      </div>
    </Card>
  );
};
