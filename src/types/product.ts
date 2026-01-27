// src/types/product.types.ts

export interface Category {
  id: string
  name: string
  description?: string
  displayOrder?: number
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Product {
  id: string
  name: string
  description: string
  imageUrl: string
  price: string
  isAvailable: boolean
  category: {
    id: string
    name: string
  }
  createdAt: string
}

export interface ProductFormData {
  name: string
  description: string
  imageUrl: string
  price: number
  isAvailable: boolean
  categoryId: string
}

export interface PaginationMeta {
  itemsPerPage: number
  totalItems: number
  currentPage: number
  totalPages: number
  sortBy: string[][]
}

export interface ProductsResponse {
  data: Product[]
  meta: PaginationMeta
  links: {
    current: string
  }
}

export interface CategoriesResponse {
  data: Category[]
  meta: PaginationMeta
  links: {
    current: string
  }
}
