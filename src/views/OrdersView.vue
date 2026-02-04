<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useOrderStore } from '@/stores/orderStore'
import { useTableStore } from '@/stores/tableStore'
import OrderCard from '@/components/OrderCard.vue'
import MenuModal from '@/components/MenuModal.vue'
import type { Order, OrderStatus } from '@/types/order'
import type { Table } from '@/types/table'
import { TableStatus } from '@/types/table'

const orderStore = useOrderStore()
const tableStore = useTableStore()

const showMenuModal = ref(false)
const selectedTable = ref<Table | null>(null)
const isForTakeout = ref(false)
const filterStatus = ref<string>('open')
const searchQuery = ref('')
const selectedOrderId = ref<string | null>(null)

onMounted(async () => {
  await Promise.all([orderStore.fetchOrders({ status: 'open' }), tableStore.fetchTables()])
})

const filteredOrders = computed(() => {
  let result = orderStore.orders

  if (filterStatus.value !== 'all') {
    result = result.filter((o) => o.status === filterStatus.value)
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
    // Actualizar el estado de la mesa si es necesario
    if (selectedTable.value) {
      await tableStore.updateTable(selectedTable.value.id, { status: TableStatus.OCCUPIED })
    }
    selectedTable.value = null
  } catch (error: any) {
    alert(error.message || 'Error al crear la orden')
  }
}

const handleViewOrder = (order: Order) => {
  selectedOrderId.value = order.id
  // Aquí podrías abrir un modal de detalle o navegar a otra vista
  // Por ahora solo mostramos un alert
  alert(`Ver detalle de orden: ${order.orderNumber}`)
}

const handleUpdateStatus = async (id: string, status: OrderStatus) => {
  try {
    await orderStore.updateOrderStatus(id, status)
    // Si se cierra una orden, liberar la mesa
    if (status === 'closed') {
      const order = orderStore.getOrderById(id)
      if (order?.table) {
        await tableStore.updateTable(order.table.id, { status: TableStatus.AVAILABLE })
      }
    }
  } catch (error: any) {
    alert(error.message || 'Error al actualizar estado')
  }
}

const handleDelete = async (id: string) => {
  if (confirm('¿Estás seguro de eliminar esta orden?')) {
    try {
      await orderStore.deleteOrder(id)
    } catch (error: any) {
      alert(error.message || 'Error al eliminar orden')
    }
  }
}

const handleFilterChange = async (status: string) => {
  filterStatus.value = status
  if (status === 'all') {
    await orderStore.fetchOrders()
  } else {
    await orderStore.fetchOrders({ status })
  }
}
</script>

<template>
  <div class="orders-view">
    <div class="header">
      <div class="header-content">
        <h1>Gestión de Órdenes</h1>
        <div class="header-actions">
          <button @click="openTakeoutOrderModal" class="btn-add takeout">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Para Llevar
          </button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card open">
          <div class="stat-value">{{ orderStore.openOrders.length }}</div>
          <div class="stat-label">Órdenes Abiertas</div>
        </div>
        <div class="stat-card closed">
          <div class="stat-value">{{ orderStore.closedOrders.length }}</div>
          <div class="stat-label">Órdenes Cerradas</div>
        </div>
        <div class="stat-card cancelled">
          <div class="stat-value">{{ orderStore.cancelledOrders.length }}</div>
          <div class="stat-label">Órdenes Canceladas</div>
        </div>
      </div>
    </div>

    <div class="available-tables-section">
      <h2>Mesas Disponibles - Tomar Orden</h2>
      <div v-if="tableStore.availableTables.length === 0" class="empty-state">
        <p>No hay mesas disponibles en este momento</p>
      </div>
      <div v-else class="tables-grid">
        <div
          v-for="table in tableStore.availableTables"
          :key="table.id"
          class="table-quick-card"
          @click="openTableOrderModal(table)"
        >
          <h3>Mesa {{ table.tableNumber }}</h3>
          <p>Capacidad: {{ table.capacity }} personas</p>
          <div class="quick-action">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Tomar Orden
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

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
          placeholder="Buscar orden o mesa..."
          class="search-input"
        />
      </div>

      <div class="filter-buttons">
        <button
          @click="handleFilterChange('all')"
          :class="['filter-btn', { active: filterStatus === 'all' }]"
        >
          Todas
        </button>
        <button
          @click="handleFilterChange('open')"
          :class="['filter-btn', 'open', { active: filterStatus === 'open' }]"
        >
          Abiertas
        </button>
        <button
          @click="handleFilterChange('closed')"
          :class="['filter-btn', 'closed', { active: filterStatus === 'closed' }]"
        >
          Cerradas
        </button>
        <button
          @click="handleFilterChange('cancelled')"
          :class="['filter-btn', 'cancelled', { active: filterStatus === 'cancelled' }]"
        >
          Canceladas
        </button>
      </div>
    </div>

    <div v-if="orderStore.loading" class="loading">
      <div class="spinner"></div>
      <p>Cargando órdenes...</p>
    </div>

    <div v-else-if="orderStore.error" class="error-message">
      {{ orderStore.error }}
    </div>

    <div v-else-if="filteredOrders.length === 0" class="empty-state">
      <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3>No hay órdenes</h3>
      <p>
        {{
          searchQuery
            ? 'No se encontraron órdenes con ese criterio'
            : 'No hay órdenes en este momento'
        }}
      </p>
    </div>

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

.header-actions {
  display: flex;
  gap: 12px;
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

.btn-add.takeout {
  background-color: #f59e0b;
}

.btn-add.takeout:hover {
  background-color: #d97706;
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

.stat-card.open {
  border-left-color: #10b981;
}

.stat-card.closed {
  border-left-color: #6b7280;
}

.stat-card.cancelled {
  border-left-color: #ef4444;
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

.available-tables-section {
  margin-bottom: 32px;
}

.available-tables-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.table-quick-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
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
  transition: transform 0.3s;
}

.table-quick-card:hover::before {
  transform: translateX(0);
}

.table-quick-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
}

.table-quick-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.table-quick-card p {
  font-size: 14px;
  opacity: 0.9;
  margin: 0 0 12px 0;
}

.quick-action {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}

.divider {
  height: 1px;
  background: #e5e7eb;
  margin: 32px 0;
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

.filter-btn.open.active {
  background-color: #10b981;
  border-color: #10b981;
}

.filter-btn.closed.active {
  background-color: #6b7280;
  border-color: #6b7280;
}

.filter-btn.cancelled.active {
  background-color: #ef4444;
  border-color: #ef4444;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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
  .orders-view {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .header-actions {
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .filters {
    flex-direction: column;
  }

  .orders-grid {
    grid-template-columns: 1fr;
  }

  .tables-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
