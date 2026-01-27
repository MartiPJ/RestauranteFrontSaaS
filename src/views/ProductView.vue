<template>
  <div class="products-view">
    <div class="container">
      <!-- Header -->
      <div class="page-header">
        <div>
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

      <!-- Controles -->
      <div class="controls">
        <div class="items-per-page">
          <label>Mostrar:</label>
          <select v-model.number="selectedItemsPerPage" @change="handleItemsPerPageChange">
            <option :value="5">5 productos</option>
            <option :value="10">10 productos</option>
            <option :value="20">20 productos</option>
          </select>
        </div>

        <div class="results-info">
          Mostrando {{ startItem }} - {{ endItem }} de {{ store.totalItems }} productos
        </div>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="loading">
        <div class="spinner"></div>
        <p>Cargando productos...</p>
      </div>

      <!-- Error -->
      <div v-else-if="store.error" class="error-message">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>{{ store.error }}</p>
        <button class="btn btn-primary" @click="loadData">Reintentar</button>
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M3 3h18v18H3zM3 9h18M9 21V9"></path>
        </svg>
        <h3>No hay productos</h3>
        <p>Comienza agregando tu primer producto al menú</p>
        <button class="btn btn-primary" @click="openCreateModal">Agregar Producto</button>
      </div>

      <!-- Pagination -->
      <div v-if="store.totalPages > 1" class="pagination">
        <button class="btn-pagination" :disabled="!store.hasPrevPage" @click="store.prevPage()">
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
          Anterior
        </button>

        <div class="page-numbers">
          <button
            v-for="page in visiblePages"
            :key="page"
            class="page-number"
            :class="{ active: page === store.currentPage }"
            @click="store.goToPage(page)"
          >
            {{ page }}
          </button>
        </div>

        <button class="btn-pagination" :disabled="!store.hasNextPage" @click="store.nextPage()">
          Siguiente
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

    <!-- Modal Form -->
    <ProductForm
      v-if="showModal"
      :product="selectedProduct"
      :categories="store.categories"
      :loading="store.loading"
      @submit="handleSubmit"
      @close="closeModal"
    />

    <!-- Delete Confirmation -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="cancelDelete">
      <div class="confirm-dialog">
        <div class="confirm-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3>¿Eliminar producto?</h3>
        <p>Esta acción no se puede deshacer. El producto será eliminado permanentemente.</p>
        <div class="confirm-actions">
          <button class="btn btn-cancel" @click="cancelDelete">Cancelar</button>
          <button class="btn btn-danger" @click="handleDelete">Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/productStore'
import ProductCard from '@/components/ProductCard.vue'
import ProductForm from '@/components/ProductForm.vue'
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
.products-view {
  min-height: 100vh;
  background: #f9fafb;
  padding: 24px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-header h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  color: #111827;
}

.subtitle {
  margin: 4px 0 0 0;
  color: #6b7280;
  font-size: 16px;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
  gap: 16px;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 8px;
}

.items-per-page label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.items-per-page select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  background: white;
}

.results-info {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading p {
  margin: 0;
  color: #6b7280;
  font-size: 16px;
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.error-message svg {
  color: #ef4444;
}

.error-message p {
  margin: 0;
  color: #6b7280;
  font-size: 16px;
  text-align: center;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-state svg {
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #111827;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: #6b7280;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 32px;
}

.btn-pagination {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  transition: all 0.2s;
}

.btn-pagination:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-pagination:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-number {
  min-width: 40px;
  height: 40px;
  padding: 0 8px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  transition: all 0.2s;
}

.page-number:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.page-number.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.confirm-icon {
  margin-bottom: 16px;
}

.confirm-icon svg {
  color: #f59e0b;
}

.confirm-dialog h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #111827;
}

.confirm-dialog p {
  margin: 0 0 24px 0;
  color: #6b7280;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }

  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .pagination {
    flex-wrap: wrap;
  }
}
</style>
