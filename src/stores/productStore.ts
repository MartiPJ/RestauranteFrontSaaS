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

  // Filtros
  const searchQuery = ref('')
  const availabilityFilter = ref<boolean | null>(null) // null = todos, true = disponibles, false = no disponibles
  const categoryFilter = ref<string | null>(null)

  // Computed
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)

  function normalizeSearch(value: string) {
    return value.trim().toLowerCase()
  }

  // Acciones
  function matchesProductFilters(product: Product, trimmedSearch: string) {
    if (availabilityFilter.value !== null && product.isAvailable !== availabilityFilter.value) {
      return false
    }

    if (categoryFilter.value && product.category?.id !== categoryFilter.value) {
      return false
    }

    if (trimmedSearch && !normalizeSearch(product.name).includes(trimmedSearch)) {
      return false
    }

    return true
  }

  async function fetchProducts() {
    loading.value = true
    error.value = null
    try {
      const trimmedSearch = normalizeSearch(searchQuery.value)
      const hasFilters =
        availabilityFilter.value !== null || !!categoryFilter.value || !!trimmedSearch

      const response = await productService.getProducts(
        hasFilters ? 1 : currentPage.value,
        hasFilters ? 1000 : itemsPerPage.value,
        {
          search: trimmedSearch || undefined,
          isAvailable: availabilityFilter.value,
          categoryId: categoryFilter.value,
        },
      )

      const filteredProducts = response.data.filter((product) =>
        matchesProductFilters(product, trimmedSearch),
      )

      if (hasFilters) {
        totalItems.value = filteredProducts.length
        totalPages.value = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage.value))

        if (currentPage.value > totalPages.value) {
          currentPage.value = totalPages.value
        }

        const startIndex = (currentPage.value - 1) * itemsPerPage.value
        const endIndex = startIndex + itemsPerPage.value

        products.value = filteredProducts.slice(startIndex, endIndex)
      } else {
        products.value = filteredProducts
        totalItems.value = response.meta.totalItems
        totalPages.value = response.meta.totalPages
        currentPage.value = response.meta.currentPage
      }
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
    void fetchProducts()
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
    currentPage.value = 1
    void fetchProducts()
  }

  function clearSearch() {
    searchQuery.value = ''
    currentPage.value = 1
    void fetchProducts()
  }

  function setAvailabilityFilter(value: boolean | null) {
    availabilityFilter.value = value
    currentPage.value = 1
    void fetchProducts()
  }

  function setCategoryFilter(categoryId: string | null) {
    categoryFilter.value = categoryId
    currentPage.value = 1
    void fetchProducts()
  }

  function clearFilters() {
    searchQuery.value = ''
    availabilityFilter.value = null
    categoryFilter.value = null
    currentPage.value = 1
    void fetchProducts()
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
    searchQuery,
    availabilityFilter,
    categoryFilter,
    fetchProducts,
    fetchCategories,
    createProduct,
    updateProduct,
    deleteProduct,
    setItemsPerPage,
    setSearchQuery,
    clearSearch,
    setAvailabilityFilter,
    setCategoryFilter,
    clearFilters,
    nextPage,
    prevPage,
    goToPage,
  }
})
