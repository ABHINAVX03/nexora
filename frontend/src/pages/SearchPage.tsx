import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Users,
  MessageSquare,
  Building2,
  Brain,
  Hash,
  Filter,
  ArrowRight,
  MapPin,
  Briefcase,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { searchApi } from '../api/searchApi';
import { PostCard } from '../components/posts/PostCard';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Skeleton, PostCardSkeleton } from '../components/ui/Skeleton';
import { useDocumentTitle } from '../utils/useDocumentTitle';
import { SearchUserDto, PostDto, CompanyDto, SkillDto, HashtagDto } from '../types';

type SearchCategory = 'all' | 'people' | 'posts' | 'companies' | 'skills' | 'hashtags';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get('q') || '';
  const category = (searchParams.get('category') as SearchCategory) || 'all';
  const locationFilter = searchParams.get('location') || '';
  const companyFilter = searchParams.get('company') || '';
  const skillFilter = searchParams.get('skill') || '';
  const sortFilter = (searchParams.get('sort') as 'recent' | 'popular') || 'recent';

  useDocumentTitle(
    query ? `Search: "${query}"` : 'Global Search',
    'Discover members, engineering posts, companies, technical skills, and topics on Nexora.'
  );

  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value && value.trim()) {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      updateParam('q', searchInput.trim());
    }
  };

  // 1. Fetch People Results
  const {
    data: peopleResults = [],
    isLoading: isPeopleLoading,
    isError: isPeopleError,
    refetch: refetchPeople,
  } = useQuery<SearchUserDto[]>({
    queryKey: ['search-people', query, locationFilter, companyFilter, skillFilter],
    queryFn: async () => {
      return await searchApi.searchPeople({
        q: query,
        location: locationFilter,
        company: companyFilter,
        skill: skillFilter,
        page: 0,
        size: category === 'all' ? 4 : 20,
      });
    },
    enabled: category === 'all' || category === 'people',
  });

  // 2. Fetch Posts Results
  const {
    data: postsResults = [],
    isLoading: isPostsLoading,
    isError: isPostsError,
    refetch: refetchPosts,
  } = useQuery<PostDto[]>({
    queryKey: ['search-posts', query, sortFilter],
    queryFn: async () => {
      return await searchApi.searchPosts({
        q: query,
        sort: sortFilter,
        page: 0,
        size: category === 'all' ? 3 : 20,
      });
    },
    enabled: category === 'all' || category === 'posts',
  });

  // 3. Fetch Companies Results
  const {
    data: companiesResults = [],
    isLoading: isCompaniesLoading,
    isError: isCompaniesError,
    refetch: refetchCompanies,
  } = useQuery<CompanyDto[]>({
    queryKey: ['search-companies', query],
    queryFn: async () => {
      return await searchApi.searchCompanies(query, undefined, 0, category === 'all' ? 3 : 20);
    },
    enabled: category === 'all' || category === 'companies',
  });

  // 4. Fetch Skills Results
  const {
    data: skillsResults = [],
    isLoading: isSkillsLoading,
    isError: isSkillsError,
    refetch: refetchSkills,
  } = useQuery<SkillDto[]>({
    queryKey: ['search-skills', query],
    queryFn: async () => {
      return await searchApi.searchSkills(query, 0, category === 'all' ? 4 : 20);
    },
    enabled: category === 'all' || category === 'skills',
  });

  // 5. Fetch Hashtags Results
  const {
    data: hashtagsResults = [],
    isLoading: isHashtagsLoading,
    isError: isHashtagsError,
    refetch: refetchHashtags,
  } = useQuery<HashtagDto[]>({
    queryKey: ['search-hashtags', query],
    queryFn: async () => {
      return await searchApi.searchHashtags(query);
    },
    enabled: category === 'all' || category === 'hashtags',
  });

  const categories: Array<{ id: SearchCategory; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'all', label: 'All', icon: <Layers className="w-4 h-4" /> },
    { id: 'people', label: 'People', icon: <Users className="w-4 h-4" />, count: peopleResults.length },
    { id: 'posts', label: 'Posts', icon: <MessageSquare className="w-4 h-4" />, count: postsResults.length },
    { id: 'companies', label: 'Companies', icon: <Building2 className="w-4 h-4" />, count: companiesResults.length },
    { id: 'skills', label: 'Skills', icon: <Brain className="w-4 h-4" />, count: skillsResults.length },
    { id: 'hashtags', label: 'Hashtags', icon: <Hash className="w-4 h-4" />, count: hashtagsResults.length },
  ];

  const isLoading =
    (category === 'all' && (isPeopleLoading || isPostsLoading)) ||
    (category === 'people' && isPeopleLoading) ||
    (category === 'posts' && isPostsLoading) ||
    (category === 'companies' && isCompaniesLoading) ||
    (category === 'skills' && isSkillsLoading) ||
    (category === 'hashtags' && isHashtagsLoading);

  const hasAnyResults =
    peopleResults.length > 0 ||
    postsResults.length > 0 ||
    companiesResults.length > 0 ||
    skillsResults.length > 0 ||
    hashtagsResults.length > 0;

  return (
    <div className="space-y-6">
      {/* Search Header Banner */}
      <div className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-4 sm:p-6 shadow-card dark:shadow-card-dark">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-light-muted dark:text-dark-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, skill, company, hashtag, or keyword..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-elevated text-sm text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted border border-light-border/70 dark:border-dark-border/70 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateParam('q', null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-light-muted hover:text-light-text dark:text-dark-muted dark:hover:text-dark-text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button type="submit" variant="primary" size="md">
            Search
          </Button>
        </form>

        {/* Quick popular tags */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-light-border/40 dark:border-dark-border/40 overflow-x-auto text-xs">
          <span className="text-light-muted dark:text-dark-muted shrink-0 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Popular:
          </span>
          {['Java', 'Spring Boot', 'React', 'AWS', 'Google', '#leetcode', '#hackathon'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setSearchInput(tag);
                updateParam('q', tag);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-dark-elevated text-light-text dark:text-dark-text hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 dark:hover:text-brand-400 transition-colors whitespace-nowrap font-medium text-[11px]"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs & Filter Toggle */}
      <div className="flex items-center justify-between gap-3 border-b border-light-border dark:border-dark-border pb-1 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {categories.map((cat) => {
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => updateParam('category', cat.id === 'all' ? null : cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-slate-100 dark:hover:bg-dark-elevated'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                {typeof cat.count === 'number' && cat.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-dark-border text-light-text dark:text-dark-text'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter Drawer Toggle (for People & Posts) */}
        {(category === 'people' || category === 'posts') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
          >
            Filters
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {(locationFilter || companyFilter || skillFilter || sortFilter !== 'recent') && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-light-muted dark:text-dark-muted font-medium">Applied filters:</span>
          {locationFilter && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200/50">
              Location: {locationFilter}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateParam('location', null)} />
            </span>
          )}
          {companyFilter && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200/50">
              Company: {companyFilter}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateParam('company', null)} />
            </span>
          )}
          {skillFilter && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200/50">
              Skill: {skillFilter}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateParam('skill', null)} />
            </span>
          )}
          {sortFilter === 'popular' && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200/50">
              Sorted: Popular
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateParam('sort', null)} />
            </span>
          )}
        </div>
      )}

      {/* Main Results Container */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        ) : !hasAnyResults ? (
          <EmptyState
            icon={<Search className="w-8 h-8 text-light-muted" />}
            title={query ? `No results found for "${query}"` : 'Discover anything across Nexora'}
            description={
              query
                ? 'Try checking for spelling errors, using more general keywords, or exploring related technical skills.'
                : 'Search for developers, colleagues, technical posts, engineering companies, or specific topics.'
            }
          />
        ) : (
          <>
            {/* --- ALL TAB: COMPOSITE VIEW --- */}
            {category === 'all' && (
              <div className="space-y-8">
                {/* 1. Top Matching People */}
                {peopleResults.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-500" />
                        Members ({peopleResults.length})
                      </h3>
                      <button
                        onClick={() => updateParam('category', 'people')}
                        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        See all people <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {peopleResults.map((person) => (
                        <Card
                          key={person.id}
                          className="p-4 flex items-start gap-3.5 hover:border-brand-500/50 transition-all cursor-pointer group"
                          onClick={() => navigate(`/profile/${person.id}`)}
                        >
                          <Avatar name={person.name} src={person.avatarUrl} size="md" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-light-text dark:text-dark-text group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                              {person.name}
                            </h4>
                            <p className="text-xs text-light-muted dark:text-dark-muted truncate mt-0.5">
                              {person.headline || person.currentTitle || 'Member @ Nexora'}
                            </p>
                            {person.currentCompany && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 truncate">
                                <Briefcase className="w-3 h-3" />
                                {person.currentCompany}
                              </p>
                            )}
                            {person.location && (
                              <p className="text-[11px] text-light-muted dark:text-dark-muted flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="w-3 h-3" />
                                {person.location}
                              </p>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Top Matching Companies */}
                {companiesResults.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        Companies ({companiesResults.length})
                      </h3>
                      <button
                        onClick={() => updateParam('category', 'companies')}
                        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        See all companies <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {companiesResults.map((comp) => (
                        <Card key={comp.id} className="p-4 hover:border-emerald-500/50 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-dark-elevated flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                              {comp.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-light-text dark:text-dark-text truncate">{comp.name}</h4>
                              <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">
                                {comp.industry || 'Technology & Software'}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Top Matching Skills */}
                {skillsResults.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted flex items-center gap-2">
                        <Brain className="w-4 h-4 text-violet-500" />
                        Skills & Competencies ({skillsResults.length})
                      </h3>
                      <button
                        onClick={() => updateParam('category', 'skills')}
                        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        Explore all skills <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {skillsResults.map((skill) => (
                        <button
                          key={skill.id}
                          onClick={() => {
                            updateParam('category', 'people');
                            updateParam('skill', skill.name);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border text-xs font-semibold text-light-text dark:text-dark-text hover:border-brand-500 hover:text-brand-600 transition-all shadow-xs"
                        >
                          <Brain className="w-3.5 h-3.5 text-violet-500" />
                          <span>{skill.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Top Matching Hashtags */}
                {hashtagsResults.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted flex items-center gap-2">
                        <Hash className="w-4 h-4 text-amber-500" />
                        Trending Hashtags ({hashtagsResults.length})
                      </h3>
                      <button
                        onClick={() => updateParam('category', 'hashtags')}
                        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        See all hashtags <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {hashtagsResults.map((tag) => (
                        <Link
                          key={tag.tag}
                          to={`/feed?tag=${tag.tag}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-bold hover:bg-amber-100 transition-colors"
                        >
                          <span>{tag.displayName}</span>
                          <span className="text-[10px] font-normal opacity-80">({tag.postCount} posts)</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Top Matching Posts */}
                {postsResults.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-brand-500" />
                        Posts & Discussions ({postsResults.length})
                      </h3>
                      <button
                        onClick={() => updateParam('category', 'posts')}
                        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        See all posts <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {postsResults.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- PEOPLE CATEGORY VIEW --- */}
            {category === 'people' && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted px-1">
                  Matching Members ({peopleResults.length})
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {peopleResults.map((person) => (
                    <Card
                      key={person.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-brand-500/60 transition-all cursor-pointer group"
                      onClick={() => navigate(`/profile/${person.id}`)}
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <Avatar name={person.name} src={person.avatarUrl} size="lg" />
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-light-text dark:text-dark-text group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                            {person.name}
                          </h4>
                          <p className="text-xs text-light-muted dark:text-dark-muted leading-relaxed mt-0.5">
                            {person.headline || person.currentTitle || 'Member @ Nexora Network'}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-light-muted dark:text-dark-muted flex-wrap">
                            {person.currentCompany && (
                              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                                {person.currentCompany}
                              </span>
                            )}
                            {person.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                {person.location}
                              </span>
                            )}
                          </div>
                          {person.skills && person.skills.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                              {person.skills.slice(0, 5).map((s) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-dark-elevated text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                                >
                                  {s}
                                </span>
                              ))}
                              {person.skills.length > 5 && (
                                <span className="text-[10px] text-light-muted dark:text-dark-muted font-medium">
                                  +{person.skills.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/profile/${person.id}`);
                          }}
                        >
                          View Profile
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* --- POSTS CATEGORY VIEW --- */}
            {category === 'posts' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted">
                    Matching Posts ({postsResults.length})
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-light-muted dark:text-dark-muted">Sort:</span>
                    <button
                      onClick={() => updateParam('sort', 'recent')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        sortFilter === 'recent'
                          ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold'
                          : 'text-light-muted hover:text-light-text'
                      }`}
                    >
                      Recent
                    </button>
                    <button
                      onClick={() => updateParam('sort', 'popular')}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        sortFilter === 'popular'
                          ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-bold'
                          : 'text-light-muted hover:text-light-text'
                      }`}
                    >
                      Popular
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {postsResults.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* --- COMPANIES CATEGORY VIEW --- */}
            {category === 'companies' && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted px-1">
                  Companies ({companiesResults.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {companiesResults.map((comp) => (
                    <Card key={comp.id} className="p-5 hover:border-emerald-500/60 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white text-lg shadow-sm">
                          {comp.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-light-text dark:text-dark-text truncate">{comp.name}</h4>
                          <p className="text-xs text-light-muted dark:text-dark-muted mt-0.5">
                            {comp.industry || 'Technology & Engineering'}
                          </p>
                          {comp.location && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {comp.location}
                            </p>
                          )}
                          <div className="mt-3">
                            <button
                              onClick={() => {
                                updateParam('category', 'people');
                                updateParam('company', comp.name);
                              }}
                              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                            >
                              Explore employees on Nexora <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* --- SKILLS CATEGORY VIEW --- */}
            {category === 'skills' && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted px-1">
                  Skills & Technical Domains ({skillsResults.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {skillsResults.map((skill) => (
                    <Card
                      key={skill.id}
                      className="p-4 hover:border-violet-500/60 transition-all cursor-pointer group"
                      onClick={() => {
                        updateParam('category', 'people');
                        updateParam('skill', skill.name);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
                          <Brain className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                            {skill.name}
                          </h4>
                          <p className="text-[11px] text-light-muted dark:text-dark-muted truncate">
                            {skill.category || 'General Technology'}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-light-muted group-hover:text-brand-500 transition-colors" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* --- HASHTAGS CATEGORY VIEW --- */}
            {category === 'hashtags' && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-light-muted dark:text-dark-muted px-1">
                  Hashtags & Topic Streams ({hashtagsResults.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {hashtagsResults.map((tag) => (
                    <Card
                      key={tag.tag}
                      className="p-4 hover:border-amber-500/60 transition-all cursor-pointer group"
                      onClick={() => navigate(`/feed?tag=${tag.tag}`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center font-bold">
                            #
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-light-text dark:text-dark-text group-hover:text-amber-500 transition-colors">
                              {tag.displayName}
                            </h4>
                            <p className="text-[10px] text-light-muted dark:text-dark-muted">
                              {tag.postCount} posts published
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-light-muted group-hover:text-amber-500 transition-colors" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
