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
    let endpoint = `/api/products?page=${page}&limit=${limit}&sortBy=createdAt:DESC`

    if (filters.search && filters.search.trim()) {
      endpoint += `&search=${encodeURIComponent(filters.search.trim())}`
    }

    if (filters.isAvailable !== null && filters.isAvailable !== undefined) {
      endpoint += `&isAvailable=${filters.isAvailable}`
    }

    if (filters.categoryId) {
      endpoint += `&categoryId=${filters.categoryId}`
    }

    return api.get<ProductsResponse>(endpoint)
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
