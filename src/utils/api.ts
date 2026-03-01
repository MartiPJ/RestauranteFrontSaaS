// src/utils/api.ts
const API_URL = import.meta.env.VITE_API_URL

function getAuthToken(): string | null {
  return localStorage.getItem('authToken')
}
async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken()

  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
    ...options,
  })

  if (response.status === 401) {
    localStorage.removeItem('authToken')
    window.location.href = '/login'
    throw new Error('Sesión expirada o usuario inactivo')
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(data?.message || `Error en la petición: ${response.status}`)
  }

  return data as T
}

export default {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  patch: <T>(endpoint: string, body: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
}
