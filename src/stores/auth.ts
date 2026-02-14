// src/stores/auth.ts
import { defineStore } from 'pinia'
import type { AuthState, LoginCredentials, AuthResponse } from '@/types/auth'
import api from '@/utils/api'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: localStorage.getItem('authToken'),
    isAuthenticated: false, // Esto debe actualizarse si hay token
    isLoading: false,
    error: null,
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
  },

  actions: {
    //Inicializar el estado al crear el store
    initialize() {
      const token = localStorage.getItem('authToken')
      if (token) {
        this.token = token
        // No marcar como autenticado hasta verificar con el backend
        this.checkAuth()
      }
    },

    async login(credentials: LoginCredentials) {
      this.isLoading = true
      this.error = null

      try {
        const response = await api.post<AuthResponse>('/api/auth/login', credentials)

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
        await api.post('/api/auth/logout', {}).catch((error) => {
          // Ignorar errores de parseo JSON (respuesta de texto)
          if (!(error instanceof SyntaxError)) {
            throw error
          }
        })
      } catch (error: any) {
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
        this.user = null
        this.token = null
        return false
      }

      // Si ya tenemos token pero no hemos verificado
      this.token = token
      this.isLoading = true

      try {
        const response = await api.get<{ user: any }>('/api/auth/check-status')
        this.user = response.user
        this.isAuthenticated = true
        return true
      } catch (error) {
        console.error('Error verificando autenticación:', error)
        // Si hay error, limpiar todo
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
