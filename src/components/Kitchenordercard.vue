<!-- src/components/KitchenOrderCard.vue -->
<template>
  <div class="order-card" :class="`status-${order.status}`">
    <div class="order-header">
      <div class="order-info">
        <h3 class="order-number">{{ order.orderNumber }}</h3>
        <p class="order-table" v-if="order.table">Mesa: {{ order.table.tableNumber }}</p>
        <p class="order-table" v-else>Para llevar</p>
        <p class="order-time">{{ formatTime(order.createdAt) }}</p>
      </div>

      <div class="order-actions">
        <button
          v-for="action in availableActions"
          :key="action.status"
          @click="updateStatus(action.status)"
          class="action-btn"
          :class="`btn-${action.status}`"
          :title="action.label"
        >
          {{ action.icon }}
        </button>
      </div>
    </div>

    <div class="order-items">
      <div
        v-for="item in orderItems"
        :key="item.id"
        class="order-item"
        :class="`item-${item.status}`"
      >
        <div class="item-image" v-if="item.product.imageUrl">
          <img :src="item.product.imageUrl" :alt="item.product.name" />
        </div>
        <div class="item-details">
          <div class="item-header">
            <span class="item-quantity">{{ item.quantity }}x</span>
            <span class="item-name">{{ item.product.name }}</span>
          </div>
          <p v-if="item.notes" class="item-notes">📝 {{ item.notes }}</p>

          <div class="item-status-buttons">
            <button
              v-for="status in itemStatuses"
              :key="status.value"
              @click="updateItemStatus(item.id, status.value)"
              class="status-btn"
              :class="{ active: item.status === status.value }"
              :disabled="item.status === status.value"
            >
              {{ status.icon }} {{ status.label }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Order, OrderItem } from '@/types/order'
import { OrderStatus, OrderItemStatus } from '@/types/order'

interface Props {
  order: Order
  orderItems: OrderItem[]
}

interface Emits {
  (e: 'updateOrderStatus', orderId: string, status: OrderStatus): void
  (e: 'updateItemStatus', itemId: string, status: OrderItemStatus): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const itemStatuses = [
  { value: OrderItemStatus.PENDING, label: 'Pendiente', icon: '⏳' },
  { value: OrderItemStatus.PREPARING, label: 'Preparando', icon: '🔥' },
  { value: OrderItemStatus.SERVED, label: 'Servido', icon: '✅' },
]

const availableActions = computed(() => {
  const actions = []

  switch (props.order.status) {
    case OrderStatus.OPEN:
      actions.push({ status: OrderStatus.IN_PROGRESS, label: 'Iniciar', icon: '▶️' })
      actions.push({ status: OrderStatus.CANCELLED, label: 'Cancelar', icon: '❌' })
      break
    case OrderStatus.IN_PROGRESS:
      actions.push({ status: OrderStatus.READY, label: 'Lista', icon: '✅' })
      actions.push({ status: OrderStatus.CANCELLED, label: 'Cancelar', icon: '❌' })
      break
    case OrderStatus.READY:
      actions.push({ status: OrderStatus.DELIVERED, label: 'Entregada', icon: '🚀' })
      break
  }

  return actions
})

const updateStatus = (status: OrderStatus) => {
  emit('updateOrderStatus', props.order.id, status)
}

const updateItemStatus = (itemId: string, status: OrderItemStatus) => {
  emit('updateItemStatus', itemId, status)
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Ahora'
  if (diffMins < 60) return `${diffMins} min`

  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}
</script>

<style scoped>
.order-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 5px solid #ddd;
  transition: all 0.3s ease;
}

.order-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.status-open {
  border-left-color: #3b82f6;
  background: linear-gradient(to right, #eff6ff 0%, white 50%);
}

.status-in_progress {
  border-left-color: #f59e0b;
  background: linear-gradient(to right, #fffbeb 0%, white 50%);
}

.status-ready {
  border-left-color: #10b981;
  background: linear-gradient(to right, #ecfdf5 0%, white 50%);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f3f4f6;
}

.order-info {
  flex: 1;
}

.order-number {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #111827;
}

.order-table {
  font-size: 16px;
  font-weight: 600;
  margin: 4px 0;
  color: #4b5563;
}

.order-time {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0 0;
  font-weight: 500;
}

.order-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.action-btn {
  padding: 12px 20px;
  font-size: 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 60px;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.action-btn:active {
  transform: translateY(0);
}

.btn-in_progress {
  background: #3b82f6;
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

.order-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.item-pending {
  border-color: #e5e7eb;
  background: #ffffff;
}

.item-preparing {
  border-color: #fbbf24;
  background: #fffbeb;
}

.item-served {
  border-color: #10b981;
  background: #ecfdf5;
  opacity: 0.7;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.item-quantity {
  background: #3b82f6;
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 18px;
  min-width: 45px;
  text-align: center;
}

.item-name {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
}

.item-notes {
  font-size: 14px;
  color: #6b7280;
  background: white;
  padding: 8px;
  border-radius: 6px;
  margin: 0;
  border-left: 3px solid #f59e0b;
}

.item-status-buttons {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.status-btn {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  color: #6b7280;
}

.status-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
  transform: translateY(-1px);
}

.status-btn.active {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
  cursor: default;
}

.status-btn:disabled {
  cursor: default;
}

.status-btn:active:not(:disabled) {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .order-card {
    padding: 16px;
  }

  .order-number {
    font-size: 20px;
  }

  .action-btn {
    padding: 10px 16px;
    font-size: 20px;
    min-width: 50px;
  }

  .item-image {
    width: 60px;
    height: 60px;
  }

  .item-quantity {
    font-size: 16px;
    padding: 4px 10px;
  }

  .item-name {
    font-size: 16px;
  }
}
</style>
