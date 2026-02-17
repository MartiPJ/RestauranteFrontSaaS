<!-- src/components/KitchenOrderCard.vue -->
<template>
  <div class="order-card" :class="statusClass">
    <!-- HEADER: Información principal de la orden -->
    <div class="order-header">
      <div class="order-header-left">
        <div class="order-badges">
          <span class="badge badge-order-number">#{{ shortOrderNumber }}</span>
          <span class="badge" :class="`badge-${order.status}`">
            <span class="badge-icon">{{ statusIcon }}</span>
            {{ statusLabel }}
          </span>
          <span v-if="isPriority" class="badge badge-priority">
            <span class="badge-icon">⚡</span>
            Prioritario
          </span>
        </div>

        <div class="order-meta">
          <div class="meta-item">
            <span class="meta-icon">🕒</span>
            <span class="meta-text">{{ timeAgo }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">👤</span>
            <span class="meta-text">{{ order.user?.name || 'Cliente' }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-icon">📍</span>
            <span class="meta-text location-badge">
              {{ order.table?.tableNumber ? `Mesa ${order.table.tableNumber}` : '🥡 Para llevar' }}
            </span>
          </div>
        </div>
      </div>

      <div class="order-header-right">
        <div class="order-timer" v-if="isActive" :class="{ 'timer-warning': elapsedMinutes > 15 }">
          <span class="timer-icon">⏱️</span>
          <span class="timer-time">{{ elapsedTime }}</span>
        </div>

        <div class="order-actions">
          <button
            v-for="action in availableActions"
            :key="action.status"
            @click="emit('updateOrderStatus', order.id, action.status)"
            class="btn btn-action"
            :class="`btn-${action.status}`"
            :title="action.label"
          >
            <span class="btn-icon">{{ action.icon }}</span>
            <span class="btn-text">{{ action.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- PRODUCTOS: Diseño tipo ticket, ultra legible -->
    <div class="order-products">
      <div class="products-header">
        <span class="products-title">
          <span class="title-icon">🍽️</span>
          Productos
        </span>
        <span class="products-count">{{ orderProducts.length }} items</span>
      </div>

      <div class="products-list">
        <div
          v-for="product in orderProducts"
          :key="product.id"
          class="product-item"
          :class="`product-${product.status}`"
        >
          <!-- Estado visual del producto (barra lateral) -->
          <div class="product-status-bar" :class="`bar-${product.status}`"></div>

          <!-- Cantidad - MUY GRANDE y visible -->
          <div class="product-quantity" :class="`quantity-${product.status}`">
            <span class="quantity-number">{{ product.quantity }}</span>
          </div>

          <!-- Información del producto -->
          <div class="product-info">
            <div class="product-header-row">
              <span class="product-name">{{ product.product.name }}</span>
              <span class="product-status-chip" :class="`chip-${product.status}`">
                <span class="chip-icon">{{ productStatusIcon[product.status] }}</span>
                {{ productStatusLabel[product.status] }}
              </span>
            </div>

            <!-- Notas - Muy visibles -->
            <div v-if="product.notes" class="product-notes">
              <span class="notes-icon">📝</span>
              <span class="notes-text">{{ product.notes }}</span>
            </div>

            <!-- Botones de estado - Grandes, táctiles -->
            <div class="product-actions">
              <button
                v-for="status in productStatuses"
                :key="status.value"
                @click="emit('updateItemStatus', product.id, status.value)"
                class="btn-status"
                :class="[`btn-status-${status.value}`, { active: product.status === status.value }]"
                :disabled="product.status === status.value"
                :title="status.label"
              >
                <span class="status-icon">{{ status.icon }}</span>
                <span class="status-label">{{ status.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tiempo total si es necesario -->
    <div class="order-footer" v-if="order.notes">
      <span class="footer-icon">📌</span>
      <span class="footer-text">{{ order.notes }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Order, OrderProduct } from '@/types/order'
import { OrderStatus, OrderItemStatus } from '@/types/order'

interface Props {
  order: Order & { orderProducts?: OrderProduct[] }
}

interface Emits {
  (e: 'updateOrderStatus', orderId: string, status: OrderStatus): void
  (e: 'updateItemStatus', itemId: string, status: OrderItemStatus): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Acceso seguro a los productos
const orderProducts = computed(() => props.order.orderProducts || [])

// Número de orden corto para fácil identificación
const shortOrderNumber = computed(() => {
  const parts = props.order.orderNumber.split('-')
  return parts[parts.length - 1]
})

// Íconos para estados de orden
const statusIcon = computed(() => {
  const icons: Record<string, string> = {
    [OrderStatus.OPEN]: '🆕',
    [OrderStatus.IN_PROGRESS]: '🔥',
    [OrderStatus.READY]: '✅',
    [OrderStatus.DELIVERED]: '🚚',
    [OrderStatus.PAID]: '💰',
    [OrderStatus.CANCELLED]: '❌',
  }
  return icons[props.order.status] || '📋'
})

// Estado de la orden en español
const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    [OrderStatus.OPEN]: 'Nueva',
    [OrderStatus.IN_PROGRESS]: 'En proceso',
    [OrderStatus.READY]: 'Lista',
    [OrderStatus.DELIVERED]: 'Entregada',
    [OrderStatus.PAID]: 'Pagada',
    [OrderStatus.CANCELLED]: 'Cancelada',
  }
  return labels[props.order.status] || props.order.status
})

// Clase CSS para el borde de la tarjeta
const statusClass = computed(() => `status-${props.order.status}`)

// Si la orden es prioritaria (más de 15 minutos o más de 5 items)
const isPriority = computed(() => {
  const minutes = elapsedMinutes.value
  const itemsCount = orderProducts.value.length
  return minutes > 15 || itemsCount > 5
})

// Si la orden está activa (para timer)
const isActive = computed(() =>
  [OrderStatus.OPEN, OrderStatus.IN_PROGRESS].includes(props.order.status),
)

// Minutos transcurridos
const elapsedMinutes = computed(() => {
  const created = new Date(props.order.createdAt)
  const now = new Date()
  return Math.floor((now.getTime() - created.getTime()) / 60000)
})

// Tiempo transcurrido formateado
const elapsedTime = computed(() => {
  const minutes = elapsedMinutes.value
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
})

// Tiempo relativo (hace X minutos)
const timeAgo = computed(() => {
  const minutes = elapsedMinutes.value

  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`

  const created = new Date(props.order.createdAt)
  const hours = created.getHours().toString().padStart(2, '0')
  const mins = created.getMinutes().toString().padStart(2, '0')
  return `${hours}:${mins}`
})

// Estados disponibles para productos
const productStatuses = [
  { value: OrderItemStatus.PENDING, label: 'Pendiente', icon: '⏳' },
  { value: OrderItemStatus.PREPARING, label: 'Preparar', icon: '🔥' },
  { value: OrderItemStatus.SERVED, label: 'Servido', icon: '✅' },
]

// Íconos para estados de producto
const productStatusIcon = {
  [OrderItemStatus.PENDING]: '⏳',
  [OrderItemStatus.PREPARING]: '🔥',
  [OrderItemStatus.SERVED]: '✅',
  [OrderItemStatus.CANCELLED]: '❌',
}

// Labels para mostrar el estado del producto
const productStatusLabel = {
  [OrderItemStatus.PENDING]: 'Pendiente',
  [OrderItemStatus.PREPARING]: 'En cocina',
  [OrderItemStatus.SERVED]: 'Servido',
  [OrderItemStatus.CANCELLED]: 'Cancelado',
}

// Acciones disponibles según el estado de la orden
const availableActions = computed(() => {
  const actions = []

  switch (props.order.status) {
    case OrderStatus.OPEN:
      actions.push({
        status: OrderStatus.IN_PROGRESS,
        label: 'Iniciar',
        icon: '🔥',
      })
      actions.push({
        status: OrderStatus.CANCELLED,
        label: 'Cancelar',
        icon: '❌',
      })
      break
    case OrderStatus.IN_PROGRESS:
      actions.push({
        status: OrderStatus.READY,
        label: 'Lista',
        icon: '✅',
      })
      actions.push({
        status: OrderStatus.CANCELLED,
        label: 'Cancelar',
        icon: '❌',
      })
      break
    case OrderStatus.READY:
      actions.push({
        status: OrderStatus.DELIVERED,
        label: 'Entregar',
        icon: '🚚',
      })
      break
  }

  return actions
})
</script>

<style scoped>
/* ===== TARJETA PRINCIPAL ===== */
.order-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border-left: 6px solid transparent;
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid rgba(96, 154, 187, 0.1);
}

.order-card:hover {
  box-shadow: 0 12px 25px rgba(5, 27, 58, 0.15);
  transform: translateY(-4px);
}

/* Estados de la orden (colores en borde izquierdo) */
.status-open {
  border-left-color: #609abb;
  background: linear-gradient(to right, rgba(96, 154, 187, 0.05), white);
}
.status-in_progress {
  border-left-color: #f59e0b;
  background: linear-gradient(to right, rgba(245, 158, 11, 0.05), white);
}
.status-ready {
  border-left-color: #10b981;
  background: linear-gradient(to right, rgba(16, 185, 129, 0.05), white);
}
.status-delivered {
  border-left-color: #8b5cf6;
  background: linear-gradient(to right, rgba(139, 92, 246, 0.05), white);
}
.status-cancelled {
  border-left-color: #5d7a90;
  background: #f8fafc;
  opacity: 0.9;
}

/* ===== HEADER ===== */
.order-header {
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #e4f4fc;
  background: white;
  flex-wrap: wrap;
  gap: 1rem;
}

.order-header-left {
  flex: 1;
  min-width: 280px;
}

.order-badges {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.35rem 1rem;
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  letter-spacing: 0.3px;
}

.badge-icon {
  font-size: 1rem;
}

.badge-order-number {
  background: #051b3a;
  color: white;
  font-size: 1rem;
  padding: 0.35rem 1.2rem;
}

.badge-open {
  background: #609abb;
  color: white;
}
.badge-in_progress {
  background: #f59e0b;
  color: white;
}
.badge-ready {
  background: #10b981;
  color: white;
}
.badge-delivered {
  background: #8b5cf6;
  color: white;
}
.badge-cancelled {
  background: #5d7a90;
  color: white;
}
.badge-priority {
  background: #ef4444;
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.order-meta {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #5d7a90;
  font-size: 0.9rem;
  font-weight: 500;
}

.meta-icon {
  font-size: 1.1rem;
}

.meta-text {
  color: #051b3a;
}

.location-badge {
  background: #e4f4fc;
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-weight: 600;
}

.order-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.75rem;
}

.order-timer {
  background: #051b3a;
  color: white;
  padding: 0.4rem 1rem;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.order-timer.timer-warning {
  background: #ef4444;
  animation: pulse 2s infinite;
}

.timer-icon {
  font-size: 1rem;
}

.timer-time {
  font-family: monospace;
  font-size: 1.1rem;
}

/* ===== ACCIONES DE LA ORDEN ===== */
.order-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.btn-action:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.btn-action:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 1.1rem;
}

.btn-in_progress {
  background: linear-gradient(145deg, #609abb, #5d7a90);
}
.btn-ready {
  background: linear-gradient(145deg, #10b981, #059669);
}
.btn-delivered {
  background: linear-gradient(145deg, #8b5cf6, #7c3aed);
}
.btn-cancelled {
  background: linear-gradient(145deg, #ef4444, #dc2626);
}

/* ===== PRODUCTOS ===== */
.order-products {
  padding: 1.25rem;
  background: white;
  flex: 1;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.products-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #051b3a;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  font-size: 1.2rem;
}

.products-count {
  background: #e4f4fc;
  color: #609abb;
  padding: 0.2rem 0.8rem;
  border-radius: 30px;
  font-size: 0.85rem;
  font-weight: 600;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ===== ITEM DE PRODUCTO ===== */
.product-item {
  display: flex;
  gap: 1rem;
  background: #f8fafc;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #e4f4fc;
}

.product-item:hover {
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.1);
}

/* Barra lateral de estado */
.product-status-bar {
  width: 6px;
  height: auto;
  transition: all 0.3s ease;
}

.bar-pending {
  background: #b4cbd8;
}
.bar-preparing {
  background: #f59e0b;
  animation: pulse 2s infinite;
}
.bar-served {
  background: #10b981;
}

/* Estados del producto */
.product-pending {
  background: white;
}
.product-preparing {
  background: #fef3c7;
}
.product-served {
  background: #d1fae5;
  opacity: 0.9;
}

/* ===== CANTIDAD - MUY GRANDE ===== */
.product-quantity {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 0.5rem 0;
  border-radius: 12px;
  margin: 0.5rem 0 0.5rem 0.5rem;
}

.quantity-pending {
  background: #e4f4fc;
}
.quantity-preparing {
  background: #f59e0b;
}
.quantity-served {
  background: #10b981;
}

.quantity-number {
  font-size: 2rem;
  font-weight: 900;
  color: #051b3a;
  line-height: 1;
}

.product-preparing .quantity-number,
.product-served .quantity-number {
  color: white;
}

/* ===== INFORMACIÓN DEL PRODUCTO ===== */
.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem 0.75rem 0.75rem 0;
}

.product-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #051b3a;
}

.product-status-chip {
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.chip-icon {
  font-size: 0.9rem;
}

.chip-pending {
  background: #e4f4fc;
  color: #5d7a90;
}
.chip-preparing {
  background: #f59e0b;
  color: white;
}
.chip-served {
  background: #10b981;
  color: white;
}

/* ===== NOTAS ===== */
.product-notes {
  background: #fff3cd;
  border-left: 4px solid #f59e0b;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.notes-icon {
  font-size: 1rem;
}

.notes-text {
  color: #856404;
  font-weight: 500;
  line-height: 1.4;
}

/* ===== BOTONES DE ESTADO DEL PRODUCTO ===== */
.product-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
  flex-wrap: wrap;
}

.btn-status {
  flex: 1;
  min-width: 90px;
  padding: 0.5rem 0.75rem;
  border: 2px solid #e4f4fc;
  background: white;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #5d7a90;
}

.status-icon {
  font-size: 1rem;
}

.btn-status:hover:not(:disabled) {
  background: #e4f4fc;
  border-color: #609abb;
  transform: translateY(-2px);
}

/* Estados activos */
.btn-status-pending.active {
  background: #609abb;
  border-color: #609abb;
  color: white;
}

.btn-status-preparing.active {
  background: #f59e0b;
  border-color: #f59e0b;
  color: white;
}

.btn-status-served.active {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.btn-status:disabled {
  opacity: 0.8;
  cursor: default;
  transform: none;
}

/* ===== FOOTER ===== */
.order-footer {
  padding: 0.75rem 1.25rem;
  background: #e4f4fc;
  border-top: 2px solid rgba(96, 154, 187, 0.2);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #051b3a;
}

.footer-icon {
  font-size: 1rem;
}

.footer-text {
  font-weight: 500;
  font-style: italic;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .order-header {
    flex-direction: column;
    align-items: stretch;
  }

  .order-header-right {
    align-items: stretch;
  }

  .order-actions {
    flex-direction: column;
  }

  .btn-action {
    justify-content: center;
  }

  .product-item {
    flex-direction: column;
  }

  .product-quantity {
    margin: 0.5rem 0.5rem 0 0.5rem;
  }

  .product-info {
    padding: 0 0.75rem 0.75rem 0.75rem;
  }

  .product-actions {
    flex-direction: column;
  }

  .btn-status {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .order-badges {
    flex-direction: column;
  }

  .badge {
    width: 100%;
    justify-content: center;
  }

  .order-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .product-header-row {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* ===== OPTIMIZACIONES TÁCTILES ===== */
@media (hover: none) and (pointer: coarse) {
  .btn-action,
  .btn-status {
    padding: 0.75rem 1rem;
  }

  .product-item {
    cursor: default;
  }
}
</style>
