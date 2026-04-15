<!-- src/views/OrdersView.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useOrderStore } from '@/stores/orderStore'
import { useTableStore } from '@/stores/tableStore'
import { useRouter } from 'vue-router'
import OrderCard from '@/components/OrderCard.vue'
import MenuModal from '@/components/MenuModal.vue'
import ConfirmationModal from '@/components/Confirmationmodal.vue'
import StatsFiltersPanel from '@/components/StatsFilterPanel.vue'
import type { Order, OrderItemStatus } from '@/types/order'
import { OrderStatus } from '@/types/order'
import type { Table } from '@/types/table'
import OrderDetailModal from '@/components/OrderDetailModal.vue'
import type { StatCard, FilterOption } from '@/types/statsFilter'

const orderStore = useOrderStore()
const tableStore = useTableStore()
const router = useRouter()

const showMenuModal = ref(false)
const selectedTable = ref<Table | null>(null)
const isForTakeout = ref(false)
const filterStatus = ref<string>('open')
const searchQuery = ref('')
const selectedOrderId = ref<string | null>(null)
const showOrderDetailModal = ref(false)
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

// Estados para el modal de confirmación
const showDeleteConfirmation = ref(false)
const orderToDelete = ref<string | null>(null)

const showCancelConfirmation = ref(false)
const orderToCancel = ref<{ id: string; status: OrderStatus } | null>(null)

onMounted(async () => {
  await Promise.all([orderStore.fetchOrders({ status: 'open' }), tableStore.fetchTables()])
})

// ─── Datos para StatsFiltersPanel ──────────────────────────────────────────

// Configuración de las tarjetas de estadísticas (excluye pagadas - van a Cash Closure)
const statsData = computed<StatCard[]>(() => {
  const orders = orderStore.orders

  return [
    {
      icon: '📋',
      value: orders.filter((o) => o.status === OrderStatus.OPEN).length,
      label: 'Abiertas',
      colorKey: 'green',
    },
    {
      icon: '⚙️',
      value: orders.filter((o) => o.status === OrderStatus.IN_PROGRESS).length,
      label: 'En Progreso',
      colorKey: 'blue',
    },
    {
      icon: '✅',
      value: orders.filter((o) => o.status === OrderStatus.READY).length,
      label: 'Listas',
      colorKey: 'yellow',
    },
    {
      icon: '🚚',
      value: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
      label: 'Entregadas',
      colorKey: 'purple',
    },
    {
      icon: '❌',
      value: orders.filter((o) => o.status === OrderStatus.CANCELLED).length,
      label: 'Canceladas',
      colorKey: 'red',
    },
  ]
})

// Configuración de los filtros
const filterOptions = computed<FilterOption[]>(() => [
  {
    value: 'all',
    label: 'Todas',
    colorKey: 'default',
    dot: true,
  },
  {
    value: 'open',
    label: 'Abiertas',
    colorKey: 'green',
    dot: true,
  },
  {
    value: 'in_progress',
    label: 'En Progreso',
    colorKey: 'blue',
    dot: true,
  },
  {
    value: 'delivered',
    label: 'Entregadas',
    colorKey: 'purple',
    dot: true,
  },
  {
    value: 'cancelled',
    label: 'Canceladas',
    colorKey: 'red',
    dot: true,
  },
])

// ─── Filtrado de órdenes ───────────────────────────────────────────────────

const filteredOrders = computed(() => {
  let result = orderStore.orders

  if (filterStatus.value !== 'all') {
    result = result.filter((o) => o.status === filterStatus.value)
  } else {
    // When showing "all", exclude paid orders — those belong to Cash Closure
    result = result.filter((o) => o.status !== OrderStatus.PAID)
  }

  if (searchQuery.value) {
    result = result.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        o.table?.tableNumber.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }

  return result
})

// ─── Métodos existentes ────────────────────────────────────────────────────

const openTableOrderModal = (table: Table) => {
  selectedTable.value = table
  isForTakeout.value = false
  showMenuModal.value = true
}

const openTakeoutOrderModal = () => {
  selectedTable.value = null
  isForTakeout.value = true
  showMenuModal.value = true
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
    await orderStore.createOrder({
      tableId: selectedTable.value?.id || null,
      items,
      notes: orderNotes,
    })

    showMenuModal.value = false
    selectedTable.value = null

    await Promise.all([
      orderStore.fetchOrders({
        status: filterStatus.value === 'all' ? undefined : filterStatus.value,
      }),
      tableStore.fetchTables(),
    ])

    triggerToast('¡Orden creada exitosamente!', 'success')
  } catch (error: any) {
    triggerToast(error.message || 'Error al crear la orden', 'error')
  }
}

