// src/types/auth.ts
export interface User {
  id: string
  email: string
  name: string
  roles?: string[]
  role?: string
  tokenVersion?: number // Si tu backend incluye esto
}

export interface LoginCredentials {
  email: string
  password: string
}

// La respuesta del backend es directamente el usuario + token
export interface AuthResponse {
  id: string
  email: string
  name?: string
  roles: string[] | string
  token: string
  tokenVersion?: number
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
