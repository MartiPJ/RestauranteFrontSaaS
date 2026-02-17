<!-- src/views/CategoriesView.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'
import CategoryModal from '@/components/CategoryModal.vue'
import ConfirmationModal from '@/components/Confirmationmodal.vue'
import type { Category } from '@/types/category'

const categoryStore = useCategoryStore()

const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const selectedCategory = ref<Category | null>(null)
const showDeleteConfirm = ref(false)
const categoryToDelete = ref<string | null>(null)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

const itemsPerPageOptions = [5, 10, 20]

onMounted(() => {
  categoryStore.fetchCategories()
})

const hasResults = computed(() => {
  return categoryStore.categories.length > 0
})

const noResultsMessage = computed(() => {
  if (categoryStore.searchQuery) {
    return `No se encontraron categorías con "${categoryStore.searchQuery}"`
  }
  return 'No hay categorías disponibles'
})

function handleCreate() {
  selectedCategory.value = null
  modalMode.value = 'create'
  showModal.value = true
}

function handleEdit(category: Category) {
  selectedCategory.value = category
  modalMode.value = 'edit'
  showModal.value = true
}

async function handleSave(data: {
  name: string
  description: string
  displayOrder: number
  isActive: boolean
}) {
  try {
    if (modalMode.value === 'create') {
      await categoryStore.createCategory(data)
      triggerToast('Categoría creada exitosamente', 'success')
    } else if (selectedCategory.value) {
      await categoryStore.updateCategory(selectedCategory.value.id, data)
      triggerToast('Categoría actualizada exitosamente', 'success')
    }
    showModal.value = false
  } catch (error: any) {
    triggerToast(error.message || 'Error al guardar la categoría', 'error')
  }
}

function confirmDelete(id: string) {
  categoryToDelete.value = id
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (categoryToDelete.value) {
    try {
      await categoryStore.deleteCategory(categoryToDelete.value)
      triggerToast('Categoría eliminada exitosamente', 'success')
      showDeleteConfirm.value = false
      categoryToDelete.value = null
    } catch (error: any) {
      triggerToast(error.message || 'Error al eliminar la categoría', 'error')
    }
  }
}

function cancelDelete() {
  showDeleteConfirm.value = false
  categoryToDelete.value = null
}

async function handleToggleActive(category: Category) {
  try {
    await categoryStore.toggleActive(category.id, !category.isActive)
    triggerToast(category.isActive ? 'Categoría desactivada' : 'Categoría activada', 'success')
  } catch (error: any) {
    triggerToast(error.message || 'Error al cambiar estado', 'error')
  }
}

function handleSearch(event: Event) {
  const target = event.target as HTMLInputElement
  categoryStore.setSearchQuery(target.value)
}

function clearSearch() {
  categoryStore.clearSearch()
}

function triggerToast(message: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, 3000)
}
</script>

