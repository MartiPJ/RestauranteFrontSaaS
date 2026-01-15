// src/types/category.ts
export interface Category {
  id: string
  name: string
  description: string
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
  displayOrder: number
  isActive: boolean
}

export interface UpdateCategoryDto {
  name?: string
  description?: string
  displayOrder?: number
  isActive?: boolean
}
