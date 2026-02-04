// src/types/category.ts
export interface Category {
  id: string
  name: string
  description: string
  imageUrl?: string
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CategoryMeta {
  itemsPerPage: number
  totalItems: number
  currentPage: number
  totalPages: number
  sortBy: [string, string][]
}

export interface CategoryLinks {
  current: string
  first?: string
  previous?: string
  next?: string
  last?: string
}

export interface CategoriesResponse {
  data: Category[]
  meta: CategoryMeta
  links: CategoryLinks
}

export interface CreateCategoryDto {
  name: string
  description: string
  imageUrl?: string
  displayOrder: number
  isActive: boolean
}

export interface UpdateCategoryDto {
  name?: string
  description?: string
  imageUrl?: string
  displayOrder?: number
  isActive?: boolean
}

export interface Product {
  id: string
  name: string
  description?: string
  imageUrl?: string
  price: string
  isAvailable: boolean
  categoryId: string
  createdAt?: string
  updatedAt?: string
}

export interface CategoryWithProducts extends Category {
  products?: Product[]
}
