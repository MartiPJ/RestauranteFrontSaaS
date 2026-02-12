<!-- src/components/KitchenOrderCard.vue -->
<template>
  <div class="order-card" :class="statusClass">
    <!-- HEADER: Información principal de la orden -->
    <div class="order-header">
      <div class="order-header-left">
        <div class="order-badges">
          <span class="badge badge-order-number">#{{ shortOrderNumber }}</span>
          <span class="badge" :class="`badge-${order.status}`">
            {{ statusLabel }}
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
            <span class="meta-text mesa-info">
              {{ order.table?.tableNumber || 'Para llevar' }}
            </span>
          </div>
        </div>
      </div>

      <div class="order-header-right">
        <div class="order-timer" v-if="isActive">
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
        <span class="products-title">🍽️ Productos</span>
        <span class="products-count">{{ orderProducts.length }} items</span>
      </div>

      <div class="products-list">
        <div
          v-for="product in orderProducts"
          :key="product.id"
          class="product-item"
          :class="`product-${product.status}`"
        >
          <!-- Estado visual del producto -->
          <div class="product-status-indicator">
            <span class="status-dot" :class="`dot-${product.status}`"></span>
          </div>

          <!-- Cantidad - GRANDE y visible -->
          <div class="product-quantity">
            <span class="quantity-number">{{ product.quantity }}</span>
            <span class="quantity-label">x</span>
          </div>

          <!-- Información del producto -->
          <div class="product-info">
            <div class="product-name-row">
              <span class="product-name">{{ product.product.name }}</span>
              <span class="product-status-badge" :class="`badge-${product.status}`">
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

// Si la orden está activa (para timer)
const isActive = computed(() =>
  [OrderStatus.OPEN, OrderStatus.IN_PROGRESS].includes(props.order.status),
)

// Tiempo transcurrido formateado
const elapsedTime = computed(() => {
  const created = new Date(props.order.createdAt)
  const now = new Date()
  const diff = now.getTime() - created.getTime()

  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)

  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
})

// Tiempo relativo (hace X minutos)
const timeAgo = computed(() => {
  const created = new Date(props.order.createdAt)
  const now = new Date()
  const diff = Math.floor((now.getTime() - created.getTime()) / 60000)

  if (diff < 1) return 'Ahora'
  if (diff < 60) return `Hace ${diff} min`

  const hours = created.getHours().toString().padStart(2, '0')
  const minutes = created.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
})

// Estados disponibles para productos
const productStatuses = [
  { value: OrderItemStatus.PENDING, label: 'Pendiente', icon: '⏳' },
  { value: OrderItemStatus.PREPARING, label: 'Preparar', icon: '🔥' },
  { value: OrderItemStatus.SERVED, label: 'Servido', icon: '✅' },
]

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
        primary: true,
      })
      actions.push({
        status: OrderStatus.CANCELLED,
        label: 'Cancelar',
        icon: '❌',
        danger: true,
      })
      break
    case OrderStatus.IN_PROGRESS:
      actions.push({
        status: OrderStatus.READY,
        label: 'Lista',
        icon: '✅',
        primary: true,
      })
      actions.push({
        status: OrderStatus.CANCELLED,
        label: 'Cancelar',
        icon: '❌',
        danger: true,
      })
      break
    case OrderStatus.READY:
      actions.push({
        status: OrderStatus.DELIVERED,
        label: 'Entregar',
        icon: '🚀',
        primary: true,
      })
      break
  }

  return actions
})
</script>

<style scoped>
/* ===== VARIABLES ===== */
:root {
  --color-primary: #2563eb;
  --color-success: #16a34a;
  --color-warning: #ca8a04;
  --color-danger: #dc2626;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-600: #4b5563;
  --color-gray-900: #111827;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --radius-lg: 16px;
  --radius-md: 12px;
  --radius-sm: 8px;
}

/* ===== TARJETA PRINCIPAL ===== */
.order-card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  transition: all 0.2s ease;
  border-left: 6px solid transparent;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.order-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* Estados de la orden (colores en borde izquierdo) */
.status-open {
  border-left-color: var(--color-primary);
  background: #eff6ff;
}
.status-in_progress {
  border-left-color: var(--color-warning);
  background: #fef9e7;
}
.status-ready {
  border-left-color: var(--color-success);
  background: #f0fdf4;
}
.status-delivered {
  border-left-color: #8b5cf6;
  background: #f5f3ff;
  opacity: 0.9;
}
.status-cancelled {
  border-left-color: var(--color-gray-600);
  background: #f3f4f6;
  opacity: 0.8;
}

/* ===== HEADER ===== */
.order-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #e5e7eb;
  background: white;
}

.order-header-left {
  flex: 1;
}

.order-badges {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.badge {
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 16px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  letter-spacing: 0.5px;
}

.badge-order-number {
  background: var(--color-gray-900);
  color: white;
  font-size: 18px;
  padding: 6px 20px;
}

.badge-open {
  background: var(--color-primary);
  color: white;
}
.badge-in_progress {
  background: var(--color-warning);
  color: white;
}
.badge-ready {
  background: var(--color-success);
  color: white;
}
.badge-delivered {
  background: #8b5cf6;
  color: white;
}
.badge-cancelled {
  background: var(--color-gray-600);
  color: white;
}

.order-meta {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-gray-600);
  font-size: 15px;
  font-weight: 500;
}

