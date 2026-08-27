import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, MessageSquare } from 'lucide-react';
import { Person, UserDto, UserPresenceDto } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../api/userApi';
import { chatApi } from '../../api/chatApi';
import { useChat } from '../../context/ChatContext';

export interface ConnectionCardProps {
  person: Person;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({ person }) => {
  const navigate = useNavigate();
  const { openChatWith } = useChat();

  // Fetch real user name & email for this connection
  const { data: userProfile } = useQuery<UserDto>({
    queryKey: ['connection-user', person.userId],
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

  // Fetch active presence for this connection
  const { data: presence } = useQuery<UserPresenceDto>({
    queryKey: ['user-presence', person.userId],
    queryFn: async () => {
      return await chatApi.getUserPresence(person.userId);
    },
    refetchInterval: 10000,
  });

  const displayName = userProfile?.name || person.name || person.username || `User #${person.userId}`;
  const displayEmail = userProfile?.email || person.email || `user${person.userId}@nexora.io`;
  const isOnline = presence?.isActive ?? false;

  return (
    <Card className="p-4 border-light-border dark:border-dark-border hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
      <div className="flex items-start gap-3.5">
        <Avatar
          name={displayName}
          size="lg"
          isOnline={isOnline}
          onClick={() => navigate(`/profile/${person.userId}`)}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4
              onClick={() => navigate(`/profile/${person.userId}`)}
              className="text-sm font-bold text-light-text dark:text-dark-text hover:text-brand-600 dark:hover:text-brand-400 cursor-pointer truncate"
            >
              {displayName}
            </h4>
            <Badge variant="success" size="sm" dot>
              1st
            </Badge>
          </div>
          <p className="text-xs text-light-muted dark:text-dark-muted truncate mt-0.5">
            {displayEmail}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] text-light-muted dark:text-dark-muted">
              ID: #{person.userId}
            </span>
            <span className="text-[10px] text-light-muted dark:text-dark-muted">·</span>
            <span
              className={`text-[10px] font-semibold flex items-center gap-1 ${
                isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-zinc-600'
                }`}
              />
              {isOnline ? 'Active now' : 'Offline'}
            </span>
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
          variant="primary"
          size="sm"
          className="flex-1 text-xs"
          leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
          onClick={() => openChatWith(person.userId)}
        >
          Message
        </Button>
      </div>
    </Card>
  );
};
