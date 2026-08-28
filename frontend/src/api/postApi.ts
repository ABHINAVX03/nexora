import { apiClient } from './client';
import { PostDto, LikeStatusDto, PostCreateInput } from '../types';

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
    const response = await apiClient.post<{ url: string }>('/posts/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
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
};
