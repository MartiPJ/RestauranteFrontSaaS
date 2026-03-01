// src/stores/users.ts
import { defineStore } from 'pinia'
import type {
  UsersState,
  FullUser,
  CreateUserPayload,
  UpdateUserPayload,
  PaginationMeta,
} from '@/types/user'
import { usersService } from '@/services/userService'

export const useUsersStore = defineStore('users', {
  state: (): UsersState => ({
    users: [],
    meta: null,
    isLoading: false,
    error: null,
    currentPage: 1,
    pageSize: 10,
  }),

  getters: {
    totalUsers: (state) => state.meta?.totalItems ?? 0,
    totalPages: (state) => state.meta?.totalPages ?? 0,
  },

  actions: {
    async fetchUsers(page?: number) {
      this.isLoading = true
      this.error = null
      if (page !== undefined) this.currentPage = page

      try {
        const response = await usersService.getUsers(this.currentPage, this.pageSize)
        this.users = response.data
        this.meta = response.meta
      } catch (error: any) {
        this.error = error.message || 'Error al cargar los usuarios'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async createUser(payload: CreateUserPayload) {
      this.isLoading = true
      this.error = null
      try {
        const newUser = await usersService.createUser(payload)
        await this.fetchUsers(1)
        return newUser
      } catch (error: any) {
        this.error = error.message || 'Error al crear el usuario'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async updateUser(id: string, payload: UpdateUserPayload & { isActive?: boolean }) {
      this.isLoading = true
      this.error = null
      try {
        const updated = await usersService.updateUser(id, payload)
        const idx = this.users.findIndex((u) => u.id === id)
        if (idx !== -1) this.users[idx] = updated
        return updated
      } catch (error: any) {
        this.error = error.message || 'Error al actualizar el usuario'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Versión anterior del método toggleUserActive, que usaba updateUser sin isActive
    async toggleUserActive(id: string, isActive: boolean) {
      this.isLoading = true
      this.error = null
      try {
        const user = this.users.find((u) => u.id === id)
        if (!user) throw new Error('Usuario no encontrado')

        const updated = await usersService.updateUser(id, {
          name: user.name,
          email: user.email,
          roles: user.roles,
          isActive,
        })
        const idx = this.users.findIndex((u) => u.id === id)
        if (idx !== -1) this.users[idx] = updated
        return updated
      } catch (error: any) {
        this.error = error.message || 'Error al actualizar el usuario'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // async deleteUser(id: string) {
    //   this.isLoading = true
    //   this.error = null
    //   try {
    //     await usersService.deleteUser(id)
    //     this.users = this.users.filter((u) => u.id !== id)
    //     if (this.meta) {
    //       this.meta.totalItems--
    //       if (this.users.length === 0 && this.currentPage > 1) {
    //         await this.fetchUsers(this.currentPage - 1)
    //       }
    //     }
    //   } catch (error: any) {
    //     this.error = error.message || 'Error al eliminar el usuario'
    //     throw error
    //   } finally {
    //     this.isLoading = false
    //   }
    // },

    clearError() {
      this.error = null
    },
  },
})
