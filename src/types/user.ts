// src/types/users.ts

export enum ValidRoles {
  admin = 'admin',
  manager = 'manager',
  waiter = 'waiter',
  cashier = 'cashier',
}

export const RoleLabels: Record<ValidRoles, string> = {
  [ValidRoles.admin]: 'Administrador',
  [ValidRoles.manager]: 'Manager',
  [ValidRoles.waiter]: 'Mesero',
  [ValidRoles.cashier]: 'Cajero',
}

export const RoleColors: Record<ValidRoles, string> = {
  [ValidRoles.admin]: '#051b3a',
  [ValidRoles.manager]: '#609abb',
  [ValidRoles.waiter]: '#5d7a90',
  [ValidRoles.cashier]: '#b4cbd8',
}

export interface FullUser {
  id: string
  name: string
  email: string
  roles: ValidRoles[]
  tokenVersion: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface PaginationMeta {
  itemsPerPage: number
  totalItems: number
  currentPage: number
  totalPages: number
  sortBy: [string, string][]
}

export interface PaginationLinks {
  current: string
  first?: string
  prev?: string
  next?: string
  last?: string
}

export interface UsersResponse {
  data: FullUser[]
  meta: PaginationMeta
  links: PaginationLinks
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  roles: ValidRoles[]
}

export interface UpdateUserPayload {
  name: string
  email: string
  roles: ValidRoles[]
}

export interface UsersState {
  users: FullUser[]
  meta: PaginationMeta | null
  isLoading: boolean
  error: string | null
  currentPage: number
  pageSize: number
}
