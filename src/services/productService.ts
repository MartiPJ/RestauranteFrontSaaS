// src/services/productService.ts
import api from '@/utils/api'
import type { ProductsResponse, ProductFormData, CategoriesResponse } from '@/types/product'

export interface ProductFilters {
  search?: string
  isAvailable?: boolean | null
  categoryId?: string | null
}

export const productService = {
  async getProducts(
    page: number = 1,
    limit: number = 20,
    filters: ProductFilters = {},
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy: 'createdAt:DESC',
    })

    if (filters.search && filters.search.trim()) {
      params.set('filter.name', `$ilike:${filters.search.trim()}`)
    }

    if (filters.isAvailable !== null && filters.isAvailable !== undefined) {
      params.set('filter.isAvailable', String(filters.isAvailable))
    }

    if (filters.categoryId) {
      params.set('filter.category.id', filters.categoryId)
    }

    return api.get<ProductsResponse>(`/api/products?${params.toString()}`)
  },

  async getProduct(id: string) {
    return api.get(`/api/products/${id}`)
  },

  async createProduct(data: ProductFormData) {
    return api.post('/api/products', data)
  },

  async updateProduct(id: string, data: Partial<ProductFormData>) {
    return api.patch(`/api/products/${id}`, data)
  },

  async deleteProduct(id: string) {
    return api.delete(`/api/products/${id}`)
  },

  async getCategories(): Promise<CategoriesResponse> {
    return api.get<CategoriesResponse>('/api/categories?limit=100')
  },
}
