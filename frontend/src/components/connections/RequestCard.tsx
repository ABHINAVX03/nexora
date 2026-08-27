import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Clock } from 'lucide-react';
import { Person, UserDto } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../api/userApi';

export interface RequestCardProps {
  person: Person;
  onAccept: (userId: number) => void;
  onReject: (userId: number) => void;
  isLoading?: boolean;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  person,
  onAccept,
  onReject,
  isLoading = false,
}) => {
  const navigate = useNavigate();

  // Fetch real user name & email for this sender
  const { data: userProfile } = useQuery<UserDto>({
    queryKey: ['request-user', person.userId],
    queryFn: async () => {
      try {
        return await userApi.getUserById(person.userId);
      } catch {
        return {
          id: person.userId,
          name: person.name || person.username || `User #${person.userId}`,
          email: person.email || `user${person.userId}@nexora.io`,
        };
      }
    },
    staleTime: 60000,
  });

  const displayName = userProfile?.name || person.name || person.username || `User #${person.userId}`;
  const displayEmail = userProfile?.email || person.email || `user${person.userId}@nexora.io`;

  return (
    <Card className="p-4 border-light-border dark:border-dark-border shadow-subtle hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div
        className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
        onClick={() => navigate(`/profile/${person.userId}`)}
      >
        <Avatar name={displayName} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-light-text dark:text-dark-text hover:text-brand-600 dark:hover:text-brand-400 truncate">
              {displayName}
            </h4>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300 font-semibold flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" /> Pending
            </span>
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted truncate mt-0.5">
            {displayEmail}
          </p>
          <p className="text-[11px] text-light-muted dark:text-dark-muted">
            Sender ID: #{person.userId}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => onReject(person.userId)}
          className="flex-1 sm:flex-initial text-xs"
          leftIcon={<X className="w-3.5 h-3.5" />}
        >
          Decline
        </Button>
        <Button
          variant="primary"
          size="sm"
          isLoading={isLoading}
          onClick={() => onAccept(person.userId)}
          className="flex-1 sm:flex-initial text-xs"
          leftIcon={<Check className="w-3.5 h-3.5" />}
        >
          Accept
        </Button>
      </div>
    </Card>
  );
};
