<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCategoryStore } from '@/stores/categoryStore'
import CategoryModal from '@/components/CategoryModal.vue'
import type { Category } from '@/types/category'

const categoryStore = useCategoryStore()

const showModal = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const selectedCategory = ref<Category | null>(null)
const showDeleteConfirm = ref(false)
const categoryToDelete = ref<string | null>(null)

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
    } else if (selectedCategory.value) {
      await categoryStore.updateCategory(selectedCategory.value.id, data)
    }
    showModal.value = false
  } catch (error) {
    console.error('Error al guardar:', error)
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
      showDeleteConfirm.value = false
      categoryToDelete.value = null
    } catch (error) {
      console.error('Error al eliminar:', error)
    }
  }
}

async function handleToggleActive(category: Category) {
  try {
    await categoryStore.toggleActive(category.id, !category.isActive)
  } catch (error) {
    console.error('Error al cambiar estado:', error)
  }
}

function handleSearch(event: Event) {
  const target = event.target as HTMLInputElement
  categoryStore.setSearchQuery(target.value)
}

function clearSearch() {
  categoryStore.clearSearch()
}
</script>

<template>
  <div style="max-width: 1200px; margin: 0 auto; padding: 24px">
    <!-- Header -->
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
      "
    >
      <h1 style="font-size: 32px; font-weight: 700; color: #111827; margin: 0">Categorías</h1>
      <button
        @click="handleCreate"
        style="
          padding: 12px 24px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        "
        onmouseover="this.style.backgroundColor='#1d4ed8'"
        onmouseout="this.style.backgroundColor='#2563eb'"
      >
        + Nueva Categoría
      </button>
    </div>

    <!-- Search and Filters -->
    <div
      style="display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; align-items: center"
    >
      <div style="flex: 1; min-width: 250px; position: relative">
        <input
          type="text"
          :value="categoryStore.searchQuery"
          @input="handleSearch"
          placeholder="Buscar por nombre..."
          style="
            width: 100%;
            padding: 10px 40px 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
          "
        />
        <button
          v-if="categoryStore.searchQuery"
          @click="clearSearch"
          style="
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #6b7280;
            cursor: pointer;
            font-size: 18px;
            padding: 4px 8px;
          "
          title="Limpiar búsqueda"
        >
          ✕
        </button>
      </div>

      <div style="display: flex; align-items: center; gap: 8px">
        <span style="font-size: 14px; color: #6b7280; white-space: nowrap"> Mostrar: </span>
        <select
          :value="categoryStore.itemsPerPage"
          @change="
            categoryStore.setItemsPerPage(Number(($event.target as HTMLSelectElement).value))
          "
          style="
            padding: 8px 32px 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            background: white;
          "
        >
          <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="categoryStore.loading" style="text-align: center; padding: 48px; color: #6b7280">
      Cargando...
    </div>

    <!-- Error -->
    <div
      v-else-if="categoryStore.error"
      style="
        background: #fee2e2;
        border: 1px solid #ef4444;
        color: #991b1b;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 24px;
      "
    >
      {{ categoryStore.error }}
    </div>

    <!-- No Results -->
    <div
      v-else-if="!hasResults"
      style="
        text-align: center;
        padding: 64px 24px;
        background: #f9fafb;
        border-radius: 8px;
        color: #6b7280;
      "
    >
      <div style="font-size: 48px; margin-bottom: 16px">📋</div>
      <p style="font-size: 18px; margin: 0">{{ noResultsMessage }}</p>
    </div>

    <!-- Categories List -->
    <div
      v-else
      style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden"
    >
      <div
        v-for="category in categoryStore.sortedCategories"
        :key="category.id"
        style="padding: 20px; border-bottom: 1px solid #e5e7eb; transition: background-color 0.2s"
        :style="!category.isActive ? 'background-color: #f3f4f6;' : ''"
        onmouseover="if(this.style.backgroundColor !== 'rgb(243, 244, 246)') this.style.backgroundColor='#f9fafb'"
        onmouseout="if(this.style.backgroundColor !== 'rgb(243, 244, 246)') this.style.backgroundColor='white'"
      >
        <div
          style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px"
        >
          <div style="flex: 1">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px">
              <span
                style="
                  display: inline-block;
                  background: #dbeafe;
                  color: #1e40af;
                  padding: 4px 12px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-weight: 600;
                "
              >
                #{{ category.displayOrder }}
              </span>
              <h3
                style="margin: 0; font-size: 18px; font-weight: 600; color: #111827"
                :style="!category.isActive ? 'color: #9ca3af;' : ''"
              >
                {{ category.name }}
              </h3>
            </div>
            <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5">
              {{ category.description }}
            </p>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0">
            <button
              @click="handleToggleActive(category)"
              :title="category.isActive ? 'Desactivar' : 'Activar'"
              style="
                padding: 8px 16px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
              "
              :style="
                category.isActive
                  ? 'background: #22c55e; color: white; border-color: #22c55e;'
                  : 'background: white; color: #6b7280;'
              "
              onmouseover="this.style.opacity='0.8'"
              onmouseout="this.style.opacity='1'"
            >
              {{ category.isActive ? 'Activo' : 'Inactivo' }}
            </button>

            <button
              @click="handleEdit(category)"
              style="
                padding: 8px 12px;
                background: white;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
              "
              title="Editar"
              onmouseover="this.style.backgroundColor='#f3f4f6'"
              onmouseout="this.style.backgroundColor='white'"
            >
              ✏️
            </button>

            <button
              @click="confirmDelete(category.id)"
              style="
                padding: 8px 12px;
                background: white;
                border: 1px solid #ef4444;
                border-radius: 6px;
                color: #ef4444;
                cursor: pointer;
                transition: all 0.2s;
              "
              title="Eliminar"
              onmouseover="this.style.backgroundColor='#fee2e2'"
              onmouseout="this.style.backgroundColor='white'"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="categoryStore.meta && categoryStore.meta.totalPages > 1"
      style="
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin-top: 24px;
      "
    >
      <button
        @click="categoryStore.setPage(categoryStore.currentPage - 1)"
        :disabled="categoryStore.currentPage === 1"
        style="
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        "
        :style="categoryStore.currentPage === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''"
        onmouseover="if(this.disabled) return; this.style.backgroundColor='#f3f4f6'"
        onmouseout="this.style.backgroundColor='white'"
      >
        ← Anterior
      </button>

      <span style="padding: 8px 16px; font-size: 14px; color: #6b7280">
        Página {{ categoryStore.currentPage }} de {{ categoryStore.meta.totalPages }}
      </span>

      <button
        @click="categoryStore.setPage(categoryStore.currentPage + 1)"
        :disabled="categoryStore.currentPage === categoryStore.meta.totalPages"
        style="
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        "
        :style="
          categoryStore.currentPage === categoryStore.meta.totalPages
            ? 'opacity: 0.5; cursor: not-allowed;'
            : ''
        "
        onmouseover="if(this.disabled) return; this.style.backgroundColor='#f3f4f6'"
        onmouseout="this.style.backgroundColor='white'"
      >
        Siguiente →
      </button>
    </div>

    <!-- Category Modal -->
    <CategoryModal
      :show="showModal"
      :category="selectedCategory"
      :mode="modalMode"
      @close="showModal = false"
      @save="handleSave"
    />

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      "
      @click.self="showDeleteConfirm = false"
    >
      <div
        style="background: white; border-radius: 8px; padding: 24px; max-width: 400px; width: 90%"
      >
        <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #111827">
          ¿Eliminar categoría?
        </h3>
        <p style="margin: 0 0 24px 0; color: #6b7280; line-height: 1.5">
          Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar esta categoría?
        </p>
        <div style="display: flex; gap: 12px; justify-content: flex-end">
          <button
            @click="showDeleteConfirm = false"
            style="
              padding: 10px 20px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              background: white;
              color: #374151;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
            "
            onmouseover="this.style.backgroundColor='#f3f4f6'"
            onmouseout="this.style.backgroundColor='white'"
          >
            Cancelar
          </button>
          <button
            @click="handleDelete"
            style="
              padding: 10px 20px;
              border: none;
              border-radius: 6px;
              background: #ef4444;
              color: white;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
            "
            onmouseover="this.style.backgroundColor='#dc2626'"
            onmouseout="this.style.backgroundColor='#ef4444'"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
