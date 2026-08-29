// Strict Backend DTO Models for Nexora Microservices

export interface UserDto {
  id: number;
  name: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

export interface UserProfileUpdateRequest {
  name?: string;
  headline?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  headline?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  bannerUrl?: string;
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
  mediaUrls?: string[];
  images?: string[];
  repostOfPostId?: number;
  repostedPost?: PostDto;
  userId: number;
  poll?: PollDto;
  createdAt: string;
}

export interface PostCreateInput {
  content: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  images?: string[];
  repostOfPostId?: number;
  poll?: PollCreateInput;
}

export interface Post {
  id: number;
  content: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  images?: string[];
  repostOfPostId?: number;
  repostedPost?: Post;
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
  readAt?: string;
  relatedEntityId?: number;
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

// --- Experience, Education, Companies, Institutions & Skills Models ---

export interface CompanyDto {
  id: number;
  name: string;
  domain?: string;
  logoUrl?: string;
  industry?: string;
  location?: string;
}

export interface InstitutionDto {
  id: number;
  name: string;
  shortName?: string;
  logoUrl?: string;
  location?: string;
}

export interface ExperienceDto {
  id: number;
  userId: number;
  companyId?: number;
  companyName: string;
  companyLogoUrl?: string;
  isCustomCompany?: boolean;
  title: string;
  employmentType?: string;
  location?: string;
  startDate: string;
  endDate?: string | null;
  isCurrentlyWorking?: boolean;
  description?: string;
  skills?: string;
  createdAt?: string;
}

export interface ExperienceCreateInput {
  companyId?: number | null;
  companyName: string;
  isCustomCompany?: boolean;
  title: string;
  employmentType?: string;
  location?: string;
  startDate: string;
  endDate?: string | null;
  isCurrentlyWorking?: boolean;
  description?: string;
  skills?: string;
}

export interface EducationDto {
  id: number;
  userId: number;
  institutionId?: number;
  institutionName: string;
  institutionShortName?: string;
  institutionLogoUrl?: string;
  isCustomInstitution?: boolean;
  degree: string;
  fieldOfStudy?: string;
  startYear: number;
  endYear?: number | null;
  grade?: string;
  description?: string;
  createdAt?: string;
}

export interface EducationCreateInput {
  institutionId?: number | null;
  institutionName: string;
  isCustomInstitution?: boolean;
  degree: string;
  fieldOfStudy?: string;
  startYear: number;
  endYear?: number | null;
  grade?: string;
  description?: string;
}

export interface SkillDto {
  id: number;
  name: string;
  category?: string;
}

export interface EndorserSummaryDto {
  id: number;
  userId: number;
  name: string;
  headline?: string;
  avatarUrl?: string;
  endorsedAt?: string;
}

export interface UserSkillDto {
  id: number;
  userId: number;
  skillId?: number;
  skillName: string;
  category?: string;
  endorsementCount: number;
  isEndorsedByViewer?: boolean;
  topEndorsers: EndorserSummaryDto[];
  displayOrder?: number;
}

export interface AddSkillInput {
  skillId?: number | null;
  skillName: string;
}

