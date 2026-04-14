<!-- src/views/ProductsView.vue -->
<template>
  <div class="products-view">
    <div class="container">
      <!-- Header -->
      <div class="page-header">
        <div class="title-section">
          <h1>Gestión de Productos</h1>
          <p class="subtitle">Administra el menú de tu restaurante</p>
        </div>
        <button class="btn btn-primary" @click="openCreateModal">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Nuevo Producto
        </button>
      </div>

      <!-- StatsFiltersPanel Component -->
      <StatsFiltersPanel
        :stats="statsData"
        :filters="filterOptions"
        v-model="filterStatus"
        v-model:searchQuery="searchQuery"
        search-placeholder="Buscar por nombre..."
        :show-search="true"
        :show-filters="true"
      >
        <!-- SLOT EXTRA -->
        <template #extra>
          <div class="sfp-filters-bar">
            <!-- Categoría -->
            <div class="sfp-filter-group">
              <span class="sfp-filter-label">Categoría:</span>
              <div class="sfp-category-select-wrapper">
                <select
                  :value="categoryFilter"
                  @change="handleCategoryChange"
                  class="sfp-category-select"
                >
                  <option value="">Todas las categorías</option>
                  <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">
                    {{ cat.name }}
                  </option>
                </select>
                <svg class="sfp-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>

            <!-- Items por página -->
            <div class="sfp-filter-group">
              <span class="sfp-filter-label">Mostrar:</span>
              <div class="sfp-per-page-wrapper">
                <select
                  :value="store.itemsPerPage"
                  @change="handleItemsPerPageChange"
                  class="sfp-per-page-select"
                >
                  <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
                    {{ option }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Limpiar filtros -->
            <button v-if="hasActiveFilters" class="sfp-clear-filters-btn" @click="clearAllFilters">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Limpiar filtros
            </button>
          </div>
        </template>
      </StatsFiltersPanel>

      <!-- Barra de resultados -->
      <div class="results-bar">
        <span class="results-badge">
          {{ startItem }}–{{ endItem }} de {{ store.totalItems }} productos
        </span>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando productos...</p>
      </div>

      <!-- Error -->
      <div v-else-if="store.error" class="error-message">
        <span class="error-icon">⚠️</span>
        <p>{{ store.error }}</p>
        <button class="btn btn-primary" @click="loadData">
          <span class="btn-icon">↻</span>
          Reintentar
        </button>
      </div>

      <!-- Products Grid -->
      <div v-else-if="store.products.length > 0" class="products-grid">
        <ProductCard
          v-for="product in store.products"
          :key="product.id"
          :product="product"
          @edit="openEditModal"
          @delete="confirmDelete"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-icon">🍽️</div>
        <h3>No hay productos</h3>
        <p v-if="hasActiveFilters">No se encontraron productos con los filtros aplicados</p>
        <p v-else>Comienza agregando tu primer producto al menú</p>
        <button v-if="hasActiveFilters" class="btn-clear-alt" @click="clearAllFilters">
          Limpiar filtros
        </button>
        <button v-else class="btn btn-primary" @click="openCreateModal">
          <span class="btn-icon">➕</span>
          Agregar Producto
        </button>
      </div>

      <!-- Pagination -->
      <div v-if="store.totalPages > 1" class="pagination-section">
        <button
          class="pagination-btn"
          :class="{ disabled: !store.hasPrevPage }"
          :disabled="!store.hasPrevPage"
          @click="store.prevPage()"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Anterior
        </button>

        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            class="page-number"
            :class="{ active: page === store.currentPage, ellipsis: page === -1 }"
            @click="page !== -1 && store.goToPage(page)"
          >
            {{ page === -1 ? '...' : page }}
          </button>
        </div>

        <span class="pagination-info"
          >Página {{ store.currentPage }} de {{ store.totalPages }}</span
        >

        <button
          class="pagination-btn"
          :class="{ disabled: !store.hasNextPage }"
          :disabled="!store.hasNextPage"
          @click="store.nextPage()"
        >
          Siguiente
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>

    <!-- Modal Form -->
    <ProductForm
      v-if="showModal"
      :product="selectedProduct"
      :categories="store.categories"
      :loading="store.loading"
      @submit="handleSubmit"
      @close="closeModal"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      :show="showDeleteConfirm"
      title="¿Eliminar producto?"
      message="Esta acción no se puede deshacer. El producto será eliminado permanentemente del menú."
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      type="danger"
      @confirm="handleDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useProductStore } from '@/stores/productStore'
import ProductCard from '@/components/ProductCard.vue'
import ProductForm from '@/components/ProductForm.vue'
import ConfirmationModal from '@/components/Confirmationmodal.vue'
import StatsFiltersPanel from '@/components/StatsFilterPanel.vue'
import type { Product, ProductFormData } from '@/types/product'
import type { StatCard, FilterOption } from '@/types/statsFilter'

const store = useProductStore()

const showModal = ref(false)
const selectedProduct = ref<Product | null>(null)
const showDeleteConfirm = ref(false)
const productToDelete = ref<string | null>(null)

// Estados para los filtros
const filterStatus = ref<string>('all')
const searchQuery = ref('')
const categoryFilter = ref<string>('')

const itemsPerPageOptions = [5, 10, 20]

let filterDebounceTimeout: ReturnType<typeof setTimeout> | null = null

function debouncedFetchFilters() {
  if (filterDebounceTimeout) clearTimeout(filterDebounceTimeout)
  filterDebounceTimeout = setTimeout(() => {
    fetchProductsWithFilters()
  }, 300)
}

// Datos para StatsFiltersPanel
const statsData = computed<StatCard[]>(() => [
  {
    icon: '📦',
    value: store.totalItems,
    label: 'Total Productos',
    colorKey: 'default',
  },
  {
    icon: '📋',
    value: store.categories.length,
    label: 'Categorías',
    colorKey: 'green',
  },
  {
    icon: '✅',
    value: store.products.filter((p) => p.isAvailable).length,
    label: 'Disponibles',
    colorKey: 'green',
  },
  {
    icon: '⏸️',
    value: store.products.filter((p) => !p.isAvailable).length,
    label: 'No Disponibles',
    colorKey: 'red',
  },
])

// Configuración de los filtros principales (solo disponibilidad)
const filterOptions = computed<FilterOption[]>(() => [
  {
    value: 'all',
    label: 'Todos',
    colorKey: 'default',
    dot: true,
  },
  {
    value: 'available',
    label: 'Disponibles',
    colorKey: 'green',
    dot: true,
  },
  {
    value: 'unavailable',
    label: 'No Disponibles',
    colorKey: 'red',
    dot: true,
  },
])

// Computed
const startItem = computed(() =>
  store.products.length > 0 ? (store.currentPage - 1) * store.itemsPerPage + 1 : 0,
)

const endItem = computed(() => Math.min(store.currentPage * store.itemsPerPage, store.totalItems))

const hasActiveFilters = computed(
  () => !!searchQuery.value || !!categoryFilter.value || filterStatus.value !== 'all',
)

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = store.totalPages
  const current = store.currentPage

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push(-1)
    pages.push(total)
  } else if (current >= total - 3) {
    pages.push(1)
    pages.push(-1)
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    pages.push(-1)
    for (let i = current - 1; i <= current + 1; i++) pages.push(i)
    pages.push(-1)
    pages.push(total)
  }

  return pages
})

