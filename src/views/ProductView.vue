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

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <div class="stat-value">{{ store.totalItems }}</div>
            <div class="stat-label">Total Productos</div>
          </div>
        </div>
        <div class="stat-card categories">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <div class="stat-value">{{ store.categories.length }}</div>
            <div class="stat-label">Categorías</div>
          </div>
        </div>
      </div>

      <!-- Buscador y Filtros -->
      <div class="filters-section">
        <!-- Búsqueda -->
        <div class="search-box">
          <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            :value="store.searchQuery"
            @input="handleSearch"
            placeholder="Buscar por nombre..."
            class="search-input"
          />
          <button
            v-if="store.searchQuery"
            @click="store.clearSearch()"
            class="clear-search"
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        </div>

        <!-- Filtro disponibilidad -->
        <div class="filter-group">
          <span class="filter-label">Disponibilidad:</span>
          <div class="filter-chips">
            <button
              class="chip"
              :class="{ active: store.availabilityFilter === null }"
              @click="store.setAvailabilityFilter(null)"
            >
              Todos
            </button>
            <button
              class="chip available"
              :class="{ active: store.availabilityFilter === true }"
              @click="store.setAvailabilityFilter(true)"
            >
              <span class="chip-dot"></span>
              Disponibles
            </button>
            <button
              class="chip unavailable"
              :class="{ active: store.availabilityFilter === false }"
              @click="store.setAvailabilityFilter(false)"
            >
              <span class="chip-dot"></span>
              No disponibles
            </button>
          </div>
        </div>

        <!-- Filtro categoría - MEJORADO -->
        <div class="filter-group category-filter-group">
          <span class="filter-label">Categoría:</span>
          <div class="category-select-wrapper">
            <select
              :value="store.categoryFilter ?? ''"
              @change="handleCategoryChange"
              class="category-select"
            >
              <option value="">Todas las categorías</option>
              <option v-for="cat in store.categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <svg class="select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>

        <!-- Items por página -->
        <div class="per-page-selector">
          <span class="filter-label">Mostrar:</span>
          <div class="per-page-wrapper">
            <select
              :value="store.itemsPerPage"
              @change="handleItemsPerPageChange"
              class="per-page-select"
            >
              <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </div>
        </div>

        <!-- Botón limpiar filtros - MOVIDO AQUÍ -->
        <button
          v-if="hasActiveFilters"
          class="btn-clear-filters-main"
          @click="store.clearFilters()"
        >
          <svg
            width="16"
            height="16"
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
        <button v-if="hasActiveFilters" class="btn-clear-alt" @click="store.clearFilters()">
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
            stroke-linecap="round"
            stroke-linejoin="round"
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
            :class="{
              active: page === store.currentPage,
              ellipsis: page === -1,
            }"
            @click="page !== -1 && store.goToPage(page)"
          >
            {{ page === -1 ? '...' : page }}
          </button>
        </div>

        <span class="pagination-info">
          Página {{ store.currentPage }} de {{ store.totalPages }}
        </span>

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
            stroke-linecap="round"
            stroke-linejoin="round"
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
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/productStore'
import ProductCard from '@/components/ProductCard.vue'
import ProductForm from '@/components/ProductForm.vue'
import ConfirmationModal from '@/components/Confirmationmodal.vue'
import type { Product, ProductFormData } from '@/types/product'

const store = useProductStore()

const showModal = ref(false)
const selectedProduct = ref<Product | null>(null)
const showDeleteConfirm = ref(false)
const productToDelete = ref<string | null>(null)

const itemsPerPageOptions = [5, 10, 20]

// ── Computed ────────────────────────────────────────────
const startItem = computed(() =>
  store.products.length > 0 ? (store.currentPage - 1) * store.itemsPerPage + 1 : 0,
)

const endItem = computed(() => Math.min(store.currentPage * store.itemsPerPage, store.totalItems))

