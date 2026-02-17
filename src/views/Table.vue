<!-- src/views/TablesView.vue -->
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
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

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

const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, 3000)
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

    const openOrdersForTable = orderStore.orders.filter(
      (order) => order.table?.id === selectedTable.value?.id && order.status === 'open',
    )

    const existingOrder = openOrdersForTable
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    if (existingOrder) {
      await orderStore.addOrderItems(existingOrder.id, { items })

      if (selectedTable.value.status !== TableStatus.OCCUPIED) {
        await tableStore.updateTable(selectedTable.value.id, { status: TableStatus.OCCUPIED })
      }

      triggerToast('¡Items agregados a la orden existente!', 'success')
    } else {
      await orderStore.createOrder({
        tableId: selectedTable.value.id,
        items,
        notes: orderNotes,
      })

      if (selectedTable.value.status !== TableStatus.OCCUPIED) {
        await tableStore.updateTable(selectedTable.value.id, { status: TableStatus.OCCUPIED })
      }

      triggerToast('¡Orden creada exitosamente!', 'success')
    }

    showMenuModal.value = false
    selectedTable.value = null

    await Promise.all([orderStore.fetchOrders(), tableStore.fetchTables()])
  } catch (error: any) {
    triggerToast(error.message || 'Error al procesar la orden')
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
    <!-- Header con diseño mejorado -->
    <div class="header">
      <div class="header-content">
        <div class="title-section">
          <h1>Gestión de Mesas</h1>
          <p class="subtitle">Administra el estado y disposición de las mesas</p>
        </div>
        <button @click="openCreateModal" class="btn-add">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Nueva Mesa</span>
        </button>
      </div>

      <Transition name="toast">
        <div v-if="showToast" :class="['toast', toastType]">
          <span class="toast-icon">{{ toastType === 'success' ? '✓' : '✗' }}</span>
          {{ toastMessage }}
        </div>
      </Transition>

      <!-- Tarjetas de estadísticas -->
      <div class="stats-grid">
        <div class="stat-card total">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ tableStore.tables.length }}</div>
            <div class="stat-label">Total Mesas</div>
          </div>
        </div>
        <div class="stat-card available">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ tableStore.availableTables.length }}</div>
            <div class="stat-label">Disponibles</div>
          </div>
        </div>
        <div class="stat-card occupied">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-value">{{ tableStore.occupiedTables.length }}</div>
            <div class="stat-label">Ocupadas</div>
          </div>
        </div>
        <div class="stat-card reserved">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-value">{{ tableStore.reservedTables.length }}</div>
            <div class="stat-label">Reservadas</div>
          </div>
        </div>
        <div class="stat-card capacity">
          <div class="stat-icon">🪑</div>
          <div class="stat-content">
            <div class="stat-value">{{ tableStore.totalCapacity }}</div>
            <div class="stat-label">Capacidad Total</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros y búsqueda -->
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
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por número de mesa..."
          class="search-input"
        />
      </div>

      <div class="filter-buttons">
        <button
          @click="filterStatus = 'all'"
          :class="['filter-btn', { active: filterStatus === 'all' }]"
        >
          <span class="filter-dot all"></span>
          Todas
        </button>
        <button
          @click="filterStatus = TableStatus.AVAILABLE"
          :class="['filter-btn', 'available', { active: filterStatus === TableStatus.AVAILABLE }]"
        >
          <span class="filter-dot available"></span>
          Disponibles
        </button>
        <button
          @click="filterStatus = TableStatus.OCCUPIED"
          :class="['filter-btn', 'occupied', { active: filterStatus === TableStatus.OCCUPIED }]"
        >
          <span class="filter-dot occupied"></span>
          Ocupadas
        </button>
        <button
          @click="filterStatus = TableStatus.RESERVED"
          :class="['filter-btn', 'reserved', { active: filterStatus === TableStatus.RESERVED }]"
        >
          <span class="filter-dot reserved"></span>
          Reservadas
        </button>
      </div>
    </div>

    <!-- Estados de carga y error -->
    <div v-if="tableStore.loading" class="loading">
      <div class="spinner"></div>
      <p>Cargando mesas...</p>
    </div>

    <div v-else-if="tableStore.error" class="error-message">
      <span class="error-icon">⚠️</span>
      {{ tableStore.error }}
    </div>

    <!-- Estado vacío -->
    <div v-else-if="filteredTables.length === 0" class="empty-state">
      <div class="empty-icon">🍽️</div>
      <h3>No hay mesas disponibles</h3>
      <p>
        {{
          searchQuery
            ? 'No se encontraron mesas con ese criterio'
            : 'Comienza creando tu primera mesa'
        }}
      </p>
      <button v-if="searchQuery" @click="searchQuery = ''" class="btn-clear">
        Limpiar búsqueda
      </button>
    </div>

    <!-- Grid de mesas -->
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

    <!-- Modales -->
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
  min-height: 100vh;
  background-color: #e4f4fc;
  padding: 2rem;
}

/* Header Styles */
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

.btn-add {
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

.btn-add:hover {
  background: linear-gradient(145deg, #5d7a90, #051b3a);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.3);
}

.btn-add:active {
  transform: translateY(0);
}

.icon {
  width: 20px;
  height: 20px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  border: 1px solid rgba(96, 154, 187, 0.1);
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.1);
}

.stat-card.total {
  border-left: 4px solid #609abb;
}
.stat-card.available {
  border-left: 4px solid #10b981;
}
.stat-card.occupied {
  border-left: 4px solid #ef4444;
}
.stat-card.reserved {
  border-left: 4px solid #f59e0b;
}
.stat-card.capacity {
  border-left: 4px solid #8b5cf6;
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
  padding: 1.5rem;
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
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: #e4f4fc;
  color: #051b3a;
}

.search-input::placeholder {
  color: #b4cbd8;
}

.search-input:focus {
  outline: none;
  border-color: #609abb;
  background: white;
  box-shadow: 0 0 0 4px rgba(96, 154, 187, 0.1);
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: 2px solid #e4f4fc;
  background: white;
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #5d7a90;
}

.filter-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.filter-dot.all {
  background: #609abb;
}
.filter-dot.available {
  background: #10b981;
}
.filter-dot.occupied {
  background: #ef4444;
}
.filter-dot.reserved {
  background: #f59e0b;
}

.filter-btn:hover {
  border-color: #609abb;
  background: #e4f4fc;
  color: #051b3a;
}

.filter-btn.active {
  background: #609abb;
  color: white;
  border-color: #609abb;
}

.filter-btn.active .filter-dot {
  background: white;
}

.filter-btn.available.active {
  background: #10b981;
  border-color: #10b981;
}

.filter-btn.occupied.active {
  background: #ef4444;
  border-color: #ef4444;
}

.filter-btn.reserved.active {
  background: #f59e0b;
  border-color: #f59e0b;
}

/* Tables Grid */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.5rem;
}

/* Loading State */
.loading {
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
  font-size: 4rem;
  margin-bottom: 1.5rem;
  background: #e4f4fc;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state h3 {
  font-size: 1.5rem;
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

/* Toast Styles */
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

.toast-icon {
  font-size: 1.25rem;
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

/* Responsive */
@media (max-width: 768px) {
  .tables-view {
    padding: 1rem;
  }

  .title-section h1 {
    font-size: 1.8rem;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .filters-section {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .filter-buttons {
    width: 100%;
    justify-content: center;
  }

  .filter-btn {
    flex: 1;
    justify-content: center;
  }

  .tables-grid {
    grid-template-columns: 1fr;
  }

  .toast {
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filter-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
}
</style>
