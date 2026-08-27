import { apiClient } from './client';
import { CommentDto, CommentCreateInput } from '../types';

export const commentApi = {
  getComments: async (postId: number): Promise<CommentDto[]> => {
    const response = await apiClient.get<CommentDto[]>(`/posts/${postId}/comments`);
    return response.data;
  },

  addComment: async (postId: number, data: CommentCreateInput): Promise<CommentDto> => {
    const response = await apiClient.post<CommentDto>(`/posts/${postId}/comments`, data);
    return response.data;
  },

  deleteComment: async (postId: number, commentId: number): Promise<void> => {
    await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
  },
};