// Handlers
async function loadData() {
  try {
    await store.fetchCategories()
    await fetchProductsWithFilters()
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

async function fetchProductsWithFilters() {
  let availability: boolean | null = null
  if (filterStatus.value === 'available') {
    availability = true
  } else if (filterStatus.value === 'unavailable') {
    availability = false
  }

  store.setSearchQuery(searchQuery.value)
  store.setAvailabilityFilter(availability)
  store.setCategoryFilter(categoryFilter.value || null)

  await store.fetchProducts()
}

// Watchers
watch([filterStatus, searchQuery, categoryFilter], () => {
  debouncedFetchFilters()
})

function handleCategoryChange(event: Event) {
  const target = event.target as HTMLSelectElement
  categoryFilter.value = target.value
}

function handleItemsPerPageChange(event: Event) {
  const target = event.target as HTMLSelectElement
  store.setItemsPerPage(Number(target.value))
}

function clearAllFilters() {
  searchQuery.value = ''
  filterStatus.value = 'all'
  categoryFilter.value = ''
}

function openCreateModal() {
  selectedProduct.value = null
  showModal.value = true
}

function openEditModal(product: Product) {
  selectedProduct.value = product
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedProduct.value = null
}

function confirmDelete(id: string) {
  productToDelete.value = id
  showDeleteConfirm.value = true
}

function cancelDelete() {
  showDeleteConfirm.value = false
  productToDelete.value = null
}

async function handleSubmit(data: ProductFormData) {
  try {
    if (selectedProduct.value) {
      await store.updateProduct(selectedProduct.value.id, data)
    } else {
      await store.createProduct(data)
    }
    closeModal()
    await fetchProductsWithFilters()
  } catch (error) {
    console.error('Error submitting form:', error)
  }
}

async function handleDelete() {
  if (productToDelete.value) {
    try {
      await store.deleteProduct(productToDelete.value)
      cancelDelete()
      await fetchProductsWithFilters()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.products-view {
  min-height: 100vh;
  background-color: #e4f4fc;
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.title-section h1 {
  margin: 0 0 0.25rem 0;
  font-size: 2.2rem;
  font-weight: 700;
  color: #051b3a;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  color: #5d7a90;
  font-size: 1rem;
}

/* Estilos para los filtros dentro del slot */
.sfp-filters-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  margin-top: 12px;
}

.sfp-filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sfp-filter-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #5d7a90;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.sfp-category-select-wrapper {
  position: relative;
  min-width: 160px;
}

.sfp-category-select {
  width: 100%;
  padding: 0.55rem 2rem 0.55rem 0.875rem;
  border: 1px solid #e4f4fc;
  border-radius: 12px;
  font-size: 0.88rem;
  background: #e4f4fc;
  color: #051b3a;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  font-weight: 500;
}

.sfp-category-select:hover {
  border-color: #609abb;
  background: white;
}

.sfp-category-select:focus {
  outline: none;
  border-color: #609abb;
  background: white;
}

.sfp-select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: #609abb;
  pointer-events: none;
}

.sfp-per-page-wrapper {
  position: relative;
}

.sfp-per-page-select {
  padding: 0.55rem 2rem 0.55rem 0.875rem;
  border: 1px solid #e4f4fc;
  border-radius: 12px;
  font-size: 0.88rem;
  background: #e4f4fc;
  color: #051b3a;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  font-weight: 500;
}

.sfp-per-page-select:hover {
  border-color: #609abb;
  background: white;
}

.sfp-per-page-select:focus {
  outline: none;
  border-color: #609abb;
  background: white;
}

.sfp-clear-filters-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: #fee2e2;
  color: #ef4444;
  border: 2px solid #fecaca;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.sfp-clear-filters-btn:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

/* Results bar */
.results-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: 1rem 0 1.5rem 0;
  padding: 0.5rem 0.75rem;
  background: rgba(96, 154, 187, 0.05);
  border-radius: 12px;
}

.results-badge {
  background: white;
  color: #609abb;
  padding: 0.4rem 1rem;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.85rem;
  border: 1px solid rgba(96, 154, 187, 0.2);
}

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e4f4fc;
  border-top-color: #609abb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  color: #5d7a90;
  margin: 0;
}

/* Error Message */
.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  gap: 1rem;
}

