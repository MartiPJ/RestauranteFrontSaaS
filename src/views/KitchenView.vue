<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useOrderStore } from '@/stores/orderStore'
import type { Order, OrderItem, OrderItemStatus } from '@/types/order'
import { OrderItemStatus as ItemStatus } from '@/types/order'

const orderStore = useOrderStore()

const filterStatus = ref<string>('pending')
const selectedOrder = ref<Order | null>(null)
const showDetailModal = ref(false)

// Auto-refresh cada 30 segundos
let refreshInterval: number | null = null

onMounted(async () => {
  await loadOrders()
  // Auto-refresh
  refreshInterval = window.setInterval(loadOrders, 30000)
})

onBeforeUnmount(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

async function loadOrders() {
  try {
    await orderStore.fetchOrders({ status: 'open' })
  } catch (error) {
    console.error('Error al cargar órdenes:', error)
  }
}

// Obtener todos los items de todas las órdenes abiertas
const allOrderItems = computed(() => {
  const items: (OrderItem & { order: Order })[] = []
  orderStore.openOrders.forEach((order) => {
    if (order.items) {
      order.items.forEach((item) => {
        items.push({ ...item, order })
      })
    }
  })
  return items
})

const filteredItems = computed(() => {
  if (filterStatus.value === 'all') {
    return allOrderItems.value
  }
  return allOrderItems.value.filter((item) => item.status === filterStatus.value)
})

const pendingItems = computed(() =>
  allOrderItems.value.filter((item) => item.status === ItemStatus.PENDING),
)

const preparingItems = computed(() =>
  allOrderItems.value.filter((item) => item.status === ItemStatus.PREPARING),
)

const servedItems = computed(() =>
  allOrderItems.value.filter((item) => item.status === ItemStatus.SERVED),
)

const statusConfig = (status: OrderItemStatus) => {
  switch (status) {
    case ItemStatus.PENDING:
      return { color: '#f59e0b', label: 'Pendiente', bgColor: '#fef3c7' }
    case ItemStatus.PREPARING:
      return { color: '#3b82f6', label: 'Preparando', bgColor: '#dbeafe' }
    case ItemStatus.SERVED:
      return { color: '#10b981', label: 'Servido', bgColor: '#d1fae5' }
    case ItemStatus.CANCELLED:
      return { color: '#ef4444', label: 'Cancelado', bgColor: '#fee2e2' }
    default:
      return { color: '#6b7280', label: 'Desconocido', bgColor: '#f3f4f6' }
  }
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffMinutes < 1) return 'Ahora'
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`
  const hours = Math.floor(diffMinutes / 60)
  return `Hace ${hours}h ${diffMinutes % 60}min`
}

async function updateItemStatus(itemId: string, status: OrderItemStatus) {
  try {
    await orderStore.updateOrderItem(itemId, { status })
    await loadOrders()
  } catch (error: any) {
    alert(error.message || 'Error al actualizar estado')
  }
}

async function updateItemQuantity(itemId: string, newQuantity: number) {
  if (newQuantity < 1) {
    if (confirm('¿Eliminar este item de la orden?')) {
      try {
        await orderStore.deleteOrderItem(itemId)
        await loadOrders()
      } catch (error: any) {
        alert(error.message || 'Error al eliminar item')
      }
    }
    return
  }

  try {
    await orderStore.updateOrderItem(itemId, { quantity: newQuantity })
    await loadOrders()
  } catch (error: any) {
    alert(error.message || 'Error al actualizar cantidad')
  }
}

function viewOrderDetail(order: Order) {
  selectedOrder.value = order
  showDetailModal.value = true
}
</script>

<template>
  <div class="kitchen-view">
    <div class="header">
      <div class="header-content">
        <h1>Vista de Cocina</h1>
        <button @click="loadOrders" class="btn-refresh">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Actualizar
        </button>
      </div>

      <div class="stats-grid">
        <div class="stat-card pending">
          <div class="stat-value">{{ pendingItems.length }}</div>
          <div class="stat-label">Pendientes</div>
        </div>
        <div class="stat-card preparing">
          <div class="stat-value">{{ preparingItems.length }}</div>
          <div class="stat-label">En Preparación</div>
        </div>
        <div class="stat-card served">
          <div class="stat-value">{{ servedItems.length }}</div>
          <div class="stat-label">Servidos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ orderStore.openOrders.length }}</div>
          <div class="stat-label">Órdenes Activas</div>
        </div>
      </div>
    </div>

    <div class="filters">
      <button
        @click="filterStatus = 'all'"
        :class="['filter-btn', { active: filterStatus === 'all' }]"
      >
        Todos
      </button>
      <button
        @click="filterStatus = ItemStatus.PENDING"
        :class="['filter-btn', 'pending', { active: filterStatus === ItemStatus.PENDING }]"
      >
        Pendientes
      </button>
      <button
        @click="filterStatus = ItemStatus.PREPARING"
        :class="['filter-btn', 'preparing', { active: filterStatus === ItemStatus.PREPARING }]"
      >
        En Preparación
      </button>
      <button
        @click="filterStatus = ItemStatus.SERVED"
        :class="['filter-btn', 'served', { active: filterStatus === ItemStatus.SERVED }]"
      >
        Servidos
      </button>
    </div>

    <div v-if="orderStore.loading" class="loading">
      <div class="spinner"></div>
      <p>Cargando órdenes...</p>
    </div>

    <div v-else-if="filteredItems.length === 0" class="empty-state">
      <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <h3>No hay items para mostrar</h3>
      <p>No hay items en este estado en este momento</p>
    </div>

    <div v-else class="items-grid">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="kitchen-item-card"
        :class="{
          urgent:
            formatTime(item.createdAt).includes('min') && parseInt(formatTime(item.createdAt)) > 15,
        }"
      >
        <div class="item-header">
          <div class="order-info">
            <h3 class="order-number">{{ item.order.orderNumber }}</h3>
            <span v-if="item.order.table" class="table-badge">
              Mesa {{ item.order.table.tableNumber }}
            </span>
            <span v-else class="takeout-badge">Para Llevar</span>
          </div>
          <span
            class="status-badge"
            :style="{
              backgroundColor: statusConfig(item.status).bgColor,
              color: statusConfig(item.status).color,
            }"
          >
            {{ statusConfig(item.status).label }}
          </span>
        </div>

        <div class="item-body">
          <div class="product-info">
            <img
              v-if="item.product.imageUrl"
              :src="item.product.imageUrl"
              :alt="item.product.name"
              class="product-image"
            />
            <div class="product-details">
              <h4>{{ item.product.name }}</h4>
              <div class="quantity-display">
                <span class="quantity-label">Cantidad:</span>
                <div class="quantity-controls">
                  <button @click="updateItemQuantity(item.id, item.quantity - 1)">-</button>
                  <span class="quantity">{{ item.quantity }}</span>
                  <button @click="updateItemQuantity(item.id, item.quantity + 1)">+</button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="item.notes" class="item-notes">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            <p>{{ item.notes }}</p>
          </div>

          <div class="item-time">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{{ formatTime(item.createdAt) }}</span>
          </div>
        </div>

        <div class="item-actions">
          <button
            v-if="item.status === ItemStatus.PENDING"
            @click="updateItemStatus(item.id, ItemStatus.PREPARING)"
            class="btn btn-primary"
          >
            Comenzar
          </button>
          <button
            v-if="item.status === ItemStatus.PREPARING"
            @click="updateItemStatus(item.id, ItemStatus.SERVED)"
            class="btn btn-success"
          >
            Servir
          </button>
          <button
            v-if="item.status !== ItemStatus.SERVED && item.status !== ItemStatus.CANCELLED"
            @click="updateItemStatus(item.id, ItemStatus.CANCELLED)"
            class="btn btn-danger"
          >
            Cancelar
          </button>
          <button @click="viewOrderDetail(item.order)" class="btn btn-secondary">Ver Orden</button>
        </div>
      </div>
    </div>

    <!-- Modal de Detalle de Orden -->
    <Transition name="modal">
      <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
        <div class="modal-container">
          <div class="modal-header">
            <h2>{{ selectedOrder?.orderNumber }}</h2>
            <button @click="showDetailModal = false" class="close-btn">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="order-detail-info">
              <div class="info-row">
                <strong>Mesa:</strong>
                <span v-if="selectedOrder?.table">{{ selectedOrder.table.tableNumber }}</span>
                <span v-else class="takeout-label">Para Llevar</span>
              </div>
              <div class="info-row">
                <strong>Mesero:</strong>
                <span>{{ selectedOrder?.user.name }}</span>
              </div>
              <div v-if="selectedOrder?.notes" class="info-row">
                <strong>Notas:</strong>
                <span>{{ selectedOrder.notes }}</span>
              </div>
              <div class="info-row">
                <strong>Total:</strong>
                <span class="total">${{ parseFloat(selectedOrder?.total || '0').toFixed(2) }}</span>
              </div>
            </div>

            <h3>Items de la Orden</h3>
            <div class="order-items-list">
              <div v-for="item in selectedOrder?.items" :key="item.id" class="order-item">
                <div class="item-main">
                  <span class="item-qty">{{ item.quantity }}x</span>
                  <span class="item-name">{{ item.product.name }}</span>
                  <span
                    class="item-status"
                    :style="{
                      backgroundColor: statusConfig(item.status).bgColor,
                      color: statusConfig(item.status).color,
                    }"
                  >
                    {{ statusConfig(item.status).label }}
                  </span>
                </div>
                <div v-if="item.notes" class="item-note">Nota: {{ item.notes }}</div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="showDetailModal = false" class="btn btn-primary">Cerrar</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.kitchen-view {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
  background-color: #f9fafb;
  min-height: 100vh;
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

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover {
  background-color: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
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

.stat-card.pending {
  border-left-color: #f59e0b;
}

.stat-card.preparing {
  border-left-color: #3b82f6;
}

.stat-card.served {
  border-left-color: #10b981;
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
  gap: 12px;
  margin-bottom: 24px;
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

.filter-btn.pending.active {
  background-color: #f59e0b;
  border-color: #f59e0b;
}

.filter-btn.preparing.active {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.filter-btn.served.active {
  background-color: #10b981;
  border-color: #10b981;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 20px;
}

.kitchen-item-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  border: 2px solid transparent;
}

.kitchen-item-card.urgent {
  border-color: #ef4444;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.5);
  }
}

.kitchen-item-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.order-number {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.table-badge {
  display: inline-block;
  padding: 4px 10px;
  background-color: #dbeafe;
  color: #1e40af;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.takeout-badge {
  display: inline-block;
  padding: 4px 10px;
  background-color: #fef3c7;
  color: #d97706;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.item-body {
  margin-bottom: 16px;
}

.product-info {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.product-details {
  flex: 1;
}

.product-details h4 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.quantity-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-controls button {
  width: 28px;
  height: 28px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.quantity-controls button:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.quantity {
  min-width: 30px;
  text-align: center;
  font-weight: 700;
  font-size: 16px;
  color: #1f2937;
}

.item-notes {
  display: flex;
  gap: 8px;
  padding: 12px;
  background-color: #fef3c7;
  border-radius: 8px;
  margin-bottom: 12px;
}

.item-notes p {
  margin: 0;
  font-size: 14px;
  color: #92400e;
  font-style: italic;
}

.item-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 13px;
}

.item-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 100px;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover {
  background-color: #059669;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: white;
  border-radius: 12px;
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #1f2937;
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

.order-detail-info {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row strong {
  color: #374151;
}

.info-row span {
  color: #6b7280;
}

.total {
  font-size: 18px;
  font-weight: 700;
  color: #10b981 !important;
}

.takeout-label {
  color: #f59e0b !important;
  font-weight: 600;
}

.modal-body h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.order-items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-qty {
  font-weight: 700;
  color: #1f2937;
  min-width: 30px;
}

.item-name {
  flex: 1;
  color: #374151;
}

.item-status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.item-note {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
  color: #6b7280;
  font-style: italic;
}

.modal-footer {
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .kitchen-view {
    padding: 16px;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters {
    flex-direction: column;
  }
}
</style>
