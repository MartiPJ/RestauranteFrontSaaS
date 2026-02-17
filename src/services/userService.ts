// src/services/users.service.ts
import api from '@/utils/api'
import type { UsersResponse, FullUser, CreateUserPayload, UpdateUserPayload } from '@/types/user'

export const usersService = {
  async getUsers(page = 1, limit = 10): Promise<UsersResponse> {
    return api.get<UsersResponse>(
      `/api/auth/users?page=${page}&limit=${limit}&sortBy=createdAt:DESC`,
    )
  },

  async createUser(payload: CreateUserPayload): Promise<FullUser> {
    return api.post<FullUser>('/api/auth/register', payload)
  },

  async updateUser(id: string, payload: UpdateUserPayload): Promise<FullUser> {
    return api.patch<FullUser>(`/api/auth/users/${id}`, payload)
  },

  async deleteUser(id: string): Promise<void> {
    return api.delete<void>(`/api/auth/users/${id}`)
  },
}