<template>
  <div class="categories-view">
    <!-- Toast Notification (se mantiene igual) -->
    <Transition name="toast">
      <div v-if="showToast" :class="['toast', toastType]">
        <span class="toast-icon">{{ toastType === 'success' ? '✓' : '✗' }}</span>
        {{ toastMessage }}
      </div>
    </Transition>

    <!-- Header (se mantiene igual) -->
    <div class="header">
      <div class="header-content">
        <div class="title-section">
          <h1>Categorías</h1>
          <p class="subtitle">Administra las categorías de productos del menú</p>
        </div>
        <button @click="handleCreate" class="btn-create">
          <span class="btn-icon">➕</span>
          <span class="btn-text">Nueva Categoría</span>
        </button>
      </div>

      <!-- Stats Cards (se mantiene igual) -->
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <div class="stat-value">
              {{ categoryStore.meta?.totalItems ?? categoryStore.categories.length }}
            </div>
            <div class="stat-label">Total Categorías</div>
          </div>
        </div>
        <div class="stat-card active">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">
              {{ categoryStore.categories.filter((c) => c.isActive).length }}
            </div>
            <div class="stat-label">Activas</div>
          </div>
        </div>
        <div class="stat-card inactive">
          <div class="stat-icon">⏸️</div>
          <div class="stat-content">
            <div class="stat-value">
              {{ categoryStore.categories.filter((c) => !c.isActive).length }}
            </div>
            <div class="stat-label">Inactivas</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filters (se mantiene igual) -->
    <div class="filters-section">
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
          :value="categoryStore.searchQuery"
          @input="handleSearch"
          placeholder="Buscar por nombre..."
          class="search-input"
        />
        <button
          v-if="categoryStore.searchQuery"
          @click="clearSearch"
          class="clear-search"
          title="Limpiar búsqueda"
        >
          ✕
        </button>
      </div>

      <div class="per-page-selector">
        <span class="per-page-label">Mostrar:</span>
        <select
          :value="categoryStore.itemsPerPage"
          @change="
            categoryStore.setItemsPerPage(Number(($event.target as HTMLSelectElement).value))
          "
          class="per-page-select"
        >
          <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading State (se mantiene igual) -->
    <div v-if="categoryStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando categorías...</p>
    </div>

    <!-- Error State (se mantiene igual) -->
    <div v-else-if="categoryStore.error" class="error-message">
      <span class="error-icon">⚠️</span>
      {{ categoryStore.error }}
    </div>

    <!-- No Results (se mantiene igual) -->
    <div v-else-if="!hasResults" class="empty-state">
      <div class="empty-icon">📋</div>
      <h3>No hay categorías</h3>
      <p>{{ noResultsMessage }}</p>
      <button v-if="categoryStore.searchQuery" @click="clearSearch" class="btn-clear">
        Limpiar búsqueda
      </button>
    </div>

    <!-- Categories List (se mantiene igual) -->
    <div v-else class="categories-list">
      <div
        v-for="category in categoryStore.sortedCategories"
        :key="category.id"
        class="category-card"
        :class="{ inactive: !category.isActive }"
      >
        <div class="category-content">
          <div class="category-info">
            <div class="category-header">
              <span class="order-badge">#{{ category.displayOrder }}</span>
              <h3 :class="{ 'text-inactive': !category.isActive }">{{ category.name }}</h3>
            </div>
            <p class="category-description">{{ category.description }}</p>
          </div>

          <div class="category-actions">
            <button
              @click="handleToggleActive(category)"
              class="btn-status"
              :class="{ active: category.isActive, inactive: !category.isActive }"
              :title="category.isActive ? 'Desactivar' : 'Activar'"
            >
              <span class="status-dot" :class="{ active: category.isActive }"></span>
              {{ category.isActive ? 'Activo' : 'Inactivo' }}
            </button>

            <button @click="handleEdit(category)" class="btn-icon edit" title="Editar">✏️</button>

            <button @click="confirmDelete(category.id)" class="btn-icon delete" title="Eliminar">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination (se mantiene igual) -->
    <div v-if="categoryStore.meta && categoryStore.meta.totalPages > 1" class="pagination">
      <button
        @click="categoryStore.setPage(categoryStore.currentPage - 1)"
        :disabled="categoryStore.currentPage === 1"
        class="pagination-btn"
        :class="{ disabled: categoryStore.currentPage === 1 }"
      >
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Anterior
      </button>

      <span class="pagination-info">
        Página {{ categoryStore.currentPage }} de {{ categoryStore.meta.totalPages }}
      </span>

      <button
        @click="categoryStore.setPage(categoryStore.currentPage + 1)"
        :disabled="categoryStore.currentPage === categoryStore.meta.totalPages"
        class="pagination-btn"
        :class="{ disabled: categoryStore.currentPage === categoryStore.meta.totalPages }"
      >
        Siguiente
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Category Modal (se mantiene igual) -->
    <CategoryModal
      :show="showModal"
      :category="selectedCategory"
      :mode="modalMode"
      @close="showModal = false"
      @save="handleSave"
    />

    <!-- Delete Confirmation Modal - AHORA USA EL NUEVO COMPONENTE -->
    <ConfirmationModal
      :show="showDeleteConfirm"
      title="¿Eliminar categoría?"
      message="Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar esta categoría?"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      type="danger"
      @confirm="handleDelete"
      @cancel="cancelDelete"
    />
  </div>
</template>

<style scoped>
/* Todos los estilos se mantienen IGUAL, solo eliminamos las clases del modal antiguo */
.categories-view {
  min-height: 100vh;
  background-color: #e4f4fc;
  padding: 2rem;
}

/* Toast */
.toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  box-shadow: 0 15px 30px rgba(5, 27, 58, 0.2);
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: slideIn 0.3s ease;
}