const handleViewOrder = (order: Order) => {
  selectedOrderId.value = order.id
  showOrderDetailModal.value = true
}

const handleUpdateStatus = (id: string, status: OrderStatus) => {
  orderToCancel.value = { id, status }
  showCancelConfirmation.value = true
}

const confirmCancelOrder = async () => {
  if (!orderToCancel.value) return

  try {
    await orderStore.updateOrderStatus(orderToCancel.value.id, orderToCancel.value.status)

    await Promise.all([
      orderStore.fetchOrders({
        status: filterStatus.value === 'all' ? undefined : filterStatus.value,
      }),
      tableStore.fetchTables(),
    ])

    triggerToast('Orden cancelada exitosamente', 'success')
  } catch (error: any) {
    triggerToast(error.message || 'Error al cancelar la orden', 'error')
  } finally {
    showCancelConfirmation.value = false
    orderToCancel.value = null
  }
}

const handleDelete = (id: string) => {
  orderToDelete.value = id
  showDeleteConfirmation.value = true
}

const confirmDeleteOrder = async () => {
  if (!orderToDelete.value) return

  try {
    await orderStore.deleteOrder(orderToDelete.value)
    triggerToast('Orden eliminada exitosamente', 'success')
  } catch (error: any) {
    triggerToast(error.message || 'Error al eliminar la orden', 'error')
  } finally {
    showDeleteConfirmation.value = false
    orderToDelete.value = null
  }
}

const handleFilterChange = async (status: string) => {
  filterStatus.value = status
  // Never fetch 'paid' from this view — those go to Cash Closure
  await orderStore.fetchOrders({
    status: status === 'all' ? undefined : status,
  })
}

const handleUpdateItemStatus = async (itemId: string, status: OrderItemStatus) => {
  try {
    await orderStore.updateOrderItem(itemId, { status })
    if (selectedOrderId.value) {
      await orderStore.fetchOrderById(selectedOrderId.value)
    }
    triggerToast('Estado del item actualizado', 'success')
  } catch (error: any) {
    triggerToast(error.message || 'Error al actualizar estado del item', 'error')
  }
}
</script>

