// Strict Backend DTO Models for Nexora Microservices

export interface UserDto {
  id: number;
  name: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
}

export interface UserProfileUpdateRequest {
  name?: string;
  headline?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  coverUrl?: string;
  role?: string;
  skills?: string[];
  connectionsCount?: number;
}

export interface UserPresenceDto {
  userId: number;
  isActive: boolean;
  lastActiveAt?: string;
}

export interface PollOptionDto {
  id: number;
  optionText: string;
  votesCount: number;
  votePercentage: number;
}

export interface PollDto {
  id: number;
  postId?: number;
  question: string;
  options: PollOptionDto[];
  totalVotes: number;
  userVotedOptionId?: number | null;
  hasVoted?: boolean;
  createdAt: string;
}

export interface PollCreateInput {
  question: string;
  options: string[];
}

export interface PostDto {
  id: number;
  content: string;
  mediaUrl?: string;
  userId: number;
  poll?: PollDto;
  createdAt: string;
}

export interface PostCreateInput {
  content: string;
  mediaUrl?: string;
  poll?: PollCreateInput;
}

export interface Post {
  id: number;
  content: string;
  mediaUrl?: string;
  userId: number;
  poll?: PollDto;
  createdAt: string;
  authorName?: string;
  authorEmail?: string;
  authorHeadline?: string;
  authorAvatar?: string;
  hasLiked?: boolean;
  likesCount?: number;
}

export interface LikeStatusDto {
  postId: number;
  hasLiked: boolean;
  likesCount: number;
}

export interface CommentDto {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: string;
  authorName?: string;
}

export interface CommentCreateInput {
  content: string;
}

export interface ChatMessageDto {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  isRead?: boolean;
  read?: boolean;
  createdAt: string;
}

export interface ConversationSummaryDto {
  otherUserId: number;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isPartnerActive?: boolean;
  partnerLastSeen?: string;
}

export interface SendMessageRequest {
  recipientId: number;
  content: string;
}

export interface Person {
  userId: number;
  username: string;
  name?: string;
  email?: string;
}

export type ConnectionStatus =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'connected';

export interface NotificationDto {
  id: number;
  userId: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}
