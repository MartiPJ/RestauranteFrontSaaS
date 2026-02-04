<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTableStore } from '@/stores/tableStore'
import { useOrderStore } from '@/stores/orderStore'
import TableCard from '@/components/TableCard.vue'
import TableModal from '@/components/TableModal.vue'
import MenuModal from '@/components/MenuModal.vue'
import type { Table, CreateTableDTO } from '@/types/table'
import { TableStatus } from '@/types/table'

const tableStore = useTableStore()
const orderStore = useOrderStore()

const showTableModal = ref(false)
const showMenuModal = ref(false)
const isEdit = ref(false)
const selectedTable = ref<Table | null>(null)
const filterStatus = ref<string>('all')
const searchQuery = ref('')

onMounted(async () => {
  await tableStore.fetchTables()
})

const filteredTables = computed(() => {
  let result = tableStore.tables

  if (filterStatus.value !== 'all') {
    result = result.filter((t) => t.status === filterStatus.value)
  }

  if (searchQuery.value) {
    result = result.filter((t) =>
      t.tableNumber.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }

  return result
})

const openCreateModal = () => {
  isEdit.value = false
  selectedTable.value = null
  showTableModal.value = true
}

const openEditModal = (table: Table) => {
  isEdit.value = true
  selectedTable.value = table
  showTableModal.value = true
}

const openTakeOrderModal = (table: Table) => {
  selectedTable.value = table
  showMenuModal.value = true
}

const handleSubmit = async (data: CreateTableDTO) => {
  try {
    if (isEdit.value && selectedTable.value) {
      await tableStore.updateTable(selectedTable.value.id, data)
    } else {
      await tableStore.createTable(data)
    }
    showTableModal.value = false
  } catch (error: any) {
    alert(error.message || 'Error al guardar la mesa')
  }
}

const handleCreateOrder = async (
  items: { productId: string; quantity: number; notes?: string }[],
  orderNotes?: string,
) => {
  try {
    if (!selectedTable.value) {
      alert('Error: No se ha seleccionado una mesa')
      return
    }

    await orderStore.createOrder({
      tableId: selectedTable.value.id,
      items,
      notes: orderNotes,
    })

    // Actualizar el estado de la mesa a ocupada
    await tableStore.updateTable(selectedTable.value.id, { status: TableStatus.OCCUPIED })

    showMenuModal.value = false
    selectedTable.value = null

    alert('¡Orden creada exitosamente!')
  } catch (error: any) {
    alert(error.message || 'Error al crear la orden')
  }
}

const handleDelete = async (id: string) => {
  if (confirm('¿Estás seguro de eliminar esta mesa?')) {
    try {
      await tableStore.deleteTable(id)
    } catch (error: any) {
      alert(error.message || 'Error al eliminar la mesa')
    }
  }
}

const handleStatusChange = async (id: string, status: TableStatus) => {
  try {
    await tableStore.updateTable(id, { status })
  } catch (error: any) {
    alert(error.message || 'Error al cambiar el estado')
  }
}
</script>

<template>
  <div class="tables-view">
    <div class="header">
      <div class="header-content">
        <h1>Gestión de Mesas</h1>
        <button @click="openCreateModal" class="btn-add">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nueva Mesa
        </button>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ tableStore.tables.length }}</div>
          <div class="stat-label">Total Mesas</div>
        </div>
        <div class="stat-card available">
          <div class="stat-value">{{ tableStore.availableTables.length }}</div>
          <div class="stat-label">Disponibles</div>
        </div>
        <div class="stat-card occupied">
          <div class="stat-value">{{ tableStore.occupiedTables.length }}</div>
          <div class="stat-label">Ocupadas</div>
        </div>
        <div class="stat-card reserved">
          <div class="stat-value">{{ tableStore.reservedTables.length }}</div>
          <div class="stat-label">Reservadas</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ tableStore.totalCapacity }}</div>
          <div class="stat-label">Capacidad Total</div>
        </div>
      </div>
    </div>

    <div class="filters">
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
          v-model="searchQuery"
          type="text"
          placeholder="Buscar mesa..."
          class="search-input"
        />
      </div>

      <div class="filter-buttons">
        <button
          @click="filterStatus = 'all'"
          :class="['filter-btn', { active: filterStatus === 'all' }]"
        >
          Todas
        </button>
        <button
          @click="filterStatus = TableStatus.AVAILABLE"
          :class="['filter-btn', 'available', { active: filterStatus === TableStatus.AVAILABLE }]"
        >
          Disponibles
        </button>
        <button
          @click="filterStatus = TableStatus.OCCUPIED"
          :class="['filter-btn', 'occupied', { active: filterStatus === TableStatus.OCCUPIED }]"
        >
          Ocupadas
        </button>
        <button
          @click="filterStatus = TableStatus.RESERVED"
          :class="['filter-btn', 'reserved', { active: filterStatus === TableStatus.RESERVED }]"
        >
          Reservadas
        </button>
      </div>
    </div>

    <div v-if="tableStore.loading" class="loading">
      <div class="spinner"></div>
      <p>Cargando mesas...</p>
    </div>

    <div v-else-if="tableStore.error" class="error-message">
      {{ tableStore.error }}
    </div>

    <div v-else-if="filteredTables.length === 0" class="empty-state">
      <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <h3>No hay mesas</h3>
      <p>
        {{
          searchQuery
            ? 'No se encontraron mesas con ese criterio'
            : 'Comienza creando tu primera mesa'
        }}
      </p>
    </div>

    <div v-else class="tables-grid">
      <TableCard
        v-for="table in filteredTables"
        :key="table.id"
        :table="table"
        @edit="openEditModal"
        @delete="handleDelete"
        @change-status="handleStatusChange"
        @take-order="openTakeOrderModal"
      />
    </div>

    <TableModal
      :show="showTableModal"
      :table="selectedTable"
      :is-edit="isEdit"
      @close="showTableModal = false"
      @submit="handleSubmit"
    />

    <MenuModal
      :show="showMenuModal"
      :table="selectedTable"
      :is-for-takeout="false"
      @close="showMenuModal = false"
      @submit="handleCreateOrder"
    />
  </div>
</template>

<style scoped>
.tables-view {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.header {
  margin-bottom: 32px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-content h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.icon {
  width: 20px;
  height: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #3b82f6;
}

.stat-card.available {
  border-left-color: #10b981;
}

.stat-card.occupied {
  border-left-color: #ef4444;
}

.stat-card.reserved {
  border-left-color: #f59e0b;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 10px 20px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.filter-btn:hover {
  border-color: #d1d5db;
  background-color: #f9fafb;
}

.filter-btn.active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.filter-btn.available.active {
  background-color: #10b981;
  border-color: #10b981;
}

.filter-btn.occupied.active {
  background-color: #ef4444;
  border-color: #ef4444;
}

.filter-btn.reserved.active {
  background-color: #f59e0b;
  border-color: #f59e0b;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  background-color: #fee2e2;
  color: #dc2626;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-state p {
  color: #6b7280;
  margin: 0;
}

@media (max-width: 768px) {
  .tables-view {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .filters {
    flex-direction: column;
  }

  .tables-grid {
    grid-template-columns: 1fr;
  }
}
</style>
