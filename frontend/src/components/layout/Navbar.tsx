import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  Compass,
  Bell,
  MessageSquare,
  Search,
  Settings,
  LogOut,
  User as UserIcon,
  Star,
  X,
  Loader2,
  Building2,
  Brain,
  Hash,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../ui/Avatar';
import { Dropdown } from '../ui/Dropdown';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../../api/notificationApi';
import { searchApi } from '../../api/searchApi';
import { SearchSuggestionsDto } from '../../types';

interface NavbarProps {
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount: chatUnreadCount, openChatWith } = useChat();
  const location = useLocation();
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestionsDto>({
    people: [],
    companies: [],
    skills: [],
    hashtags: [],
    posts: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Debounced search suggestions fetch
  useEffect(() => {
    const trimmed = searchQuery.trim();
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
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to dismiss search suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      setIsSearchFocused(false);
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleSelectSuggestion = (path: string) => {
    setIsSearchFocused(false);
    setSearchQuery('');
    navigate(path);
  };

  // Fetch unread notification count
  const { data: unreadNotificationsCount = 0 } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: async () => {
      if (!isAuthenticated) return 0;
      try {
        return await notificationApi.getUnreadCount();
      } catch {
        return 0;
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 6000,
  });

  const navLinks = [
    { label: 'Home', path: '/feed', icon: <Home className="w-5 h-5" /> },
    { label: 'Network', path: '/network', icon: <Users className="w-5 h-5" /> },
    { label: 'Discover', path: '/discover', icon: <Compass className="w-5 h-5" /> },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
  ];

  const hasSuggestions =
    suggestions.people.length > 0 ||
    suggestions.companies.length > 0 ||
    suggestions.skills.length > 0 ||
    (suggestions.hashtags && suggestions.hashtags.length > 0) ||
    (suggestions.posts && suggestions.posts.length > 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-light-border/80 dark:border-dark-border/80 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo + Interactive Global Search */}
        <div className="flex items-center gap-4 lg:gap-6 flex-1 max-w-xl">
          <Link to={isAuthenticated ? '/feed' : '/'} className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-violet-500 p-0.5 shadow-glow flex items-center justify-center transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-dark-bg/20 rounded-[10px] flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 19V5l12 14V5" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-light-text dark:text-dark-text leading-none flex items-center gap-1">
                Nexora
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-subtle" />
              </span>
              <span className="text-[10px] text-light-muted dark:text-dark-muted font-medium tracking-wide uppercase">
                Network
              </span>
            </div>
          </Link>

          {/* Interactive Global Search Input (Desktop) */}
          {isAuthenticated && (
            <div ref={searchContainerRef} className="relative hidden md:block flex-1 max-w-md">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 text-light-muted dark:text-dark-muted" />
                  )}
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchFocused(false);
                    }
                  }}
                  placeholder="Search members, skills, companies, #tags..."
                  className="w-full pl-9 pr-8 py-2 text-xs text-light-text dark:text-dark-text bg-slate-100/90 dark:bg-dark-elevated border border-light-border/60 dark:border-dark-border/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all placeholder:text-light-muted dark:placeholder:text-dark-muted"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSuggestions({ people: [], companies: [], skills: [], hashtags: [], posts: [] });
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-light-muted hover:text-light-text dark:text-dark-muted dark:hover:text-dark-text"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden lg:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded text-light-muted dark:text-dark-muted shadow-2xs pointer-events-none">
                    ⌘K
                  </kbd>
                )}
              </form>

              {/* Real-time Suggestions Dropdown */}
              {isSearchFocused && searchQuery.trim() && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto divide-y divide-light-border/50 dark:divide-dark-border/50 animate-scale-in">
                  {hasSuggestions ? (
                    <>
                      {/* People Suggestions */}
                      {suggestions.people.length > 0 && (
                        <div className="p-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted px-2 py-1 flex items-center gap-1.5">
                            <Users className="w-3 h-3 text-indigo-500" />
                            People
                          </p>
                          <div className="space-y-0.5">
                            {suggestions.people.map((person) => (
                              <button
                                key={person.id}
                                type="button"
                                onClick={() => handleSelectSuggestion(`/profile/${person.id}`)}
                                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-elevated text-left transition-colors group"
                              >
                                <Avatar name={person.name} src={person.avatarUrl} size="sm" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate">
                                    {person.name}
                                  </p>
                                  <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">
                                    {person.headline || 'Member @ Nexora'}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Companies Suggestions */}
                      {suggestions.companies.length > 0 && (
                        <div className="p-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted px-2 py-1 flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-emerald-500" />
                            Companies
                          </p>
                          <div className="space-y-0.5">
                            {suggestions.companies.map((comp) => (
                              <button
                                key={comp.id}
                                type="button"
                                onClick={() =>
                                  handleSelectSuggestion(
                                    `/search?q=${encodeURIComponent(comp.name)}&category=companies`
                                  )
                                }
                                className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-elevated text-left transition-colors group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                    {comp.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-emerald-600 truncate">
                                      {comp.name}
                                    </p>
                                    <p className="text-[10px] text-light-muted dark:text-dark-muted truncate">
                                      {comp.industry || 'Technology'}
                                    </p>
                                  </div>
                                </div>
                                {comp.memberCount > 0 && (
                                  <span className="text-[10px] text-light-muted dark:text-dark-muted font-medium">
                                    {comp.memberCount} members
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills Suggestions */}
                      {suggestions.skills.length > 0 && (
                        <div className="p-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted px-2 py-1 flex items-center gap-1.5">
                            <Brain className="w-3 h-3 text-violet-500" />
                            Skills
                          </p>
                          <div className="space-y-0.5">
                            {suggestions.skills.map((skill) => (
                              <button
                                key={skill.id}
                                type="button"
                                onClick={() =>
                                  handleSelectSuggestion(
                                    `/search?q=${encodeURIComponent(skill.name)}&category=skills`
                                  )
                                }
                                className="w-full flex items-center justify-between px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-elevated text-left transition-colors group"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <Brain className="w-3.5 h-3.5 text-violet-500" />
                                  <span className="text-xs font-semibold text-light-text dark:text-dark-text group-hover:text-violet-600 truncate">
                                    {skill.name}
                                  </span>
                                </div>
                                {skill.memberCount > 0 && (
                                  <span className="text-[10px] text-light-muted dark:text-dark-muted font-medium">
                                    {skill.memberCount} members
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hashtags Suggestions */}
                      {suggestions.hashtags && suggestions.hashtags.length > 0 && (
                        <div className="p-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted px-2 py-1 flex items-center gap-1.5">
                            <Hash className="w-3 h-3 text-amber-500" />
                            Hashtags
                          </p>
                          <div className="flex flex-wrap gap-1.5 px-2 py-1">
                            {suggestions.hashtags.map((tag) => (
                              <button
                                key={tag.tag}
                                type="button"
                                onClick={() => handleSelectSuggestion(`/feed?tag=${tag.tag}`)}
                                className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors"
                              >
                                {tag.displayName} ({tag.postCount})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    !isSearching && (
                      <div className="p-4 text-center">
                        <p className="text-xs text-light-muted dark:text-dark-muted">
                          No direct suggestions found. Press Enter to search everywhere.
                        </p>
                      </div>
                    )
                  )}

                  {/* Footer Action: See All Results */}
                  <div className="p-2 bg-slate-50 dark:bg-dark-elevated">
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-xs font-bold transition-colors"
                    >
                      <span>See all results for "{searchQuery}"</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center / Navigation Links (Desktop) */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 bg-brand-50/80 dark:bg-brand-950/40'
                      : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-elevated'
                  }`}
                >
                  <div className="relative">
                    {link.icon}
                    {link.badge && link.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-dark-bg animate-scale-in">
                        {link.badge > 9 ? '9+' : link.badge}
                      </span>
                    )}
                  </div>
                  <span className="hidden lg:inline">{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-brand-600 dark:bg-brand-400" />
                  )}
                </Link>
              );
            })}

            {/* Messaging Quick Trigger */}
            <button
              onClick={() => openChatWith(0)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-elevated transition-all"
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
                {chatUnreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-brand-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-dark-bg animate-scale-in">
                    {chatUnreadCount > 9 ? '9+' : chatUnreadCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline">Messaging</span>
            </button>
          </nav>
        )}

        {/* Right: Actions, Theme, Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search trigger */}
          {isAuthenticated && (
            <button
              onClick={onOpenSearch}
              className="md:hidden p-2 rounded-xl text-light-muted dark:text-dark-muted hover:bg-slate-100 dark:hover:bg-dark-elevated"
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {/* GitHub Star Link */}
          <a
            href="https://github.com/ABHINAVX03/nexora"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-light-border dark:border-dark-border text-xs font-semibold text-light-text dark:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors group shadow-2xs"
            title="Star Nexora on GitHub"
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Star</span>
          </a>

          {/* User Profile / Auth State */}
          {isAuthenticated && user ? (
            <Dropdown
              trigger={
                <div className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-dark-elevated transition-colors cursor-pointer">
                  <Avatar src={user.avatarUrl} name={user.name} size="sm" isOnline={true} />
                </div>
              }
              items={[
                {
                  label: (
                    <div className="py-1">
                      <p className="font-semibold text-light-text dark:text-dark-text truncate">{user.name}</p>
                      <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">{user.email}</p>
                    </div>
                  ),
                  onClick: () => navigate(`/profile/${user.id}`),
                },
                {
                  label: 'View Profile',
                  icon: <UserIcon className="w-4 h-4" />,
                  onClick: () => navigate(`/profile/${user.id}`),
                  divider: true,
                },
                {
                  label: 'Settings',
                  icon: <Settings className="w-4 h-4" />,
                  onClick: () => navigate('/settings'),
                },
                {
                  label: 'Sign Out',
                  icon: <LogOut className="w-4 h-4" />,
                  variant: 'danger',
                  divider: true,
                  onClick: () => {
                    logout();
                    navigate('/login');
                  },
                },
              ]}
            />
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-light-muted hover:text-light-text dark:text-dark-muted dark:hover:text-dark-text transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
