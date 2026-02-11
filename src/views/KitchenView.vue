<!-- src/views/KitchenView.vue -->
<template>
  <div class="kitchen-view">
    <header class="kitchen-header">
      <div class="header-content">
        <h1 class="title">🍳 Cocina</h1>
        <div class="header-info">
          <div class="auto-refresh">
            <span class="refresh-indicator" :class="{ active: isRefreshing }"> 🔄 </span>
            <span class="refresh-text">Auto-actualización</span>
          </div>
          <div class="order-count">
            <span class="count-badge">{{ activeOrders.length }}</span>
            <span>órdenes activas</span>
          </div>
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
          {{ filter.icon }} {{ filter.label }}
          <span v-if="filter.count > 0" class="filter-count">
            {{ filter.count }}
          </span>
        </button>
      </div>
    </header>

    <div v-if="loading && orders.length === 0" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando órdenes...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="() => fetchOrders()" class="retry-btn">Reintentar</button>
    </div>

    <div v-else-if="filteredOrders.length === 0" class="empty-state">
      <div class="empty-icon">✨</div>
      <p v-if="selectedFilter === 'all'">No hay órdenes activas</p>
      <p v-else>No hay órdenes con este estado</p>
    </div>

    <div v-else class="orders-grid">
      <KitchenOrderCard
        v-for="order in filteredOrders"
        :key="order.id"
        :order="order"
        :order-items="order.items || []"
        @update-order-status="handleUpdateOrderStatus"
        @update-item-status="handleUpdateItemStatus"
      />
    </div>

    <!-- Toast de notificación -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="`toast-${toast.type}`">
        {{ toast.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import KitchenOrderCard from '@/components/Kitchenordercard.vue'
import { orderService } from '@/services/orderService'
import type { Order } from '@/types/order'
import { OrderStatus, OrderItemStatus } from '@/types/order'

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
const REFRESH_INTERVAL = 5000 // 5 segundos

// Órdenes activas (excluye paid, cancelled, delivered)
const activeOrders = computed(() => {
  return orders.value.filter(
    (order) =>
      order.status !== OrderStatus.PAID &&
      order.status !== OrderStatus.CANCELLED &&
      order.status !== OrderStatus.DELIVERED,
  )
})

// Contadores por estado
const orderCounts = computed(() => {
  const counts = {
    all: activeOrders.value.length,
    open: 0,
    in_progress: 0,
    ready: 0,
  }

  activeOrders.value.forEach((order) => {
    if (order.status === OrderStatus.OPEN) counts.open++
    if (order.status === OrderStatus.IN_PROGRESS) counts.in_progress++
    if (order.status === OrderStatus.READY) counts.ready++
  })

  return counts
})

// Filtros disponibles
const filters = computed(() => [
  { value: 'all', label: 'Todas', icon: '📋', count: orderCounts.value.all },
  { value: 'open', label: 'Nuevas', icon: '🆕', count: orderCounts.value.open },
  {
    value: 'in_progress',
    label: 'En proceso',
    icon: '🔥',
    count: orderCounts.value.in_progress,
  },
  {
    value: 'ready',
    label: 'Listas',
    icon: '✅',
    count: orderCounts.value.ready,
  },
])

// Órdenes filtradas
const filteredOrders = computed(() => {
  if (selectedFilter.value === 'all') {
    return activeOrders.value
  }
  return activeOrders.value.filter((order) => order.status === selectedFilter.value)
})

// Mostrar toast
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.value = { show: true, message, type }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

// Obtener órdenes
const fetchOrders = async (silent = false) => {
  try {
    if (!silent) {
      loading.value = true
    } else {
      isRefreshing.value = true
    }
    error.value = null

    const response = await orderService.getAllOrders({ limit: 100 })

    // Para cada orden activa, obtener sus items
    const ordersWithItems = await Promise.all(
      response.data
        .filter(
          (order: Order) =>
            order.status !== OrderStatus.PAID &&
            order.status !== OrderStatus.CANCELLED &&
            order.status !== OrderStatus.DELIVERED,
        )
        .map(async (order: Order) => {
          try {
            const detailedOrder = await orderService.getOrderById(order.id)
            return detailedOrder
          } catch (err) {
            console.error(`Error fetching order ${order.id}:`, err)
            return order
          }
        }),
    )

    orders.value = ordersWithItems
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al cargar las órdenes'
    console.error('Error fetching orders:', err)
  } finally {
    loading.value = false
    isRefreshing.value = false
  }
}

// Actualizar estado de orden
const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
  try {
    await orderService.updateOrderStatus(orderId, { status })

    // Si la orden se marca como delivered o cancelled, la removemos de la vista
    if (status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED) {
      orders.value = orders.value.filter((o) => o.id !== orderId)
      showToast(status === OrderStatus.DELIVERED ? 'Orden entregada' : 'Orden cancelada')
    } else {
      // Actualizamos el estado localmente
      const order = orders.value.find((o) => o.id === orderId)
      if (order) {
        order.status = status
      }
      showToast('Estado actualizado')
    }
  } catch (err) {
    showToast('Error al actualizar el estado', 'error')
    console.error('Error updating order status:', err)
  }
}

// Actualizar estado de item
const handleUpdateItemStatus = async (itemId: string, status: OrderItemStatus) => {
  try {
    await orderService.updateOrderItem(itemId, { status })

    // Actualizar el estado localmente
    orders.value.forEach((order) => {
      if (order.items) {
        const item = order.items.find((i: any) => i.id === itemId)
        if (item) {
          item.status = status
        }
      }
    })

    showToast('Item actualizado')
  } catch (err) {
    showToast('Error al actualizar el item', 'error')
    console.error('Error updating item status:', err)
  }
}

// Iniciar auto-refresh
const startAutoRefresh = () => {
  refreshInterval = window.setInterval(() => {
    fetchOrders(true)
  }, REFRESH_INTERVAL)
}

// Detener auto-refresh
const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

onMounted(() => {
  fetchOrders()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.kitchen-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.kitchen-header {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 32px;
  font-weight: 800;
  margin: 0;
  color: #111827;
}

.header-info {
  display: flex;
  gap: 24px;
  align-items: center;
}

.auto-refresh {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f3f4f6;
  border-radius: 8px;
}

.refresh-indicator {
  font-size: 20px;
  transition: transform 0.3s ease;
}

.refresh-indicator.active {
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

.refresh-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.order-count {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #4b5563;
}

.count-badge {
  background: #3b82f6;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  min-width: 36px;
  text-align: center;
}

.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 12px 24px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
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

.filter-count {
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
}

.filter-btn.active .filter-count {
  background: rgba(255, 255, 255, 0.3);
}

.loading-state,
.error-state,
.empty-state {
  background: white;
  border-radius: 16px;
  padding: 60px 24px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.loading-state p,
.error-state p,
.empty-state p {
  font-size: 18px;
  color: #6b7280;
  margin: 0;
}

.error-icon,
.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.retry-btn {
  margin-top: 16px;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 16px 24px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.toast-success {
  background: #10b981;
  color: white;
}

.toast-error {
  background: #ef4444;
  color: white;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 1200px) {
  .orders-grid {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
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
    align-items: flex-start;
    gap: 16px;
  }

  .title {
    font-size: 24px;
  }

  .header-info {
    width: 100%;
    justify-content: space-between;
  }

  .orders-grid {
    grid-template-columns: 1fr;
  }

  .filter-btn {
    flex: 1;
    justify-content: center;
  }

  .toast {
    left: 12px;
    right: 12px;
    bottom: 12px;
  }
}
</style>
