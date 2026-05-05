export interface User {
  id: number
  username: string
  email: string
  nickname: string
  avatar: string
  role_id: number
  role?: Role
  status: number
  created_at: string
}

export interface Role {
  id: number
  name: string
  display_name: string
  description: string
  permissions?: Permission[]
}

export interface Permission {
  id: number
  name: string
  display_name: string
  module: string
}

export interface Project {
  id: number
  name: string
  description: string
  icon: string
  visibility: number
  access_token?: string
  owner_id: number
  owner?: User
  sort_order: number
  status: number
  created_at: string
  members?: ProjectMember[]
}

export interface ProjectMember {
  id: number
  project_id: number
  user_id: number
  role: number
  user?: User
}

export interface Document {
  id: number
  title: string
  content: string
  content_type: string
  project_id: number
  parent_id: number
  path: string
  sort_order: number
  creator_id: number
  creator?: User
  status: number
  created_at: string
  updated_at: string
}

export interface Comment {
  id: number
  content: string
  document_id: number
  user_id: number
  user?: User
  parent_id: number
  status: number
  created_at: string
}

export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
}

export interface PaginationResponse<T> {
  page: number
  page_size: number
  total: number
  list: T[]
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  nickname?: string
}

export interface SiteConfig {
  name: string
  language: string
  anonymous_access: boolean
  enable_captcha: boolean
}
