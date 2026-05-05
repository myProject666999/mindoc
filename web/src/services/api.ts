import { request } from '@/utils/request'
import {
  User,
  Project,
  Document,
  Comment,
  Role,
  Permission,
  PaginationResponse,
  ProjectMember,
  SiteConfig,
} from '@/types'

export const userApi = {
  getList: (params?: { page?: number; page_size?: number; keyword?: string }) =>
    request.get<PaginationResponse<User>>('/users', { params }),

  getById: (id: number) => request.get<User>(`/users/${id}`),

  create: (data: Partial<User> & { password: string }) =>
    request.post<User>('/users', data),

  update: (id: number, data: Partial<User>) => request.put<User>(`/users/${id}`, data),

  delete: (id: number) => request.delete(`/users/${id}`),

  updateProfile: (data: { nickname?: string; email?: string; avatar?: string }) =>
    request.put<User>('/profile', data),

  changePassword: (data: { old_password: string; new_password: string }) =>
    request.post('/profile/change-password', data),
}

export const projectApi = {
  getList: (params?: {
    page?: number
    page_size?: number
    keyword?: string
    visibility?: number
  }) => request.get<PaginationResponse<Project>>('/projects', { params }),

  getById: (id: number) => request.get<Project>(`/projects/${id}`),

  create: (data: Partial<Project>) => request.post<Project>('/projects', data),

  update: (id: number, data: Partial<Project>) =>
    request.put<Project>(`/projects/${id}`, data),

  delete: (id: number) => request.delete(`/projects/${id}`),

  regenerateToken: (id: number) =>
    request.post<{ access_token: string }>(`/projects/${id}/regenerate-token`),

  getMembers: (id: number) => request.get<ProjectMember[]>(`/projects/${id}/members`),

  addMember: (id: number, data: { user_id: number; role?: number }) =>
    request.post<ProjectMember>(`/projects/${id}/members`, data),

  updateMemberRole: (projectId: number, memberId: number, data: { role: number }) =>
    request.put<ProjectMember>(`/projects/${projectId}/members/${memberId}`, data),

  removeMember: (projectId: number, memberId: number) =>
    request.delete(`/projects/${projectId}/members/${memberId}`),
}

export const documentApi = {
  getTree: (projectId: number) => request.get(`/projects/${projectId}/documents/tree`),

  getList: (projectId: number, params?: { parent_id?: number }) =>
    request.get<Document[]>(`/projects/${projectId}/documents`, { params }),

  getById: (projectId: number, docId: number) =>
    request.get<Document>(`/projects/${projectId}/documents/${docId}`),

  create: (projectId: number, data: Partial<Document>) =>
    request.post<Document>(`/projects/${projectId}/documents`, data),

  update: (projectId: number, docId: number, data: Partial<Document>) =>
    request.put<Document>(`/projects/${projectId}/documents/${docId}`, data),

  delete: (projectId: number, docId: number) =>
    request.delete(`/projects/${projectId}/documents/${docId}`),
}

export const commentApi = {
  getByDocument: (projectId: number, docId: number, params?: { page?: number; page_size?: number }) =>
    request.get<PaginationResponse<Comment>>(`/projects/${projectId}/documents/${docId}/comments`, { params }),

  getMyComments: (params?: { page?: number; page_size?: number }) =>
    request.get<PaginationResponse<Comment>>('/comments/my', { params }),

  create: (projectId: number, docId: number, data: { content: string; parent_id?: number }) =>
    request.post<Comment>(`/projects/${projectId}/documents/${docId}/comments`, data),

  delete: (commentId: number) => request.delete(`/comments/${commentId}`),

  updateStatus: (commentId: number, status: number) =>
    request.put<Comment>(`/comments/${commentId}/status`, { status }),
}

export const roleApi = {
  getList: () => request.get<Role[]>('/roles'),

  getPermissions: () => request.get<Permission[]>('/roles/permissions'),

  getById: (id: number) => request.get<Role>(`/roles/${id}`),

  create: (data: Partial<Role>) => request.post<Role>('/roles', data),

  update: (id: number, data: Partial<Role>) => request.put<Role>(`/roles/${id}`, data),

  delete: (id: number) => request.delete(`/roles/${id}`),

  updatePermissions: (id: number, permissionIds: number[]) =>
    request.put(`/roles/${id}/permissions`, { permission_ids: permissionIds }),
}

export const configApi = {
  getSiteConfig: () => request.get<SiteConfig>('/config/site'),

  updateSiteConfig: (data: Partial<SiteConfig>) => request.put('/config/site', data),

  getLanguages: () =>
    request.get<{ code: string; name: string }[]>('/config/languages'),
}
