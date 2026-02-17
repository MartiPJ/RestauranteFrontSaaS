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
    userRoles: (state) => {
      if (!state.user) return []
      if (Array.isArray(state.user.roles)) return state.user.roles
      if (typeof state.user.role === 'string') return [state.user.role]
      return []
    },
    hasRole: (state) => (role: string) => {
      const roles = state.user?.roles
      if (Array.isArray(roles)) {
        return roles.some((r) => r.toLowerCase() === role.toLowerCase())
      }
      if (typeof state.user?.role === 'string') {
        return state.user.role.toLowerCase() === role.toLowerCase()
      }
      return false
    },
  },

  actions: {
    async initialize() {
      const token = localStorage.getItem('authToken')
      if (token) {
        this.token = token
        await this.checkAuth()
      }
    },

    async login(credentials: LoginCredentials) {
      this.isLoading = true
      this.error = null

      try {
        // Tipar la respuesta directamente como el objeto del backend
        const response = await api.post<any>('/api/auth/login', credentials)

        // La respuesta TIENE los datos del usuario en la raíz
        // y NO tiene una propiedad 'user'
        const userData = {
          id: response.id,
          email: response.email,
          name: response.name || response.email?.split('@')[0] || 'Usuario',
          // Asegurar que roles sea un array
          roles: Array.isArray(response.roles)
            ? response.roles
            : response.roles
              ? [response.roles]
              : [],
        }

        this.user = userData
        this.token = response.token
        this.isAuthenticated = true

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
        await api.post('/api/auth/logout', {}).catch((error) => {
          if (!(error instanceof SyntaxError)) {
            throw error
          }
        })
      } catch (error: any) {
        console.error('Error al cerrar sesión:', error)
      } finally {
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
        this.user = null
        this.token = null
        return false
      }

      this.token = token
      this.isLoading = true

      try {
        // Aquí también, la respuesta probablemente es directa, no { user }
        const response = await api.get<any>('/api/auth/check-status')

        // Construir usuario desde la respuesta directa
        const userData = {
          id: response.id,
          email: response.email,
          name: response.name || response.email?.split('@')[0] || 'Usuario',
          roles: Array.isArray(response.roles)
            ? response.roles
            : response.roles
              ? [response.roles]
              : [],
        }

        this.user = userData
        this.isAuthenticated = true
        return true
      } catch (error) {
        console.error('Error verificando autenticación:', error)
        this.user = null
        this.token = null
        this.isAuthenticated = false
        localStorage.removeItem('authToken')
        return false
      } finally {
        this.isLoading = false
      }
    },

    clearError() {
      this.error = null
    },
  },
})
