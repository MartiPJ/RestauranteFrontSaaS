<!-- src/components/KitchenOrderCard.vue - Rediseño optimizado para móviles -->
<template>
  <div class="order-card" :class="statusClass">
    <!-- HEADER: Compacto y claro -->
    <div class="order-header">
      <div class="order-header-top">
        <div class="order-badges">
          <span class="badge badge-order-number">#{{ shortOrderNumber }}</span>
          <span class="badge" :class="`badge-${order.status}`">
            <span class="badge-icon">{{ statusIcon }}</span>
            {{ statusLabel }}
          </span>
          <span v-if="isPriority" class="badge badge-priority"> ⚡ Prioritario </span>
        </div>
        <div class="order-actions">
          <button
            v-for="action in availableActions"
            :key="action.status"
            @click="
              action.status === OrderStatus.CANCELLED
                ? requestCancelOrder(order.id)
                : emit('updateOrderStatus', order.id, action.status)
            "
            class="btn-action"
            :class="`btn-${action.status}`"
          >
            {{ action.icon }} {{ action.label }}
          </button>
        </div>
      </div>

      <div class="order-meta">
        <span class="meta-item">🕒 {{ timeAgo }}</span>
        <span class="meta-item">👤 {{ order.user?.name || 'Cliente' }}</span>
        <span class="meta-item location">
          📍 {{ order.table?.tableNumber ? `Mesa ${order.table.tableNumber}` : 'Para llevar' }}
        </span>
      </div>
    </div>

    <!-- PRODUCTOS: Diseño compacto tipo lista -->
    <div class="order-products">
      <div class="products-header">
        <span>🍽️ Productos ({{ orderProducts.length }})</span>
      </div>

      <div class="products-list">
        <div
          v-for="product in orderProducts"
          :key="product.id"
          class="product-item"
          :class="`product-${product.status}`"
        >
          <!-- Indicador de estado compacto -->
          <div class="product-status-indicator" :class="`indicator-${product.status}`"></div>

          <div class="product-content">
            <div class="product-row">
              <div class="product-quantity" :class="`quantity-${product.status}`">
                {{ product.quantity }}
              </div>
              <div class="product-name">{{ product.product.name }}</div>
              <div class="product-status-chip" :class="`chip-${product.status}`">
                {{ productStatusIcon[product.status] }} {{ productStatusLabel[product.status] }}
              </div>
            </div>

            <!-- Notas compactas -->
            <div v-if="product.notes" class="product-notes">📝 {{ product.notes }}</div>

            <!-- Botones de estado compactos -->
            <div class="product-actions">
              <button
                v-for="status in productStatuses"
                :key="status.value"
                @click="emit('updateItemStatus', product.id, status.value)"
                class="btn-status"
                :class="[`btn-status-${status.value}`, { active: product.status === status.value }]"
                :disabled="
                  product.status === status.value || product.status === OrderItemStatus.CANCELLED
                "
              >
                {{ status.icon }} {{ getShortLabel(status.label) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Nota general de la orden -->
    <div class="order-footer" v-if="order.notes">📌 {{ order.notes }}</div>
  </div>

  <ConfirmationModal
    :show="showCancelModal"
    title="Cancelar orden"
    :message="`¿Cancelar orden #${shortOrderNumber}?`"
    confirm-text="Sí, cancelar"
    cancel-text="No"
    type="danger"
    @confirm="confirmCancelOrder"
    @cancel="showCancelModal = false"
  />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Order, OrderProduct } from '@/types/order'
import { OrderStatus, OrderItemStatus } from '@/types/order'
import ConfirmationModal from '@/components/Confirmationmodal.vue'

interface Props {
  order: Order & { orderProducts?: OrderProduct[] }
}

interface Emits {
  (e: 'updateOrderStatus', orderId: string, status: OrderStatus): void
  (e: 'updateItemStatus', itemId: string, status: OrderItemStatus): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const showCancelModal = ref(false)
const orderToCancel = ref<string | null>(null)

const requestCancelOrder = (orderId: string) => {
  orderToCancel.value = orderId
  showCancelModal.value = true
}

const confirmCancelOrder = () => {
  if (orderToCancel.value) {
    emit('updateOrderStatus', orderToCancel.value, OrderStatus.CANCELLED)
  }
  showCancelModal.value = false
  orderToCancel.value = null
}

const orderProducts = computed(() => props.order.orderProducts || [])

const shortOrderNumber = computed(() => {
  const parts = props.order.orderNumber.split('-')
  return parts[parts.length - 1]
})

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

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    [OrderStatus.OPEN]: 'Nueva',
    [OrderStatus.IN_PROGRESS]: 'Proceso',
    [OrderStatus.READY]: 'Lista',
    [OrderStatus.DELIVERED]: 'Entregada',
    [OrderStatus.PAID]: 'Pagada',
    [OrderStatus.CANCELLED]: 'Cancelada',
  }
  return labels[props.order.status] || props.order.status
})

const statusClass = computed(() => `status-${props.order.status}`)

const isPriority = computed(() => {
  const minutes = elapsedMinutes.value
  const itemsCount = orderProducts.value.length
  return minutes > 15 || itemsCount > 5
})

const elapsedMinutes = computed(() => {
  const created = new Date(props.order.createdAt)
  const now = new Date()
  return Math.floor((now.getTime() - created.getTime()) / 60000)
})

