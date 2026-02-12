<!-- src/views/KitchenView.vue -->
<template>
  <div class="kitchen-view">
    <header class="kitchen-header">
      <div class="header-content">
        <h1 class="title">
          <span class="title-icon">🍳</span>
          Cocina
        </h1>
        <div class="header-info">
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">Órdenes activas</span>
              <span class="stat-value">{{ activeOrders.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Items pendientes</span>
              <span class="stat-value">{{ pendingItemsCount }}</span>
            </div>
          </div>
          <button @click="fetchOrders(false)" class="btn-refresh" :disabled="loading">
            <span class="refresh-icon" :class="{ spinning: loading || isRefreshing }">🔄</span>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <div class="filters">
        <button
          v-for="filter in filters"
          :key="filter.value"
          @click="selectedFilter = filter.value"
          class="filter-btn"
          :class="{ active: selectedFilter === filter.value }"
        >
          <span class="filter-icon">{{ filter.icon }}</span>
          <span class="filter-label">{{ filter.label }}</span>
          <span v-if="filter.count > 0" class="filter-badge">
            {{ filter.count }}
          </span>
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading && !orders.length" class="loading-container">
      <div class="loading-spinner"></div>
      <p class="loading-text">Cargando órdenes de cocina...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">Error al cargar</h3>
      <p class="error-message">{{ error }}</p>
      <button @click="fetchOrders(false)" class="btn-retry">
        <span>Reintentar</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!filteredOrders.length" class="empty-container">
      <div class="empty-icon">🍽️</div>
      <h3 class="empty-title">Todo al día</h3>
      <p class="empty-message">
        {{ selectedFilter === 'all' ? 'No hay órdenes activas' : 'No hay órdenes en este estado' }}
      </p>
    </div>

    <!-- Orders Grid -->
    <div v-else class="orders-grid">
      <KitchenOrderCard
        v-for="order in filteredOrders"
        :key="order.id"
        :order="order"
        @update-order-status="handleUpdateOrderStatus"
        @update-item-status="handleUpdateItemStatus"
      />
    </div>
  </div>

  <!-- Toast Notification -->
  <Teleport to="body">
    <div v-if="toast.show" class="toast" :class="`toast-${toast.type}`">
      <span class="toast-icon">{{ toast.type === 'success' ? '✅' : '❌' }}</span>
      <span class="toast-message">{{ toast.message }}</span>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import KitchenOrderCard from '@/components/Kitchenordercard.vue'
import { orderService } from '@/services/orderService'
import type { Order, OrderProduct } from '@/types/order'
import { OrderStatus, OrderItemStatus } from '@/types/order'

// ===== STATE =====
const orders = ref<Order[]>([])
const loading = ref(false)
const isRefreshing = ref(false)
const error = ref<string | null>(null)
const selectedFilter = ref<string>('all')

const toast = ref({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
})

let refreshInterval: number | null = null
const REFRESH_INTERVAL = 10000 // 10 segundos

// ===== COMPUTED =====
// Órdenes activas (excluye entregadas, pagadas y canceladas)
const activeOrders = computed(() => {
  return orders.value.filter(
    (order) =>
      ![OrderStatus.PAID, OrderStatus.CANCELLED, OrderStatus.DELIVERED].includes(order.status),
  )
})

// Total de items pendientes
const pendingItemsCount = computed(() => {
  return activeOrders.value.reduce((total, order) => {
    const items = order.orderProducts || []
    return (
      total +
      items.filter((item) =>
        [OrderItemStatus.PENDING, OrderItemStatus.PREPARING].includes(item.status),
      ).length
    )
  }, 0)
})

// Contadores para filtros
const orderCounts = computed(() => {
  const counts = {
    all: activeOrders.value.length,
    [OrderStatus.OPEN]: 0,
    [OrderStatus.IN_PROGRESS]: 0,
    [OrderStatus.READY]: 0,
  }

  activeOrders.value.forEach((order) => {
    if (order.status in counts) {
      counts[order.status as keyof typeof counts]++
    }
  })

  return counts
})

// Filtros disponibles
const filters = computed(() => [
  { value: 'all', label: 'Todas', icon: '📋', count: orderCounts.value.all },
  {
    value: OrderStatus.OPEN,
    label: 'Nuevas',
    icon: '🆕',
    count: orderCounts.value[OrderStatus.OPEN],
  },
  {
    value: OrderStatus.IN_PROGRESS,
    label: 'En proceso',
    icon: '🔥',
    count: orderCounts.value[OrderStatus.IN_PROGRESS],
  },
  {
    value: OrderStatus.READY,
    label: 'Listas',
    icon: '✅',
    count: orderCounts.value[OrderStatus.READY],
  },
])

// Órdenes filtradas
const filteredOrders = computed(() => {
  if (selectedFilter.value === 'all') return activeOrders.value
  return activeOrders.value.filter((order) => order.status === selectedFilter.value)
})

// ===== METHODS =====
// Obtener órdenes con sus productos
const fetchOrders = async (silent = false) => {
  if (!silent) loading.value = true
  else isRefreshing.value = true

  error.value = null

  try {
    // Obtener lista de órdenes
    const response = await orderService.getAllOrders({
      limit: 50,
      // Solo órdenes relevantes para cocina
      status: [OrderStatus.OPEN, OrderStatus.IN_PROGRESS, OrderStatus.READY].join(','),
    })

    // Cargar detalles de cada orden con sus productos
    const ordersWithDetails = await Promise.all(
      response.data.map(async (order: Order) => {
        try {
          const detailedOrder = await orderService.getOrderById(order.id)
          return detailedOrder
        } catch (err) {
          console.error(`Error loading order ${order.id}:`, err)
          return order
        }
      }),
    )

    orders.value = ordersWithDetails

    if (!silent) {
      showToast('Órdenes actualizadas', 'success')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al cargar las órdenes'
    console.error('Error fetching orders:', err)
    if (!silent) {
      showToast('Error al cargar órdenes', 'error')
    }
  } finally {
    loading.value = false
    isRefreshing.value = false
  }
}

// Actualizar estado de orden
const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
  try {
    await orderService.updateOrderStatus(orderId, { status })

    // Actualizar localmente
    const orderIndex = orders.value.findIndex((o) => o.id === orderId)
    if (orderIndex !== -1) {
      const order = orders.value[orderIndex]
      if (order) {
        if (status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED) {
          // Remover orden si ya no es relevante para cocina
          orders.value.splice(orderIndex, 1)
          showToast(
            `Orden ${status === OrderStatus.DELIVERED ? 'entregada' : 'cancelada'}`,
            'success',
          )
        } else {
          // Actualizar estado
          order.status = status
          showToast('Estado actualizado', 'success')
        }
      }
    }
  } catch (err) {
    console.error('Error updating order status:', err)
    showToast('Error al actualizar estado', 'error')
  }
}

// Actualizar estado de item
const handleUpdateItemStatus = async (itemId: string, status: OrderItemStatus) => {
  try {
    await orderService.updateOrderItem(itemId, { status })

    // Actualizar localmente
    orders.value.forEach((order) => {
      if (order.orderProducts) {
        const item = order.orderProducts.find((p) => p.id === itemId)
        if (item) {
          item.status = status
        }
      }
    })

    showToast('Item actualizado', 'success')
  } catch (err) {
    console.error('Error updating item status:', err)
    showToast('Error al actualizar item', 'error')
  }
}

// Mostrar toast
const showToast = (message: string, type: 'success' | 'error') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// Auto-refresh
const startAutoRefresh = () => {
  refreshInterval = window.setInterval(() => {
    fetchOrders(true)
  }, REFRESH_INTERVAL)
}

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

// ===== LIFECYCLE =====
onMounted(() => {
  fetchOrders(false)
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
/* ===== LAYOUT PRINCIPAL ===== */
.kitchen-view {
  min-height: 100vh;
  background: #f3f4f6;
  padding: 24px;
}

/* ===== HEADER ===== */
.kitchen-header {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.title {
  font-size: 32px;
  font-weight: 800;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 36px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  background: #f3f4f6;
  padding: 8px 20px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-label {
  font-size: 15px;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  background: white;
  padding: 2px 12px;
  border-radius: 9999px;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-2px);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 18px;
  transition: transform 0.3s ease;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* ===== FILTROS ===== */
.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.filter-btn:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateY(-2px);
}

.filter-btn.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
}

.filter-icon {
  font-size: 18px;
}

.filter-badge {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 700;
}

.filter-btn.active .filter-badge {
  background: rgba(255, 255, 255, 0.3);
}

/* ===== ESTADOS DE CARGA ===== */
.loading-container,
.error-container,
.empty-container {
  background: white;
  border-radius: 20px;
  padding: 60px 24px;
  text-align: center;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 24px;
}

.loading-text {
  font-size: 18px;
  color: #6b7280;
  margin: 0;
}

.error-icon,
.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.error-title,
.empty-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 8px 0;
}

.error-message,
.empty-message {
  font-size: 16px;
  color: #6b7280;
  margin: 0 0 24px 0;
}

.btn-retry {
  padding: 12px 32px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-retry:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

/* ===== GRID DE ÓRDENES ===== */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  gap: 24px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== TOAST ===== */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.toast-success {
  background: #10b981;
  color: white;
}

.toast-error {
  background: #ef4444;
  color: white;
}

.toast-icon {
  font-size: 20px;
}

.toast-message {
  font-size: 16px;
  font-weight: 600;
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

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .orders-grid {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
}

@media (max-width: 768px) {
  .kitchen-view {
    padding: 12px;
  }

  .kitchen-header {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .title {
    font-size: 28px;
  }

  .header-info {
    flex-direction: column;
    align-items: stretch;
  }

  .stats {
    justify-content: space-between;
  }

  .btn-refresh {
    justify-content: center;
  }

  .filters {
    flex-direction: column;
  }

  .filter-btn {
    width: 100%;
    justify-content: center;
  }

  .orders-grid {
    grid-template-columns: 1fr;
  }

  .toast {
    left: 12px;
    right: 12px;
    bottom: 12px;
  }
}

/* Optimizaciones para pantallas táctiles */
@media (hover: none) and (pointer: coarse) {
  .filter-btn,
  .btn-refresh,
  .btn-retry {
    padding: 14px 24px;
  }

  .order-card {
    cursor: default;
  }
}
</style>
