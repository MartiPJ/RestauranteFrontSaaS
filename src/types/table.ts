// src/types/table.ts

export enum TableStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  RESERVED = 'reserved',
}

export interface Table {
  id: string
  tableNumber: string
  capacity: number
  status: TableStatus
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CreateTableDTO {
  tableNumber: string
  capacity: number
  status?: TableStatus
}

export interface UpdateTableDTO {
  tableNumber?: string
  capacity?: number
  status?: TableStatus
}

// Para la respuesta paginada del backend
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    itemsPerPage: number
    totalItems: number
    currentPage: number
    totalPages: number
    sortBy: string[][]
  }
  links: {
    current: string
  }
}