.toast.success {
  background: linear-gradient(145deg, #10b981, #059669);
}

.toast.error {
  background: linear-gradient(145deg, #ef4444, #dc2626);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Header */
.header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.title-section h1 {
  font-size: 2.2rem;
  font-weight: 700;
  color: #051b3a;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.5px;
}

.subtitle {
  color: #5d7a90;
  font-size: 1rem;
  margin: 0;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.75rem;
  background: linear-gradient(145deg, #609abb, #5d7a90);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.btn-create:hover {
  background: linear-gradient(145deg, #5d7a90, #051b3a);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.3);
}

.btn-icon {
  font-size: 1.1rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
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

.stat-card.active {
  border-left: 4px solid #10b981;
}

.stat-card.inactive {
  border-left: 4px solid #ef4444;
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

/* Filters Section */
.filters-section {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 2rem;
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  align-items: center;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
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
  padding: 0.875rem 2.5rem 0.875rem 3rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: #e4f4fc;
  color: #051b3a;
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
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.clear-search:hover {
  color: #609abb;
  background: rgba(96, 154, 187, 0.1);
}

.per-page-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.per-page-label {
  font-size: 0.9rem;
  color: #5d7a90;
  white-space: nowrap;
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

/* Error Message */
.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 1.25rem;
  border-radius: 12px;
  text-align: center;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 2px solid #fecaca;
}

.error-icon {
  font-size: 1.25rem;
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
  text-align: center;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
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
  font-size: 1.3rem;
  color: #051b3a;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #5d7a90;
  margin: 0 0 1.5rem 0;
}

.btn-clear {
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

.btn-clear:hover {
  background: #609abb;
  color: white;
}

/* Categories List */
.categories-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  transition: all 0.3s ease;
  border: 2px solid #e4f4fc;
}

.category-card:hover {
  transform: translateY(-3px);
  border-color: #609abb;
  box-shadow: 0 8px 20px rgba(96, 154, 187, 0.15);
}

.category-card.inactive {
  background: #f8fafc;
  border-color: #e4f4fc;
  opacity: 0.8;
}

.category-content {
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.category-info {
  flex: 1;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.order-badge {
  background: #e4f4fc;
  color: #609abb;
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
}

.category-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #051b3a;
}

.category-header h3.text-inactive {
  color: #b4cbd8;
}

.category-description {
  margin: 0;
  color: #5d7a90;
  font-size: 0.9rem;
  line-height: 1.5;
}

.category-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.btn-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 2px solid;
  border-radius: 30px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.btn-status.active {
  border-color: #10b981;
  color: #10b981;
}

.btn-status.active:hover {
  background: #10b981;
  color: white;
}

.btn-status.inactive {
  border-color: #ef4444;
  color: #ef4444;
}

.btn-status.inactive:hover {
  background: #ef4444;
  color: white;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-dot.active {
  background: #10b981;
}

.status-dot.inactive {
  background: #ef4444;
}

.btn-status:hover .status-dot {
  background: white;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.btn-icon.edit {
  background: #e4f4fc;
  color: #609abb;
}

.btn-icon.edit:hover {
  background: #609abb;
  color: white;
  transform: translateY(-2px);
}

.btn-icon.delete {
  background: #fee2e2;
  color: #ef4444;
}

.btn-icon.delete:hover {
  background: #ef4444;
  color: white;
  transform: translateY(-2px);
}

/* Pagination */
.pagination {
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
  border: 2px solid #e4f4fc;
  border-radius: 30px;
  background: white;
  color: #609abb;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(.disabled) {
  background: #609abb;
  color: white;
  border-color: #609abb;
  transform: translateY(-2px);
}

.pagination-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-info {
  padding: 0.5rem 1rem;
  color: #5d7a90;
  font-size: 0.9rem;
}

.pagination-btn .icon {
  width: 16px;
  height: 16px;
}

/* ❗ ELIMINAMOS LAS CLASES DEL MODAL ANTIGUO: .modal-overlay, .confirm-modal, etc. */

/* Responsive */
@media (max-width: 768px) {
  .categories-view {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-create {
    width: 100%;
    justify-content: center;
  }

  .filters-section {
    flex-direction: column;
    gap: 1rem;
  }

  .search-box {
    width: 100%;
  }

  .per-page-selector {
    width: 100%;
    justify-content: space-between;
  }

  .per-page-select {
    flex: 1;
  }

  .category-content {
    flex-direction: column;
    align-items: stretch;
  }

  .category-actions {
    justify-content: flex-end;
  }

  .pagination {
    flex-direction: column;
    gap: 1rem;
  }

  .pagination-btn {
    width: 100%;
    justify-content: center;
  }

  .toast {
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
}

@media (max-width: 480px) {
  .category-actions {
    justify-content: stretch;
  }

  .btn-status {
    flex: 1;
  }

  .btn-icon {
    width: 48px;
    height: 48px;
    font-size: 1.2rem;
  }
}
</style>
