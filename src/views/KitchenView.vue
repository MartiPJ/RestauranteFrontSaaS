<!-- src/views/KitchenView.vue -->
<template>
  <div class="kitchen-view">
    <!-- Header -->
    <header class="kitchen-header">
      <div class="header-content">
        <div class="title-section">
          <div class="title-icon">
            <span class="icon-emoji">🍳</span>
          </div>
          <div class="title-text">
            <h1>Cocina</h1>
            <p class="subtitle">Gestión de órdenes en preparación</p>
          </div>
        </div>

        <div class="header-info">
          <div class="stats">
            <div class="stat-card">
              <span class="stat-icon">📋</span>
              <div class="stat-content">
                <span class="stat-value">{{ activeOrders.length }}</span>
                <span class="stat-label">Órdenes activas</span>
              </div>
            </div>
            <div class="stat-card pending">
              <span class="stat-icon">⏳</span>
              <div class="stat-content">
                <span class="stat-value">{{ pendingItemsCount }}</span>
                <span class="stat-label">Items pendientes</span>
              </div>
            </div>
          </div>

          <button @click="fetchOrders(false)" class="btn-refresh" :disabled="loading">
            <span class="refresh-icon" :class="{ spinning: loading || isRefreshing }">🔄</span>
            <span class="refresh-text">Actualizar</span>
          </button>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filters-section">
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
    <div v-if="loading && !orders.length" class="loading-state">
      <div class="spinner"></div>
      <p class="loading-text">Cargando órdenes de cocina...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">Error al cargar</h3>
      <p class="error-message">{{ error }}</p>
      <button @click="fetchOrders(false)" class="btn-retry">
        <span class="btn-icon">↻</span>
        Reintentar
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!filteredOrders.length" class="empty-state">
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
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="`toast-${toast.type}`">
        <span class="toast-icon">{{ toast.type === 'success' ? '✅' : '❌' }}</span>
        <span class="toast-message">{{ toast.message }}</span>
      </div>
    </Transition>
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
  background: #e4f4fc;
  padding: 2rem;
}

/* ===== HEADER ===== */
.kitchen-header {
  background: white;
  border-radius: 24px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  border: 1px solid rgba(96, 154, 187, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(145deg, #609abb, #e4f4fc);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-emoji {
  font-size: 2rem;
}

.title-text h1 {
  margin: 0 0 0.25rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #051b3a;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  color: #5d7a90;
  font-size: 0.95rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

/* ===== STATS ===== */
.stats {
  display: flex;
  gap: 1rem;
}

.stat-card {
  background: #e4f4fc;
  padding: 0.75rem 1.25rem;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid rgba(96, 154, 187, 0.2);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.2);
}

.stat-card.pending {
  background: #fef3c7;
  border-color: #f59e0b;
}

.stat-icon {
  font-size: 1.25rem;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #051b3a;
}

.stat-label {
  font-size: 0.9rem;
  color: #5d7a90;
  font-weight: 500;
}

.stat-card.pending .stat-value {
  color: #f59e0b;
}

.stat-card.pending .stat-label {
  color: #b45309;
}

/* ===== BOTÓN REFRESH ===== */
.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(145deg, #609abb, #5d7a90);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.btn-refresh:hover:not(:disabled) {
  background: linear-gradient(145deg, #5d7a90, #051b3a);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.3);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.refresh-icon.spinning {
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
.filters-section {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: #e4f4fc;
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  color: #5d7a90;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.filter-btn:hover {
  border-color: #609abb;
  background: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.15);
}

.filter-btn.active {
  background: #609abb;
  color: white;
  border-color: #609abb;
}

.filter-icon {
  font-size: 1.1rem;
}

.filter-badge {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 700;
  margin-left: 0.25rem;
}

.filter-btn.active .filter-badge {
  background: rgba(255, 255, 255, 0.3);
}

/* ===== ESTADOS DE CARGA ===== */
.loading-state,
.error-state,
.empty-state {
  background: white;
  border-radius: 24px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  border: 1px solid rgba(96, 154, 187, 0.1);
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #e4f4fc;
  border-top-color: #609abb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

.loading-text {
  font-size: 1.1rem;
  color: #5d7a90;
  margin: 0;
}

.error-icon,
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
  margin: 0 auto 1.5rem;
}

.error-title,
.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #051b3a;
  margin: 0 0 0.5rem 0;
}

.error-message,
.empty-message {
  font-size: 1rem;
  color: #5d7a90;
  margin: 0 0 1.5rem 0;
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
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

.btn-retry:hover {
  background: linear-gradient(145deg, #5d7a90, #051b3a);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.3);
}

.btn-icon {
  font-size: 1.1rem;
}

/* ===== GRID DE ÓRDENES ===== */
.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(480px, 1fr));
  gap: 1.5rem;
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
  bottom: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 15px 30px rgba(5, 27, 58, 0.2);
  z-index: 1000;
  animation: slideIn 0.3s ease;
  border-left: 4px solid;
}

.toast-success {
  background: linear-gradient(145deg, #10b981, #059669);
  color: white;
  border-left-color: #10b981;
}

.toast-error {
  background: linear-gradient(145deg, #ef4444, #dc2626);
  color: white;
  border-left-color: #ef4444;
}

.toast-icon {
  font-size: 1.25rem;
}

.toast-message {
  font-size: 0.95rem;
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

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .orders-grid {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
}

@media (max-width: 768px) {
  .kitchen-view {
    padding: 1rem;
  }

  .kitchen-header {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: stretch;
  }

  .title-section {
    justify-content: center;
  }

  .title-icon {
    width: 48px;
    height: 48px;
  }

  .icon-emoji {
    font-size: 1.5rem;
  }

  .title-text h1 {
    font-size: 1.5rem;
  }

  .header-info {
    flex-direction: column;
  }

  .stats {
    width: 100%;
    flex-direction: column;
  }

  .stat-card {
    width: 100%;
    justify-content: center;
  }

  .btn-refresh {
    width: 100%;
    justify-content: center;
  }

  .filters-section {
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
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
  }
}

@media (max-width: 480px) {
  .stat-content {
    flex-direction: column;
    gap: 0.25rem;
  }
}

/* ===== OPTIMIZACIONES TÁCTILES ===== */
@media (hover: none) and (pointer: coarse) {
  .filter-btn,
  .btn-refresh,
  .btn-retry {
    padding: 1rem 1.5rem;
  }
}
</style>
