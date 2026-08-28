import { apiClient } from './client';
import {
  CompanyDto,
  InstitutionDto,
  ExperienceDto,
  ExperienceCreateInput,
  EducationDto,
  EducationCreateInput,
  SkillDto,
  UserSkillDto,
  EndorserSummaryDto,
  AddSkillInput,
} from '../types';

export const profileApi = {
  // --- Companies & Institutions Autocomplete ---
  searchCompanies: async (query?: string): Promise<CompanyDto[]> => {
    const params = query && query.trim() ? { query: query.trim() } : {};
    const response = await apiClient.get<CompanyDto[]>('/users/companies/search', { params });
    return response.data;
  },

  searchInstitutions: async (query?: string): Promise<InstitutionDto[]> => {
    const params = query && query.trim() ? { query: query.trim() } : {};
    const response = await apiClient.get<InstitutionDto[]>('/users/institutions/search', { params });
    return response.data;
  },

  searchSkillsCatalog: async (query?: string): Promise<SkillDto[]> => {
    const params = query && query.trim() ? { query: query.trim() } : {};
    const response = await apiClient.get<SkillDto[]>('/users/skills/search', { params });
    return response.data;
  },

  // --- Experiences ---
  getUserExperiences: async (userId: number): Promise<ExperienceDto[]> => {
    const response = await apiClient.get<ExperienceDto[]>(`/users/${userId}/experiences`);
    return response.data;
  },

  createExperience: async (data: ExperienceCreateInput): Promise<ExperienceDto> => {
    const response = await apiClient.post<ExperienceDto>('/users/me/experiences', data);
    return response.data;
  },

  updateExperience: async (id: number, data: ExperienceCreateInput): Promise<ExperienceDto> => {
    const response = await apiClient.put<ExperienceDto>(`/users/me/experiences/${id}`, data);
    return response.data;
  },

  deleteExperience: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/me/experiences/${id}`);
  },

  // --- Educations ---
  getUserEducations: async (userId: number): Promise<EducationDto[]> => {
    const response = await apiClient.get<EducationDto[]>(`/users/${userId}/educations`);
    return response.data;
  },

  createEducation: async (data: EducationCreateInput): Promise<EducationDto> => {
    const response = await apiClient.post<EducationDto>('/users/me/educations', data);
    return response.data;
  },

  updateEducation: async (id: number, data: EducationCreateInput): Promise<EducationDto> => {
    const response = await apiClient.put<EducationDto>(`/users/me/educations/${id}`, data);
    return response.data;
  },

  deleteEducation: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/me/educations/${id}`);
  },

  // --- Skills & Endorsements ---
  getUserSkills: async (userId: number): Promise<UserSkillDto[]> => {
    const response = await apiClient.get<UserSkillDto[]>(`/users/${userId}/skills`);
    return response.data;
  },

  addSkill: async (data: AddSkillInput): Promise<UserSkillDto> => {
    const response = await apiClient.post<UserSkillDto>('/users/me/skills', data);
    return response.data;
  },

  removeSkill: async (userSkillId: number): Promise<void> => {
    await apiClient.delete(`/users/me/skills/${userSkillId}`);
  },

  endorseSkill: async (targetUserId: number, userSkillId: number): Promise<UserSkillDto> => {
    const response = await apiClient.post<UserSkillDto>(`/users/${targetUserId}/skills/${userSkillId}/endorse`);
    return response.data;
  },

  removeEndorsement: async (targetUserId: number, userSkillId: number): Promise<UserSkillDto> => {
    const response = await apiClient.delete<UserSkillDto>(`/users/${targetUserId}/skills/${userSkillId}/endorse`);
    return response.data;
  },

  getSkillEndorsers: async (targetUserId: number, userSkillId: number): Promise<EndorserSummaryDto[]> => {
    const response = await apiClient.get<EndorserSummaryDto[]>(`/users/${targetUserId}/skills/${userSkillId}/endorsers`);
    return response.data;
  },
};
