import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Compass, Settings, ArrowRight, X, Home, Users, Bell, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { userApi } from '../../api/userApi';
import { UserDto } from '../../types';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Search real backend users via searchUsers(query)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const users = await userApi.searchUsers(trimmed);
        setSearchResults(users.slice(0, 6));
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (path: string) => {
    onClose();
    setQuery('');
    navigate(path);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl" showCloseButton={false}>
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative flex items-center border-b border-light-border/60 dark:border-dark-border/60 pb-3">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-brand-500 mr-3 flex-shrink-0 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-brand-500 mr-3 flex-shrink-0" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or User ID..."
            autoFocus
            className="w-full bg-transparent text-base text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-light-muted hover:text-light-text dark:text-dark-muted dark:hover:text-dark-text p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto space-y-4 pr-1">
          {/* User Results Section */}
          {searchResults.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-500" />
                Matching Members ({searchResults.length})
              </p>
              <div className="space-y-1.5">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleSelect(`/profile/${user.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-dark-elevated hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-light-border/60 dark:border-dark-border/60 cursor-pointer group transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-light-text dark:text-dark-text truncate group-hover:text-brand-500">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">
                          {user.headline || user.email} · Member #{user.id}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-light-muted group-hover:text-brand-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-2 border-t border-light-border/60 dark:border-dark-border/60">
            <p className="text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2">
              Quick Navigation
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleSelect('/feed')}
                className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-light-muted hover:text-light-text dark:text-dark-muted dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-elevated text-left"
              >
                <Home className="w-4 h-4 text-indigo-500" />
                <span>Home Feed</span>
              </button>
              <button
                onClick={() => handleSelect('/network')}
                className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-light-muted hover:text-light-text dark:text-dark-muted dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-elevated text-left"
              >
                <Users className="w-4 h-4 text-emerald-500" />
                <span>My Connections</span>
              </button>
              <button
                onClick={() => handleSelect('/discover')}
                className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-light-muted hover:text-light-text dark:text-dark-muted dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-elevated text-left"
              >
                <Compass className="w-4 h-4 text-amber-500" />
                <span>Discover Members</span>
              </button>
              <button
                onClick={() => handleSelect('/settings')}
                className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-light-muted hover:text-light-text dark:text-dark-muted dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-elevated text-left"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Preferences</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="pt-2 flex items-center justify-between text-[10px] text-light-muted dark:text-dark-muted">
          <span>Press ESC to close</span>
          <span>Search by member name, keyword, or User ID</span>
        </div>
      </div>
    </Modal>
  );
};
