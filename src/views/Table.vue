<!-- src/views/TablesView.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTableStore } from '@/stores/tableStore'
import { useOrderStore } from '@/stores/orderStore'
import TableCard from '@/components/TableCard.vue'
import TableModal from '@/components/TableModal.vue'
import MenuModal from '@/components/MenuModal.vue'
import StatsFiltersPanel from '@/components/StatsFilterPanel.vue'
import type { Table, CreateTableDTO } from '@/types/table'
import { TableStatus } from '@/types/table'
import ConfirmationModal from '@/components/Confirmationmodal.vue'
import type { StatCard, FilterOption } from '@/types/statsFilter'

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
const showConfirmDelete = ref(false)
const tableToDeleteId = ref<string | null>(null)

onMounted(async () => {
  await tableStore.fetchTables()
})

// ─── Datos para StatsFiltersPanel ──────────────────────────────────────────

// Configuración de las tarjetas de estadísticas
const statsData = computed<StatCard[]>(() => [
  {
    icon: '📊',
    value: tableStore.tables.length,
    label: 'Total Mesas',
    colorKey: 'default',
  },
  {
    icon: '✅',
    value: tableStore.availableTables.length,
    label: 'Disponibles',
    colorKey: 'green',
  },
  {
    icon: '👥',
    value: tableStore.occupiedTables.length,
    label: 'Ocupadas',
    colorKey: 'red',
  },
  {
    icon: '📅',
    value: tableStore.reservedTables.length,
    label: 'Reservadas',
    colorKey: 'yellow',
  },
  {
    icon: '🪑',
    value: tableStore.totalCapacity,
    label: 'Capacidad Total',
    colorKey: 'purple',
  },
])

// Configuración de los filtros
const filterOptions = computed<FilterOption[]>(() => [
  {
    value: 'all',
    label: 'Todas',
    colorKey: 'default',
    dot: true,
  },
  {
    value: TableStatus.AVAILABLE,
    label: 'Disponibles',
    colorKey: 'green',
    dot: true,
  },
  {
    value: TableStatus.OCCUPIED,
    label: 'Ocupadas',
    colorKey: 'red',
    dot: true,
  },
  {
    value: TableStatus.RESERVED,
    label: 'Reservadas',
    colorKey: 'yellow',
    dot: true,
  },
])

// ─── Filtrado de mesas ─────────────────────────────────────────────────────

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

// ─── Métodos existentes (sin cambios) ──────────────────────────────────────

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

    // Refrescamos las órdenes antes de decidir para tener el estado más reciente
    await orderStore.fetchOrders()

    const openOrdersForTable = orderStore.orders.filter(
      (order) => order.table?.id === selectedTable.value?.id && order.status === 'open',
    )

    const existingOpenOrder = openOrdersForTable
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    if (existingOpenOrder) {
      // Solo se agregan items si la orden más reciente está en "open"
      await orderStore.addOrderItems(existingOpenOrder.id, { items })

      if (selectedTable.value.status !== TableStatus.OCCUPIED) {
        await tableStore.updateTable(selectedTable.value.id, { status: TableStatus.OCCUPIED })
      }

      triggerToast('¡Items agregados a la orden existente!', 'success')
    } else {
      // No hay orden "open": puede estar in_progress, closed, u otro estado
      // Se libera la mesa temporalmente para que el backend permita crear la nueva orden
      const wasOccupied = selectedTable.value.status === TableStatus.OCCUPIED

      if (wasOccupied) {
        await tableStore.updateTable(selectedTable.value.id, { status: TableStatus.AVAILABLE })
      }

      await orderStore.createOrder({
        tableId: selectedTable.value.id,
        items,
        notes: orderNotes,
      })

      await tableStore.updateTable(selectedTable.value.id, { status: TableStatus.OCCUPIED })

      triggerToast('¡Nueva orden creada exitosamente!', 'success')
    }

    showMenuModal.value = false
    selectedTable.value = null

    await Promise.all([orderStore.fetchOrders(), tableStore.fetchTables()])
  } catch (error: any) {
    triggerToast(error.message || 'Error al procesar la orden', 'error')
  }
}

const handleDelete = (id: string) => {
  tableToDeleteId.value = id
  showConfirmDelete.value = true
}

const confirmDelete = async () => {
  if (!tableToDeleteId.value) return
  try {
    await tableStore.deleteTable(tableToDeleteId.value)
    triggerToast('Mesa eliminada correctamente', 'success')
  } catch (error: any) {
    const raw = error.message || ''
    const message = raw.toLowerCase().includes('valid role')
      ? 'Necesitas ser administrador o manager para realizar esta acción.'
      : 'Error al eliminar la mesa. Intenta de nuevo.'
    triggerToast(message, 'error')
  } finally {
    showConfirmDelete.value = false
    tableToDeleteId.value = null
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

      <!-- StatsFiltersPanel Component - Reemplaza stats-grid y filters-section -->
      <StatsFiltersPanel
        :stats="statsData"
        :filters="filterOptions"
        v-model="filterStatus"
        v-model:searchQuery="searchQuery"
        search-placeholder="Buscar por número de mesa..."
        :show-search="true"
        :show-filters="true"
      />
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

    <ConfirmationModal
      :show="showConfirmDelete"
      title="Eliminar Mesa"
      message="¿Estás seguro de que deseas eliminar esta mesa? Esta acción no se puede deshacer."
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      type="danger"
      @confirm="confirmDelete"
      @cancel="showConfirmDelete = false"
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
  .tables-grid {
    grid-template-columns: 1fr;
  }
}
</style>
