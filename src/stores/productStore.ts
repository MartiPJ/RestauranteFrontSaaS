// src/stores/productStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { productService } from '@/services/productService'
import type { Product, Category, ProductFormData } from '@/types/product'

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([])
  const categories = ref<Category[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Paginación
  const currentPage = ref(1)
  const itemsPerPage = ref(20)
  const totalItems = ref(0)
  const totalPages = ref(0)

  // Computed
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)

  // Acciones
  async function fetchProducts() {
    loading.value = true
    error.value = null
    try {
      const response = await productService.getProducts(currentPage.value, itemsPerPage.value)
      products.value = response.data
      totalItems.value = response.meta.totalItems
      totalPages.value = response.meta.totalPages
      currentPage.value = response.meta.currentPage
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar productos'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchCategories() {
    try {
      const response = await productService.getCategories()
      categories.value = response.data.filter((cat) => cat.isActive)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar categorías'
      throw err
    }
  }

  async function createProduct(data: ProductFormData) {
    loading.value = true
    error.value = null
    try {
      await productService.createProduct(data)
      await fetchProducts()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al crear producto'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProduct(id: string, data: Partial<ProductFormData>) {
    loading.value = true
    error.value = null
    try {
      await productService.updateProduct(id, data)
      await fetchProducts()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al actualizar producto'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteProduct(id: string) {
    loading.value = true
    error.value = null
    try {
      await productService.deleteProduct(id)
      await fetchProducts()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al eliminar producto'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setItemsPerPage(items: number) {
    itemsPerPage.value = items
    currentPage.value = 1
    fetchProducts()
  }

  function nextPage() {
    if (hasNextPage.value) {
      currentPage.value++
      fetchProducts()
    }
  }

  function prevPage() {
    if (hasPrevPage.value) {
      currentPage.value--
      fetchProducts()
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      fetchProducts()
    }
  }

  return {
    products,
    categories,
    loading,
    error,
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    hasNextPage,
    hasPrevPage,
    fetchProducts,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    setItemsPerPage,
    nextPage,
    prevPage,
    goToPage,
  }
})
