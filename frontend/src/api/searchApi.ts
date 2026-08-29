import { apiClient } from './client';
import {
  SearchUserDto,
  PostDto,
  CompanyDto,
  SkillDto,
  HashtagDto,
  SearchSuggestionsDto,
} from '../types';

export interface PeopleSearchParams {
  q?: string;
  location?: string;
  company?: string;
  skill?: string;
  page?: number;
  size?: number;
}

export interface PostSearchParams {
  q?: string;
  sort?: 'recent' | 'popular';
  page?: number;
  size?: number;
}

export const searchApi = {
  // 1. Unified Real-Time Suggestions
  getSuggestions: async (query: string): Promise<SearchSuggestionsDto> => {
    if (!query || !query.trim()) {
      return { people: [], companies: [], skills: [], hashtags: [], posts: [] };
    }

    const trimmed = query.trim();

    try {
      const [userSuggestionsRes, postSuggestionsRes] = await Promise.allSettled([
        apiClient.get<SearchSuggestionsDto>('/users/search/suggestions', { params: { q: trimmed } }),
        apiClient.get<{ hashtags: HashtagDto[]; posts: any[] }>('/posts/search/suggestions', { params: { q: trimmed } }),
      ]);

      const userSug = userSuggestionsRes.status === 'fulfilled' ? userSuggestionsRes.value.data : { people: [], companies: [], skills: [] };
      const postSug = postSuggestionsRes.status === 'fulfilled' ? postSuggestionsRes.value.data : { hashtags: [], posts: [] };

      return {
        people: userSug.people || [],
        companies: userSug.companies || [],
        skills: userSug.skills || [],
        hashtags: postSug.hashtags || [],
        posts: postSug.posts || [],
      };
    } catch {
      return { people: [], companies: [], skills: [], hashtags: [], posts: [] };
    }
  },

  // 2. People Search
  searchPeople: async (params: PeopleSearchParams): Promise<SearchUserDto[]> => {
    const response = await apiClient.get<SearchUserDto[]>('/users/search', { params });
    return response.data;
  },

  // 3. Posts Search
  searchPosts: async (params: PostSearchParams): Promise<PostDto[]> => {
    const response = await apiClient.get<PostDto[]>('/posts/search', { params });
    return response.data;
  },

  // 4. Companies Search
  searchCompanies: async (query?: string, industry?: string, page = 0, size = 20): Promise<CompanyDto[]> => {
    const params: Record<string, any> = { page, size };
    if (query && query.trim()) params.q = query.trim();
    if (industry && industry.trim()) params.industry = industry.trim();
    const response = await apiClient.get<CompanyDto[]>('/users/companies/search/advanced', { params });
    return response.data;
  },

  // 5. Skills Search
  searchSkills: async (query?: string, page = 0, size = 20): Promise<SkillDto[]> => {
    const params: Record<string, any> = { page, size };
    if (query && query.trim()) params.q = query.trim();
    const response = await apiClient.get<SkillDto[]>('/users/skills/search/advanced', { params });
    return response.data;
  },

  // 6. Hashtags Search
  searchHashtags: async (query?: string): Promise<HashtagDto[]> => {
    const params = query && query.trim() ? { q: query.trim() } : {};
    const response = await apiClient.get<HashtagDto[]>('/posts/hashtags/search', { params });
    return response.data;
  },
};