.error-icon {
  font-size: 2rem;
}

.error-message p {
  color: #5d7a90;
  margin: 0;
  text-align: center;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  background: #e4f4fc;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
  color: #051b3a;
}

.empty-state p {
  margin: 0 0 1.5rem 0;
  color: #5d7a90;
}

.btn-clear-alt {
  padding: 0.75rem 2rem;
  background: #e4f4fc;
  color: #609abb;
  border: 2px solid #609abb;
  border-radius: 30px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-clear-alt:hover {
  background: #609abb;
  color: white;
}

/* Pagination */
.pagination-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: white;
  border: 2px solid #e4f4fc;
  border-radius: 30px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: #609abb;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(.disabled) {
  background: #609abb;
  border-color: #609abb;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.pagination-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  min-width: 40px;
  height: 40px;
  padding: 0 0.5rem;
  background: white;
  border: 2px solid #e4f4fc;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: #5d7a90;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-number:hover:not(.active):not(.ellipsis) {
  background: #e4f4fc;
  border-color: #609abb;
  color: #051b3a;
  transform: translateY(-2px);
}

.page-number.active {
  background: #609abb;
  border-color: #609abb;
  color: white;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.page-number.ellipsis {
  border-color: transparent;
  cursor: default;
  background: transparent;
}

.pagination-info {
  padding: 0.5rem 1rem;
  color: #5d7a90;
  font-size: 0.9rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.btn-primary {
  background: linear-gradient(145deg, #609abb, #5d7a90);
  color: white;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(145deg, #5d7a90, #051b3a);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Responsive */
@media (max-width: 768px) {
  .products-view {
    padding: 1rem 0;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-primary {
    width: 100%;
    justify-content: center;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }

  .pagination-section {
    flex-direction: column;
    gap: 1rem;
  }

  .pagination-btn {
    width: 100%;
    justify-content: center;
  }

  .page-numbers {
    order: -1;
  }
}

@media (max-width: 480px) {
  .page-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }

  .page-number {
    min-width: 35px;
    height: 35px;
  }
}
</style>
