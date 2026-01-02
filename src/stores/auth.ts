// src/stores/auth.ts
import { defineStore } from 'pinia'
import type { AuthState, LoginCredentials, AuthResponse } from '@/types/auth'
import api from '@/utils/api'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem('authToken'),
    isAuthenticated: false,
    isLoading: false,
    error: null,
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
  },

  actions: {
    async login(credentials: LoginCredentials) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.post<AuthResponse>('/auth/login', credentials)

        this.token = response.token
        this.user = response.user
        this.isAuthenticated = true

        // Guardar token en localStorage
        localStorage.setItem('authToken', response.token)

        return response
      } catch (error: any) {
        this.error = error.message || 'Error al iniciar sesión'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        // Opcional: llamar al endpoint de logout en el backend
        await api.post('/auth/logout', {})
      } catch (error) {
        console.error('Error al cerrar sesión:', error)
      } finally {
        // Limpiar estado local
        this.user = null
        this.token = null
        this.isAuthenticated = false
        localStorage.removeItem('authToken')
      }
    },

    async checkAuth() {
      const token = localStorage.getItem('authToken')

      if (!token) {
        this.isAuthenticated = false
        return false
      }

      try {
        const response = await api.get<{ user: any }>('/auth/me')
        this.user = response.user
        this.isAuthenticated = true
        return true
      } catch (error) {
        this.logout()
        return false
      }
    },

    clearError() {
      this.error = null
    },
  },
})