const timeAgo = computed(() => {
  const minutes = elapsedMinutes.value

  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `${minutes}m`

  const created = new Date(props.order.createdAt)
  const hours = created.getHours().toString().padStart(2, '0')
  const mins = created.getMinutes().toString().padStart(2, '0')
  return `${hours}:${mins}`
})

const productStatuses = [
  { value: OrderItemStatus.PENDING, label: 'Pendiente', icon: '⏳' },
  { value: OrderItemStatus.PREPARING, label: 'Preparar', icon: '🔥' },
  { value: OrderItemStatus.SERVED, label: 'Servido', icon: '✅' },
]

const productStatusIcon = {
  [OrderItemStatus.PENDING]: '⏳',
  [OrderItemStatus.PREPARING]: '🔥',
  [OrderItemStatus.SERVED]: '✅',
  [OrderItemStatus.CANCELLED]: '❌',
}

const productStatusLabel = {
  [OrderItemStatus.PENDING]: 'Pendiente',
  [OrderItemStatus.PREPARING]: 'Cocina',
  [OrderItemStatus.SERVED]: 'Servido',
  [OrderItemStatus.CANCELLED]: 'Cancelado',
}

const getShortLabel = (label: string) => {
  const short: Record<string, string> = {
    Pendiente: 'Pendiente',
    Preparar: 'Preparando',
    Servido: 'Listo',
  }
  return short[label] || label
}

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
/* ===== DISEÑO BASE COMPACTO ===== */
.order-card {
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-left: 4px solid transparent;
}

/* Estados con borde izquierdo */
.status-open {
  border-left-color: #609abb;
}
.status-in_progress {
  border-left-color: #f59e0b;
}
.status-ready {
  border-left-color: #10b981;
}
.status-delivered {
  border-left-color: #8b5cf6;
}
.status-cancelled {
  border-left-color: #5d7a90;
  opacity: 0.85;
}

/* ===== HEADER COMPACTO ===== */
.order-header {
  padding: 12px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
}

.order-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.order-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.badge-order-number {
  background: #051b3a;
  color: white;
  font-size: 13px;
  font-weight: 700;
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
}

.order-actions {
  display: flex;
  gap: 6px;
}

.btn-action {
  padding: 4px 10px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: white;
  white-space: nowrap;
}

.btn-in_progress {
  background: #609abb;
}
.btn-ready {
  background: #10b981;
}
.btn-delivered {
  background: #8b5cf6;
}
.btn-cancelled {
  background: #ef4444;
}

.btn-action:active {
  transform: scale(0.96);
}

.order-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #666;
  flex-wrap: wrap;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.location {
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 12px;
}

/* ===== PRODUCTOS COMPACTOS ===== */
.order-products {
  padding: 8px 12px;
}

.products-header {
  font-size: 12px;
  font-weight: 600;
  color: #609abb;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e4f4fc;
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-item {
  display: flex;
  gap: 8px;
  background: #fafafa;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #eee;
}

.product-status-indicator {
  width: 3px;
  min-width: 3px;
}

.indicator-pending {
  background: #b4cbd8;
}
.indicator-preparing {
  background: #f59e0b;
}
.indicator-served {
  background: #10b981;
}

.product-content {
  flex: 1;
  padding: 8px 8px 8px 0;
}

.product-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.product-quantity {
  font-size: 16px;
  font-weight: 800;
  min-width: 32px;
  text-align: center;
  padding: 2px 6px;
  border-radius: 8px;
  background: #e4f4fc;
  color: #051b3a;
}

.quantity-preparing {
  background: #f59e0b;
  color: white;
}

.quantity-served {
  background: #10b981;
  color: white;
}

.product-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.product-status-chip {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.chip-pending {
  background: #e4f4fc;
  color: #5d7a90;
}

.chip-preparing {
  background: #fef3c7;
  color: #f59e0b;
}

.chip-served {
  background: #d1fae5;
  color: #10b981;
}

/* Notas compactas */
.product-notes {
  font-size: 11px;
  color: #856404;
  background: #fff3cd;
  padding: 4px 8px;
  border-radius: 6px;
  margin-bottom: 6px;
}

/* Botones de estado compactos */
.product-actions {
  display: flex;
  gap: 6px;
}

.btn-status {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  white-space: nowrap;
}

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

.btn-status:active {
  transform: scale(0.97);
}

.btn-status:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Footer compacto */
.order-footer {
  padding: 8px 12px;
  background: #e4f4fc;
  font-size: 11px;
  color: #051b3a;
  border-top: 1px solid rgba(96, 154, 187, 0.2);
}

/* ===== ESTILOS PARA PRODUCTOS CANCELADOS ===== */
.product-cancelled {
  opacity: 0.7;
  background: #f5f5f5;
}

.product-cancelled .product-name {
  text-decoration: line-through;
  color: #999;
}

/* ===== RESPONSIVE EXTRA ===== */
@media (max-width: 480px) {
  .order-header-top {
    flex-direction: column;
    align-items: stretch;
  }

  .order-actions {
    justify-content: stretch;
  }

  .btn-action {
    text-align: center;
    flex: 1;
  }

  .product-row {
    flex-wrap: wrap;
  }

  .product-status-chip {
    margin-left: auto;
  }

  .btn-status {
    font-size: 10px;
    padding: 5px 4px;
  }
}

/* Optimizaciones táctiles */
@media (hover: none) and (pointer: coarse) {
  .btn-action,
  .btn-status {
    min-height: 36px;
  }
}
</style>
