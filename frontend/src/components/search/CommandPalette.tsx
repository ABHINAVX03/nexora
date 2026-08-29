import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  Compass,
  Settings,
  ArrowRight,
  X,
  Home,
  Users,
  Building2,
  Brain,
  Hash,
  Loader2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { searchApi } from '../../api/searchApi';
import { SearchSuggestionsDto } from '../../types';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestionsDto>({
    people: [],
    companies: [],
    skills: [],
    hashtags: [],
    posts: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions({ people: [], companies: [], skills: [], hashtags: [], posts: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchApi.getSuggestions(trimmed);
        setSuggestions(results);
      } catch {
        setSuggestions({ people: [], companies: [], skills: [], hashtags: [], posts: [] });
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (path: string) => {
    onClose();
    setQuery('');
    navigate(path);
  };

  const handleFullSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      handleSelect(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const hasSuggestions =
    suggestions.people.length > 0 ||
    suggestions.companies.length > 0 ||
    suggestions.skills.length > 0 ||
    (suggestions.hashtags && suggestions.hashtags.length > 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl" showCloseButton={false}>
      <div className="space-y-4">
        {/* Search Input */}
        <form onSubmit={handleFullSearch} className="relative flex items-center border-b border-light-border/60 dark:border-dark-border/60 pb-3">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-brand-500 mr-3 flex-shrink-0 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-brand-500 mr-3 flex-shrink-0" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members, companies, skills, #hashtags..."
            autoFocus
            className="w-full bg-transparent text-base text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-light-muted hover:text-light-text dark:text-dark-muted dark:hover:text-dark-text p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto space-y-4 pr-1">
          {query.trim() && (
            <>
              {/* Full Search Banner */}
              <div
                onClick={() => handleFullSearch()}
                className="flex items-center justify-between p-2.5 rounded-xl bg-brand-50/70 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/60 cursor-pointer font-bold text-xs transition-colors"
              >
                <span>Press Enter to see all search results for "{query}"</span>
                <ArrowRight className="w-4 h-4" />
              </div>

              {/* People Results */}
              {suggestions.people.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    Members ({suggestions.people.length})
                  </p>
                  <div className="space-y-1.5">
                    {suggestions.people.map((person) => (
                      <div
                        key={person.id}
                        onClick={() => handleSelect(`/profile/${person.id}`)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-dark-elevated hover:bg-brand-50 dark:hover:bg-brand-950/40 border border-light-border/60 dark:border-dark-border/60 cursor-pointer group transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar name={person.name} src={person.avatarUrl} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-light-text dark:text-dark-text truncate group-hover:text-brand-500">
                              {person.name}
                            </p>
                            <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">
                              {person.headline || 'Member @ Nexora'}
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-light-muted group-hover:text-brand-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Companies Results */}
              {suggestions.companies.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                    Companies
                  </p>
                  <div className="space-y-1.5">
                    {suggestions.companies.map((comp) => (
                      <div
                        key={comp.id}
                        onClick={() => handleSelect(`/search?q=${encodeURIComponent(comp.name)}&category=companies`)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-dark-elevated hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-light-border/60 dark:border-dark-border/60 cursor-pointer group transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            {comp.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-light-text dark:text-dark-text truncate group-hover:text-emerald-500">
                              {comp.name}
                            </p>
                            <p className="text-[10px] text-light-muted dark:text-dark-muted truncate">
                              {comp.industry || 'Technology'}
                            </p>
                          </div>
                        </div>
                        {comp.memberCount > 0 && (
                          <span className="text-[10px] text-light-muted dark:text-dark-muted">
                            {comp.memberCount} members
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills Results */}
              {suggestions.skills.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2 flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-violet-500" />
                    Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.skills.map((skill) => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => handleSelect(`/search?q=${encodeURIComponent(skill.name)}&category=skills`)}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-dark-elevated hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950/40 dark:hover:text-violet-400 text-xs font-semibold text-light-text dark:text-dark-text border border-light-border dark:border-dark-border transition-colors"
                      >
                        {skill.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hashtags */}
              {suggestions.hashtags && suggestions.hashtags.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted mb-2 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-amber-500" />
                    Hashtags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.hashtags.map((tag) => (
                      <button
                        key={tag.tag}
                        type="button"
                        onClick={() => handleSelect(`/feed?tag=${tag.tag}`)}
                        className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 hover:bg-amber-100 text-xs font-bold transition-colors"
                      >
                        {tag.displayName} ({tag.postCount})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
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
          <span>Search members, skills, companies, #hashtags</span>
        </div>
      </div>
    </Modal>
  );
};
