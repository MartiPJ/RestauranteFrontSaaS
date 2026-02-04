// src/stores/categoryStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { categoryService } from '@/services/categoryService'
import type { Category, CategoryMeta, Product } from '@/types/category'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([])
  const meta = ref<CategoryMeta | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const currentProducts = ref<Product[]>([])
  const currentPage = ref(1)
  const itemsPerPage = ref(20)
  const searchQuery = ref('')

  const sortedCategories = computed(() => {
    return [...categories.value].sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder
      }
      return a.name.localeCompare(b.name)
    })
  })

  async function fetchCategories() {
    loading.value = true
    error.value = null

    try {
      const response = await categoryService.getCategories(
        currentPage.value,
        itemsPerPage.value,
        searchQuery.value,
      )
      categories.value = response.data
      meta.value = response.meta
    } catch (err: any) {
      error.value = err.message || 'Error al cargar las categorías'
      categories.value = []
      meta.value = null
    } finally {
      loading.value = false
    }
  }

  async function fetchProductsByCategory(categoryId: string) {
    loading.value = true
    error.value = null
    try {
      currentProducts.value = await categoryService.getProductsByCategory(categoryId)
      return currentProducts.value
    } catch (e: any) {
      error.value = e.message || 'Error al cargar los productos'
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearProducts() {
    currentProducts.value = []
  }

  async function createCategory(data: {
    name: string
    description: string
    displayOrder: number
    isActive: boolean
  }) {
    loading.value = true
    error.value = null

    try {
      await categoryService.createCategory(data)
      await fetchCategories()
    } catch (err: any) {
      error.value = err.message || 'Error al crear la categoría'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateCategory(
    id: string,
    data: {
      name?: string
      description?: string
      displayOrder?: number
      isActive?: boolean
    },
  ) {
    loading.value = true
    error.value = null

    try {
      await categoryService.updateCategory(id, data)
      await fetchCategories()
    } catch (err: any) {
      error.value = err.message || 'Error al actualizar la categoría'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteCategory(id: string) {
    loading.value = true
    error.value = null

    try {
      await categoryService.deleteCategory(id)
      await fetchCategories()
    } catch (err: any) {
      error.value = err.message || 'Error al eliminar la categoría'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      await categoryService.toggleActive(id, isActive)
      await fetchCategories()
    } catch (err: any) {
      error.value = err.message || 'Error al cambiar el estado'
      throw err
    }
  }

  function setPage(page: number) {
    currentPage.value = page
    fetchCategories()
  }

  function setItemsPerPage(items: number) {
    itemsPerPage.value = items
    currentPage.value = 1
    fetchCategories()
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
    currentPage.value = 1
    fetchCategories()
  }

  function clearSearch() {
    searchQuery.value = ''
    currentPage.value = 1
    fetchCategories()
  }

  return {
    categories,
    sortedCategories,
    meta,
    loading,
    error,
    currentPage,
    itemsPerPage,
    searchQuery,
    currentProducts,
    fetchCategories,
    fetchProductsByCategory,
    clearProducts,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleActive,
    setPage,
    setItemsPerPage,
    setSearchQuery,
    clearSearch,
  }
})