.meta-icon {
  font-size: 18px;
}

.meta-text {
  color: var(--color-gray-900);
}

.mesa-info {
  font-weight: 700;
  background: #e5e7eb;
  padding: 4px 12px;
  border-radius: 9999px;
  color: var(--color-gray-900);
}

.order-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.order-timer {
  background: #1e293b;
  color: white;
  padding: 8px 16px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 18px;
}

.timer-icon {
  font-size: 18px;
}

.timer-time {
  font-family: monospace;
}

/* ===== ACCIONES DE LA ORDEN ===== */
.order-actions {
  display: flex;
  gap: 10px;
}

.btn-action {
  padding: 12px 20px;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
  box-shadow: var(--shadow-sm);
}

.btn-action:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-action:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 20px;
}

.btn-in_progress {
  background: var(--color-primary);
}
.btn-ready {
  background: var(--color-success);
}
.btn-delivered {
  background: #8b5cf6;
}
.btn-cancelled {
  background: var(--color-danger);
}

/* ===== PRODUCTOS ===== */
.order-products {
  padding: 20px;
  background: white;
  flex: 1;
}

.products-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.products-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--color-gray-900);
  display: flex;
  align-items: center;
  gap: 8px;
}

.products-count {
  background: var(--color-gray-100);
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-gray-600);
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ===== ITEM DE PRODUCTO ===== */
.product-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--color-gray-50);
  border-radius: var(--radius-md);
  border: 2px solid transparent;
  transition: all 0.2s ease;
  position: relative;
}

/* Estados del producto */
.product-pending {
  border-color: #9ca3af;
  background: white;
}
.product-preparing {
  border-color: var(--color-warning);
  background: #fef3c7;
}
.product-served {
  border-color: var(--color-success);
  background: #d1fae5;
  opacity: 0.9;
}

.product-status-indicator {
  display: flex;
  align-items: flex-start;
  padding-top: 4px;
}

.status-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: block;
}

.dot-pending {
  background: #9ca3af;
}
.dot-preparing {
  background: var(--color-warning);
  animation: pulse 1.5s infinite;
}
.dot-served {
  background: var(--color-success);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* ===== CANTIDAD - MUY GRANDE ===== */
.product-quantity {
  display: flex;
  align-items: baseline;
  background: var(--color-gray-900);
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  min-width: 70px;
  justify-content: center;
}

.quantity-number {
  font-size: 28px;
  font-weight: 900;
  color: white;
  line-height: 1;
}

.quantity-label {
  font-size: 20px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  margin-left: 2px;
}

/* ===== INFORMACIÓN DEL PRODUCTO ===== */
.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.product-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-gray-900);
}

.product-status-badge {
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-pending {
  background: #e5e7eb;
  color: var(--color-gray-600);
}
.badge-preparing {
  background: var(--color-warning);
  color: white;
}
.badge-served {
  background: var(--color-success);
  color: white;
}

/* ===== NOTAS ===== */
.product-notes {
  background: #fff3cd;
  border-left: 6px solid #ffc107;
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
}

.notes-icon {
  font-size: 20px;
}

.notes-text {
  color: #856404;
  font-weight: 600;
  line-height: 1.4;
}

/* ===== BOTONES DE ESTADO DEL PRODUCTO ===== */
.product-actions {
  display: flex;
  gap: 10px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.btn-status {
  flex: 1;
  min-width: 110px;
  padding: 14px 12px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--color-gray-600);
}

.status-icon {
  font-size: 20px;
}

.btn-status:hover:not(:disabled) {
  background: var(--color-gray-100);
  border-color: #9ca3af;
  transform: translateY(-1px);
}

/* Estados activos */
.btn-status-pending.active {
  background: #6b7280;
  border-color: #6b7280;
  color: white;
}

.btn-status-preparing.active {
  background: var(--color-warning);
  border-color: var(--color-warning);
  color: white;
}

.btn-status-served.active {
  background: var(--color-success);
  border-color: var(--color-success);
  color: white;
}

.btn-status:disabled {
  opacity: 0.8;
  cursor: default;
  transform: none;
}

/* ===== FOOTER ===== */
.order-footer {
  padding: 16px 20px;
  background: #f3f4f6;
  border-top: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  color: var(--color-gray-600);
}

.footer-icon {
  font-size: 18px;
}

.footer-text {
  font-weight: 500;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .order-header {
    flex-direction: column;
    gap: 16px;
  }

  .order-header-right {
    width: 100%;
    align-items: flex-start;
  }

  .order-actions {
    width: 100%;
  }

  .btn-action {
    flex: 1;
    justify-content: center;
  }

  .product-item {
    flex-direction: column;
  }

  .product-quantity {
    align-self: flex-start;
    min-width: 60px;
  }

  .product-actions {
    flex-direction: column;
  }

  .btn-status {
    width: 100%;
  }
}

/* Optimizaciones para pantallas grandes */
@media (min-width: 1400px) {
  .product-item {
    padding: 20px;
  }

  .product-name {
    font-size: 22px;
  }

  .quantity-number {
    font-size: 32px;
  }

  .btn-status {
    padding: 16px 20px;
    font-size: 18px;
  }
}
</style>
