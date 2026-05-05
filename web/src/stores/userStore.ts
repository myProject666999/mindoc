import { create } from 'zustand'
import { User, LoginRequest, LoginResponse, RegisterRequest } from '@/types'
import { request } from '@/utils/request'

interface UserState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean

  login: (params: LoginRequest) => Promise<LoginResponse>
  register: (params: RegisterRequest) => Promise<LoginResponse>
  logout: () => void
  fetchCurrentUser: () => Promise<User>
  setUser: (user: User | null) => void
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,

  login: async (params: LoginRequest) => {
    set({ loading: true })
    try {
      const data = await request.post<LoginResponse>('/auth/login', params)
      const { token, user } = data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, token, isAuthenticated: true, loading: false })
      return data
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  register: async (params: RegisterRequest) => {
    set({ loading: true })
    try {
      const data = await request.post<LoginResponse>('/auth/register', params)
      const { token, user } = data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, token, isAuthenticated: true, loading: false })
      return data
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  fetchCurrentUser: async () => {
    set({ loading: true })
    try {
      const user = await request.get<User>('/auth/me')
      localStorage.setItem('user', JSON.stringify(user))
      set({ user, loading: false })
      return user
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  setUser: (user: User | null) => {
    set({ user })
  },
}))