const hasActiveFilters = computed(
  () => !!store.searchQuery || store.availabilityFilter !== null || !!store.categoryFilter,
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

// ── Handlers ────────────────────────────────────────────
async function loadData() {
  try {
    await store.fetchCategories()
    await store.fetchProducts()
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

function handleSearch(event: Event) {
  const target = event.target as HTMLInputElement
  store.setSearchQuery(target.value)
  store.goToPage(1) // 🔥 IMPORTANTE
}

function handleCategoryChange(event: Event) {
  const target = event.target as HTMLSelectElement
  store.setCategoryFilter(target.value || null)
  store.goToPage(1) // 🔥
}

function handleItemsPerPageChange(event: Event) {
  const target = event.target as HTMLSelectElement
  store.setItemsPerPage(Number(target.value))
  store.goToPage(1) // 🔥
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
  } catch (error) {
    console.error('Error submitting form:', error)
  }
}

async function handleDelete() {
  if (productToDelete.value) {
    try {
      await store.deleteProduct(productToDelete.value)
      cancelDelete()
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

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.25rem;
  border-radius: 16px;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.3s ease;
  border: 1px solid rgba(96, 154, 187, 0.1);
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.1);
}
.stat-card.total {
  border-left: 4px solid #609abb;
}
.stat-card.categories {
  border-left: 4px solid #10b981;
}

.stat-icon {
  font-size: 2rem;
  background: #e4f4fc;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #051b3a;
  line-height: 1.2;
}
.stat-label {
  font-size: 0.85rem;
  color: #5d7a90;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Filters Section */
.filters-section {
  background: white;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
  align-items: center;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
}

/* Search */
.search-box {
  position: relative;
  flex: 1;
  min-width: 220px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #b4cbd8;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 3rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: #e4f4fc;
  color: #051b3a;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #609abb;
  background: white;
  box-shadow: 0 0 0 4px rgba(96, 154, 187, 0.1);
}

.clear-search {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #b4cbd8;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.clear-search:hover {
  color: #609abb;
  background: rgba(96, 154, 187, 0.1);
}

/* Filter groups */
.filter-group {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #5d7a90;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

/* Chips de disponibilidad */
.filter-chips {
  display: flex;
  gap: 0.375rem;
}

.chip {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.875rem;
  border: 2px solid #e4f4fc;
  border-radius: 30px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  background: #e4f4fc;
  color: #5d7a90;
}

.chip:hover {
  border-color: #609abb;
  color: #609abb;
  background: white;
}

.chip.active {
  background: #609abb;
  border-color: #609abb;
  color: white;
  box-shadow: 0 3px 10px rgba(96, 154, 187, 0.3);
}

.chip-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.8;
}

.chip.available .chip-dot {
  background: #10b981;
}
.chip.unavailable .chip-dot {
  background: #ef4444;
}
.chip.available.active .chip-dot,
.chip.unavailable.active .chip-dot {
  background: white;
}

/* Category select */
.category-select {
  padding: 0.5rem 2rem 0.5rem 0.875rem;
  border: 2px solid #e4f4fc;
  border-radius: 10px;
  font-size: 0.9rem;
  background: #e4f4fc;
  color: #051b3a;
  cursor: pointer;
  transition: all 0.3s ease;
  max-width: 200px;
}

.category-select:focus {
  outline: none;
  border-color: #609abb;
  background: white;
}

/* Per page */
.per-page-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.per-page-select {
  padding: 0.5rem 2rem 0.5rem 0.875rem;
  border: 2px solid #e4f4fc;
  border-radius: 10px;
  font-size: 0.9rem;
  background: #e4f4fc;
  color: #051b3a;
  cursor: pointer;
  transition: all 0.3s ease;
}

.per-page-select:focus {
  outline: none;
  border-color: #609abb;
  background: white;
}

/* Results bar */
.results-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 0 0.25rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.results-badge {
  background: #e4f4fc;
  color: #609abb;
  padding: 0.4rem 1rem;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.9rem;
}

.btn-clear-filters {
  padding: 0.4rem 1rem;
  background: #fee2e2;
  color: #ef4444;
  border: 2px solid #fecaca;
  border-radius: 30px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-clear-filters:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

/* Loading */
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

/* Error */
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

/* Products Grid */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
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
  .filters-section {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  .search-box {
    width: 100%;
  }
  .filter-group {
    justify-content: space-between;
  }
  .filter-chips {
    flex: 1;
    justify-content: flex-end;
  }
  .per-page-selector {
    justify-content: space-between;
  }
  .per-page-select {
    flex: 1;
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
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .page-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }
  .page-number {
    min-width: 35px;
    height: 35px;
  }
  .filter-chips {
    flex-wrap: wrap;
  }
}

/* Category Select Mejorado */
.category-filter-group {
  flex: 1;
  min-width: 180px;
}

.category-select-wrapper {
  position: relative;
  flex: 1;
}

.category-select {
  width: 100%;
  padding: 0.625rem 2rem 0.625rem 1rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  font-size: 0.9rem;
  background: #e4f4fc;
  color: #051b3a;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  font-weight: 500;
}

.category-select:hover {
  border-color: #609abb;
  background: white;
}

.category-select:focus {
  outline: none;
  border-color: #609abb;
  background: white;
  box-shadow: 0 0 0 3px rgba(96, 154, 187, 0.1);
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #609abb;
  pointer-events: none;
  transition: transform 0.3s ease;
}

.category-select:focus + .select-arrow {
  transform: translateY(-50%) rotate(180deg);
}

/* Per page wrapper */
.per-page-wrapper {
  position: relative;
}

.per-page-select {
  padding: 0.625rem 2rem 0.625rem 1rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  font-size: 0.9rem;
  background: #e4f4fc;
  color: #051b3a;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  font-weight: 500;
}

.per-page-select:hover {
  border-color: #609abb;
  background: white;
}

.per-page-select:focus {
  outline: none;
  border-color: #609abb;
  background: white;
}

/* Botón limpiar filtros principal */
.btn-clear-filters-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #fee2e2;
  color: #ef4444;
  border: 2px solid #fecaca;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}

.btn-clear-filters-main:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
}

.btn-clear-filters-main svg {
  transition: transform 0.3s ease;
}

.btn-clear-filters-main:hover svg {
  transform: rotate(90deg);
}

/* Results bar mejorado */
.results-bar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 1.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(96, 154, 187, 0.05);
  border-radius: 12px;
  flex-wrap: wrap;
  gap: 0.75rem;
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

/* Responsive updates */
@media (max-width: 768px) {
  .filters-section {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .filter-group {
    width: 100%;
    justify-content: space-between;
  }

  .category-filter-group {
    width: 100%;
  }

  .category-select-wrapper {
    flex: 1;
    max-width: none;
  }

  .btn-clear-filters-main {
    width: 100%;
    justify-content: center;
  }

  .filter-chips {
    flex: 1;
    justify-content: flex-end;
  }

  .per-page-selector {
    width: 100%;
    justify-content: space-between;
  }

  .per-page-wrapper {
    min-width: 100px;
  }
}

/* Animaciones */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filters-section {
  animation: slideDown 0.3s ease;
}
</style>
