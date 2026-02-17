<!-- src/views/ProductsView.vue -->
<template>
  <div class="products-view">
    <div class="container">
      <!-- Header (se mantiene igual) -->
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

      <!-- Stats Cards (se mantiene igual) -->
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

      <!-- Controles (se mantiene igual) -->
      <div class="controls-section">
        <div class="items-per-page">
          <label for="itemsPerPage">Mostrar:</label>
          <select
            id="itemsPerPage"
            v-model.number="selectedItemsPerPage"
            @change="handleItemsPerPageChange"
            class="per-page-select"
          >
            <option :value="5">5 productos</option>
            <option :value="10">10 productos</option>
            <option :value="20">20 productos</option>
          </select>
        </div>

        <div class="results-info">
          <span class="results-badge">
            {{ startItem }} - {{ endItem }} de {{ store.totalItems }}
          </span>
        </div>
      </div>

      <!-- Loading (se mantiene igual) -->
      <div v-if="store.loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando productos...</p>
      </div>

      <!-- Error (se mantiene igual) -->
      <div v-else-if="store.error" class="error-message">
        <span class="error-icon">⚠️</span>
        <p>{{ store.error }}</p>
        <button class="btn btn-primary" @click="loadData">
          <span class="btn-icon">↻</span>
          Reintentar
        </button>
      </div>

      <!-- Products Grid (se mantiene igual) -->
      <div v-else-if="store.products.length > 0" class="products-grid">
        <ProductCard
          v-for="product in store.products"
          :key="product.id"
          :product="product"
          @edit="openEditModal"
          @delete="confirmDelete"
        />
      </div>

      <!-- Empty State (se mantiene igual) -->
      <div v-else class="empty-state">
        <div class="empty-icon">🍽️</div>
        <h3>No hay productos</h3>
        <p>Comienza agregando tu primer producto al menú</p>
        <button class="btn btn-primary" @click="openCreateModal">
          <span class="btn-icon">➕</span>
          Agregar Producto
        </button>
      </div>

      <!-- Pagination (se mantiene igual) -->
      <div v-if="store.totalPages > 1" class="pagination-section">
        <button
          class="pagination-btn"
          :class="{ disabled: !store.hasPrevPage }"
          :disabled="!store.hasPrevPage"
          @click="store.prevPage()"
        >
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
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>Anterior</span>
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

        <button
          class="pagination-btn"
          :class="{ disabled: !store.hasNextPage }"
          :disabled="!store.hasNextPage"
          @click="store.nextPage()"
        >
          <span>Siguiente</span>
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
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>

    <!-- Modal Form (se mantiene igual) -->
    <ProductForm
      v-if="showModal"
      :product="selectedProduct"
      :categories="store.categories"
      :loading="store.loading"
      @submit="handleSubmit"
      @close="closeModal"
    />

    <!-- Delete Confirmation Modal - AHORA USA EL NUEVO COMPONENTE -->
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
const selectedItemsPerPage = ref(20)

const startItem = computed(() => {
  return store.products.length > 0 ? (store.currentPage - 1) * store.itemsPerPage + 1 : 0
})

const endItem = computed(() => {
  return Math.min(store.currentPage * store.itemsPerPage, store.totalItems)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = store.totalPages
  const current = store.currentPage

  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
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
  }

  return pages
})

async function loadData() {
  try {
    await store.fetchCategories()
    await store.fetchProducts()
  } catch (error) {
    console.error('Error loading data:', error)
  }
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

function handleItemsPerPageChange() {
  store.setItemsPerPage(selectedItemsPerPage.value)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* Todos los estilos se mantienen IGUAL, solo eliminamos las clases del modal antiguo */
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

/* Stats Grid */
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

.stat-content {
  flex: 1;
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

/* Controls Section */
.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  flex-wrap: wrap;
  gap: 1rem;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.items-per-page label {
  font-weight: 600;
  color: #051b3a;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.per-page-select {
  padding: 0.5rem 2rem 0.5rem 1rem;
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

.results-info {
  color: #5d7a90;
  font-size: 0.9rem;
  font-weight: 500;
}

.results-badge {
  background: #e4f4fc;
  color: #609abb;
  padding: 0.5rem 1rem;
  border-radius: 30px;
  font-weight: 600;
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
  background: #fee2e2;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
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
  padding: 0.75rem 1.5rem;
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

.pagination-btn svg {
  width: 18px;
  height: 18px;
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

  .controls-section {
    flex-direction: column;
    align-items: stretch;
  }

  .items-per-page {
    justify-content: space-between;
  }

  .per-page-select {
    flex: 1;
  }

  .results-info {
    text-align: center;
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
}

/* ❗ ELIMINAMOS LAS CLASES DEL MODAL ANTIGUO: .modal-overlay, .confirm-modal, etc. */
</style>
