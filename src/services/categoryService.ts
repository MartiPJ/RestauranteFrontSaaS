// src/services/categoryService.ts
import api from '@/utils/api'
import type {
  CategoriesResponse,
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  Product,
} from '@/types/category'

export const categoryService = {
  async getCategories(
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<CategoriesResponse> {
    let endpoint = `/api/categories?page=${page}&limit=${limit}&sortBy=displayOrder:ASC&sortBy=name:ASC`

    if (search && search.trim()) {
      endpoint += `&search=${encodeURIComponent(search.trim())}`
    }

    return api.get<CategoriesResponse>(endpoint)
  },

  async getCategory(id: string): Promise<Category> {
    return api.get<Category>(`/api/categories/${id}`)
  },

  async createCategory(data: CreateCategoryDto): Promise<Category> {
    return api.post<Category>('/api/categories', data)
  },

  async updateCategory(id: string, data: UpdateCategoryDto): Promise<Category> {
    return api.patch<Category>(`/api/categories/${id}`, data)
  },

  async deleteCategory(id: string): Promise<void> {
    return api.delete<void>(`/api/categories/${id}`)
  },

  async toggleActive(id: string, isActive: boolean): Promise<Category> {
    return api.patch<Category>(`/api/categories/${id}`, { isActive })
  },

  // Obtener una categoría por ID
  async getCategoryById(id: string): Promise<Category> {
    try {
      return await api.get<Category>(`/api/categories/${id}`)
    } catch (error) {
      console.error('Error al obtener categoría:', error)
      throw error
    }
  },

  // Obtener productos de una categoría
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
      return await api.get<Product[]>(`/api/categories/${categoryId}/products`)
    } catch (error) {
      console.error('Error al obtener productos de categoría:', error)
      throw error
    }
  },
}
