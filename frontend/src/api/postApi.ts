import { apiClient } from './client';
import { PostDto, LikeStatusDto, PostCreateInput, PollDto } from '../types';

export const postApi = {
  getFeed: async (): Promise<PostDto[]> => {
    const response = await apiClient.get<PostDto[]>('/posts/feed');
    return response.data;
  },

  getUserPosts: async (userId: number): Promise<PostDto[]> => {
    const response = await apiClient.get<PostDto[]>(`/posts/users/${userId}/allPosts`);
    return response.data;
  },

  getPostById: async (postId: number): Promise<PostDto> => {
    const response = await apiClient.get<PostDto>(`/posts/${postId}`);
    return response.data;
  },

  uploadMedia: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    // Let browser and Axios manage boundary injection automatically
    const response = await apiClient.post<{ url: string }>('/posts/media/upload', formData);
    return response.data;
  },

  uploadMultipleMedia: async (files: File[]): Promise<string[]> => {
    if (!files || files.length === 0) return [];

    // Try batch upload endpoint first
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      const response = await apiClient.post<{ urls?: string[]; url?: string }>('/posts/media/upload-multiple', formData);
      if (response.data?.urls && Array.isArray(response.data.urls) && response.data.urls.length === files.length) {
        return response.data.urls;
      }
      if (response.data?.urls && Array.isArray(response.data.urls) && response.data.urls.length > 0) {
        return response.data.urls;
      }
    } catch (err) {
      console.warn('Batch upload endpoint threw error, executing parallel individual uploads', err);
    }

    // Parallel individual uploads guarantees all files are uploaded individually without loss
    const uploadPromises = files.map(async (file) => {
      const singleFormData = new FormData();
      singleFormData.append('file', file);
      const res = await apiClient.post<{ url: string }>('/posts/media/upload', singleFormData);
      return res.data.url;
    });

    const results = await Promise.all(uploadPromises);
    return results.filter((u): u is string => typeof u === 'string' && u.trim().length > 0);
  },

  createPost: async (data: PostCreateInput): Promise<PostDto> => {
    const response = await apiClient.post<PostDto>('/posts', data);
    return response.data;
  },

  updatePost: async (postId: number, data: PostCreateInput): Promise<PostDto> => {
    const response = await apiClient.put<PostDto>(`/posts/${postId}`, data);
    return response.data;
  },

  deletePost: async (postId: number): Promise<void> => {
    await apiClient.delete(`/posts/${postId}`);
  },

  toggleLike: async (postId: number): Promise<LikeStatusDto> => {
    const response = await apiClient.post<LikeStatusDto>(`/likes/${postId}`);
    return response.data;
  },

  likePost: async (postId: number): Promise<LikeStatusDto> => {
    const response = await apiClient.post<LikeStatusDto>(`/likes/${postId}`);
    return response.data;
  },

  unlikePost: async (postId: number): Promise<LikeStatusDto> => {
    const response = await apiClient.delete<LikeStatusDto>(`/likes/${postId}`);
    return response.data;
  },

  getLikeStatus: async (postId: number): Promise<LikeStatusDto> => {
    const response = await apiClient.get<LikeStatusDto>(`/likes/${postId}/status`);
    return response.data;
  },

  toggleBookmark: async (postId: number): Promise<{ bookmarked: boolean; postId: number }> => {
    const response = await apiClient.post<{ bookmarked: boolean; postId: number }>(`/posts/${postId}/bookmark`);
    return response.data;
  },

  getBookmarkedPosts: async (): Promise<PostDto[]> => {
    const response = await apiClient.get<PostDto[]>('/posts/bookmarks');
    return response.data;
  },

  isPostBookmarked: async (postId: number): Promise<boolean> => {
    const response = await apiClient.get<{ bookmarked: boolean }>(`/posts/${postId}/is-bookmarked`);
    return response.data.bookmarked;
  },

  votePoll: async (pollId: number, optionId: number): Promise<PollDto> => {
    const response = await apiClient.post<PollDto>(`/posts/polls/${pollId}/vote/${optionId}`);
    return response.data;
  },

  getPoll: async (postId: number): Promise<PollDto> => {
    const response = await apiClient.get<PollDto>(`/posts/${postId}/poll`);
    return response.data;
  },
};
