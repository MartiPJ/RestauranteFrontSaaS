<script setup lang="ts">
import { computed } from 'vue'
import type { Order } from '@/types/order'
import { OrderStatus } from '@/types/order'

const props = defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  view: [order: Order]
  updateStatus: [id: string, status: OrderStatus]
  delete: [id: string]
}>()

const statusConfig = computed(() => {
  switch (props.order.status) {
    case OrderStatus.OPEN:
      return { color: '#10b981', label: 'Abierta', bgColor: '#d1fae5' }
    case OrderStatus.CLOSED:
      return { color: '#6b7280', label: 'Cerrada', bgColor: '#f3f4f6' }
    case OrderStatus.CANCELLED:
      return { color: '#ef4444', label: 'Cancelada', bgColor: '#fee2e2' }
    default:
      return { color: '#6b7280', label: 'Desconocido', bgColor: '#f3f4f6' }
  }
})

const formattedDate = computed(() => {
  return new Date(props.order.createdAt).toLocaleString('es-GT', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <div class="order-card">
    <div class="order-header">
      <div>
        <h3 class="order-number">{{ order.orderNumber }}</h3>
        <p class="order-date">{{ formattedDate }}</p>
      </div>
      <span
        class="status-badge"
        :style="{
          backgroundColor: statusConfig.bgColor,
          color: statusConfig.color,
        }"
      >
        {{ statusConfig.label }}
      </span>
    </div>

    <div class="order-info">
      <div class="info-item">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        <span v-if="order.table">Mesa: {{ order.table.tableNumber }}</span>
        <span v-else class="takeout-label">Para Llevar</span>
      </div>
      <div class="info-item">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span>Mesero: {{ order.user.name }}</span>
      </div>
      <div v-if="order.notes" class="info-item">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
        <span class="notes">{{ order.notes }}</span>
      </div>
    </div>

    <div class="order-total">
      <span>Total:</span>
      <span class="total-amount">${{ parseFloat(order.total).toFixed(2) }}</span>
    </div>

    <div class="order-actions">
      <button @click="emit('view', order)" class="btn btn-primary">Ver Detalle</button>
      <button
        v-if="order.status === OrderStatus.OPEN"
        @click="emit('updateStatus', order.id, OrderStatus.CLOSED)"
        class="btn btn-success"
      >
        Cerrar Orden
      </button>
      <button
        v-if="order.status === OrderStatus.OPEN"
        @click="emit('updateStatus', order.id, OrderStatus.CANCELLED)"
        class="btn btn-warning"
      >
        Cancelar
      </button>
      <button
        v-if="order.status !== OrderStatus.OPEN"
        @click="emit('delete', order.id)"
        class="btn btn-danger"
      >
        Eliminar
      </button>
    </div>
  </div>
</template>

<style scoped>
.order-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.order-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.order-number {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.order-date {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.order-info {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.takeout-label {
  font-weight: 600;
  color: #f59e0b;
}

.notes {
  font-style: italic;
}

.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 16px;
  font-weight: 600;
}

.total-amount {
  color: #10b981;
  font-size: 20px;
}

.order-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
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

.btn-warning {
  background-color: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background-color: #d97706;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}
</style>
