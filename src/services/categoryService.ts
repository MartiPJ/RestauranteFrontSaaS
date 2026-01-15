// src/services/categoryService.ts
import api from '@/utils/api'
import type {
  CategoriesResponse,
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
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
}