<template>
  <div class="orders-view">
    <!-- Header con diseño mejorado -->
    <div class="header">
      <div class="header-content">
        <div class="title-section">
          <h1>Gestión de Órdenes</h1>
          <p class="subtitle">Administra y da seguimiento a todas las órdenes</p>
        </div>
        <div class="header-actions">
          <button @click="openTakeoutOrderModal" class="btn-add takeout">
            <span class="btn-icon">🥡</span>
            <span class="btn-text">Para Llevar</span>
          </button>
        </div>
      </div>

      <!-- Toast notifications -->
      <Transition name="toast">
        <div v-if="showToast" :class="['toast', toastType]">
          <span class="toast-icon">{{ toastType === 'success' ? '✓' : '✗' }}</span>
          {{ toastMessage }}
        </div>
      </Transition>

      <!-- StatsFiltersPanel Component - Reemplaza stats-grid -->
      <StatsFiltersPanel
        :stats="statsData"
        :filters="filterOptions"
        v-model="filterStatus"
        v-model:searchQuery="searchQuery"
        search-placeholder="Buscar por número de orden o mesa..."
        :show-search="true"
        :show-filters="true"
      >
        <!-- SLOT BETWEEN -->
        <template #extra>
          <div class="available-tables-section inside-panel">
            <div class="section-header">
              <h2>Mesas Disponibles</h2>
              <span class="section-badge"> {{ tableStore.availableTables.length }} mesas </span>
            </div>

            <div v-if="tableStore.availableTables.length === 0" class="empty-state small">
              <span class="empty-icon">🪑</span>
              <p>No hay mesas disponibles en este momento</p>
            </div>

            <div v-else class="tables-grid">
              <div
                v-for="table in tableStore.availableTables"
                :key="table.id"
                class="table-quick-card"
                @click="openTableOrderModal(table)"
              >
                <div class="table-number">
                  <span class="table-icon">🍽️</span>
                  <h3>Mesa {{ table.tableNumber }}</h3>
                </div>
                <p class="table-capacity">
                  🪑 {{ table.capacity }} {{ table.capacity === 1 ? 'persona' : 'personas' }}
                </p>
                <div class="quick-action">
                  <span class="action-icon">➕</span>
                  <span class="action-text">Tomar Orden</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </StatsFiltersPanel>
    </div>

    <!-- Divisor decorativo -->
    <div class="divider">
      <span class="divider-text">Órdenes Activas</span>
    </div>

    <!-- Estados de carga y error -->
    <div v-if="orderStore.loading" class="loading">
      <div class="spinner"></div>
      <p>Cargando órdenes...</p>
    </div>

    <div v-else-if="orderStore.error" class="error-message">
      <span class="error-icon">⚠️</span>
      {{ orderStore.error }}
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredOrders.length === 0" class="empty-state">
      <div class="empty-icon">📝</div>
      <h3>No hay órdenes</h3>
      <p>
        {{
          searchQuery
            ? 'No se encontraron órdenes con ese criterio'
            : 'No hay órdenes en este momento'
        }}
      </p>
      <button v-if="searchQuery" @click="searchQuery = ''" class="btn-clear">
        Limpiar búsqueda
      </button>
    </div>

    <!-- Orders Grid -->
    <div v-else class="orders-grid">
      <OrderCard
        v-for="order in filteredOrders"
        :key="order.id"
        :order="order"
        @view="handleViewOrder"
        @update-status="handleUpdateStatus"
        @delete="handleDelete"
      />
    </div>

    <!-- Modales -->
    <OrderDetailModal
      :show="showOrderDetailModal"
      :order-id="selectedOrderId"
      @close="showOrderDetailModal = false"
      @update-item-status="handleUpdateItemStatus"
    />

    <ConfirmationModal
      :show="showDeleteConfirmation"
      title="¿Eliminar orden?"
      message="¿Estás seguro de eliminar esta orden? Esta acción no se puede deshacer."
      confirm-text="Sí, eliminar"
      cancel-text="Cancelar"
      type="danger"
      @confirm="confirmDeleteOrder"
      @cancel="showDeleteConfirmation = false"
    />

    <ConfirmationModal
      :show="showCancelConfirmation"
      title="¿Cancelar orden?"
      message="¿Estás seguro de cancelar esta orden?"
      confirm-text="Sí, cancelar"
      cancel-text="No"
      type="warning"
      @confirm="confirmCancelOrder"
      @cancel="showCancelConfirmation = false"
    />

    <MenuModal
      :show="showMenuModal"
      :table="selectedTable"
      :is-for-takeout="isForTakeout"
      @close="showMenuModal = false"
      @submit="handleCreateOrder"
    />
  </div>
</template>

<style scoped>
.orders-view {
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

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.75rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add.takeout {
  background: linear-gradient(145deg, #f59e0b, #d97706);
  color: white;
  box-shadow: 0 5px 15px rgba(245, 158, 11, 0.3);
}

.btn-add.takeout:hover {
  background: linear-gradient(145deg, #d97706, #b45309);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.4);
}

.btn-icon {
  font-size: 1.2rem;
}

/* Available Tables Section */
.available-tables-section {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.section-header h2 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #051b3a;
  margin: 0;
}

.section-badge {
  background: #e4f4fc;
  color: #609abb;
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-size: 0.85rem;
  font-weight: 600;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.table-quick-card {
  background: linear-gradient(145deg, #609abb, #5d7a90);
  color: white;
  border-radius: 16px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

.table-quick-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(-100%);
  transition: transform 0.3s ease;
}

.table-quick-card:hover::before {
  transform: translateX(0);
}

.table-quick-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 25px rgba(5, 27, 58, 0.3);
}

.table-number {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.table-icon {
  font-size: 1.2rem;
}

.table-quick-card h3 {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.table-capacity {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0 0 1rem 0;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  justify-content: center;
}

/* Divider */
.divider {
  position: relative;
  text-align: center;
  margin: 2rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #609abb, #b4cbd8, #609abb, transparent);
  transform: translateY(-50%);
}

.divider-text {
  background: #e4f4fc;
  padding: 0.5rem 1.5rem;
  color: #609abb;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-radius: 30px;
  position: relative;
  border: 2px solid white;
}

/* Orders Grid */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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

.empty-state.small {
  padding: 2rem;
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

/* Responsive */
@media (max-width: 768px) {
  .orders-view {
    padding: 1rem;
  }

  .title-section h1 {
    font-size: 1.8rem;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .header-actions {
    width: 100%;
    flex-direction: column;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
  }

  .orders-grid {
    grid-template-columns: 1fr;
  }

  .tables-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .toast {
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
}

@media (max-width: 480px) {
  .available-tables-section {
    padding: 1rem;
  }

  .table-quick-card {
    padding: 1rem;
  }

  .table-quick-card h3 {
    font-size: 1rem;
  }
}
</style>
