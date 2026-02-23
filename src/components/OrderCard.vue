<!-- src/components/OrderCard.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { Order, OrderProduct } from '@/types/order'
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
      return {
        color: '#10b981',
        label: 'Abierta',
        bgColor: '#d1fae5',
        borderColor: '#10b981',
        icon: '📋',
      }
    case OrderStatus.IN_PROGRESS:
      return {
        color: '#609abb',
        label: 'En Progreso',
        bgColor: '#e4f4fc',
        borderColor: '#609abb',
        icon: '⚙️',
      }
    case OrderStatus.READY:
      return {
        color: '#f59e0b',
        label: 'Lista',
        bgColor: '#fef3c7',
        borderColor: '#f59e0b',
        icon: '✅',
      }
    case OrderStatus.DELIVERED:
      return {
        color: '#8b5cf6',
        label: 'Entregada',
        bgColor: '#ede9fe',
        borderColor: '#8b5cf6',
        icon: '🚚',
      }
    case OrderStatus.PAID:
      return {
        color: '#5d7a90',
        label: 'Pagada',
        bgColor: '#e4f4fc',
        borderColor: '#5d7a90',
        icon: '💰',
      }
    case OrderStatus.CANCELLED:
      return {
        color: '#ef4444',
        label: 'Cancelada',
        bgColor: '#fee2e2',
        borderColor: '#ef4444',
        icon: '❌',
      }
    default:
      return {
        color: '#5d7a90',
        label: 'Desconocido',
        bgColor: '#e4f4fc',
        borderColor: '#5d7a90',
        icon: '❓',
      }
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

const items = computed<OrderProduct[]>(() => props.order.orderProducts ?? [])

const itemsCount = computed(() => {
  return items.value.reduce((total, item) => total + item.quantity, 0)
})

const timeAgo = computed(() => {
  const now = new Date()
  const orderDate = new Date(props.order.createdAt)
  const diffInMinutes = Math.floor((now.getTime() - orderDate.getTime()) / 60000)

  if (diffInMinutes < 1) return 'Hace un momento'
  if (diffInMinutes < 60)
    return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`
  return formattedDate.value
})
</script>

<template>
  <div class="order-card" :class="[`status-${order.status.toLowerCase()}`]">
    <!-- Barra de acento superior -->
    <div class="card-accent" :style="{ backgroundColor: statusConfig.borderColor }"></div>

    <div class="card-content">
      <!-- Header con número de orden y badge -->
      <div class="order-header">
        <div class="title-section">
          <span class="order-icon">📋</span>
          <div>
            <h3 class="order-number">{{ order.orderNumber }}</h3>
            <p class="order-time" :title="formattedDate">{{ timeAgo }}</p>
          </div>
        </div>
        <span
          class="status-badge"
          :style="{
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.color,
            borderColor: statusConfig.borderColor,
          }"
        >
          <span class="status-icon">{{ statusConfig.icon }}</span>
          {{ statusConfig.label }}
        </span>
      </div>

      <!-- Información de la orden -->
      <div class="order-info">
        <!-- Mesa / Para llevar -->
        <div class="info-item">
          <span class="info-icon">{{ order.table ? '🪑' : '🥡' }}</span>
          <span class="info-text">
            <strong>{{ order.table ? 'Mesa' : 'Tipo' }}:</strong>
            {{ order.table ? order.table.tableNumber : 'Para Llevar' }}
          </span>
        </div>

        <!-- Mesero -->
        <div class="info-item">
          <span class="info-icon">👤</span>
          <span class="info-text"> <strong>Mesero:</strong> {{ order.user.name }} </span>
        </div>

        <!-- Notas de la orden (si existen) -->
        <div v-if="order.notes" class="info-item notes-item">
          <span class="info-icon">📝</span>
          <span class="info-text notes">{{ order.notes }}</span>
        </div>
      </div>

      <!-- Total -->
      <div class="order-total">
        <span class="total-label">Total:</span>
        <span class="total-amount">${{ parseFloat(order.total).toFixed(2) }}</span>
      </div>

      <!-- Acciones -->
      <div class="order-actions">
        <button @click="emit('view', order)" class="btn btn-view">
          <span class="btn-icon">👁️</span>
          <span class="btn-text">Ver Detalle</span>
        </button>

        <button
          v-if="order.status === OrderStatus.OPEN"
          @click="emit('updateStatus', order.id, OrderStatus.CANCELLED)"
          class="btn btn-cancel"
          title="Cancelar orden"
        >
          <span class="btn-icon">✕</span>
          <span class="btn-text">Cancelar</span>
        </button>

        <button
          v-if="order.status === OrderStatus.CANCELLED"
          @click="emit('delete', order.id)"
          class="btn btn-delete"
          title="Eliminar orden"
        >
          <span class="btn-icon">🗑️</span>
          <span class="btn-text">Eliminar</span>
        </button>
      </div>

      <!-- Resumen de items (opcional - para vista rápida) -->
      <div v-if="items.length > 0" class="items-preview">
        <div class="preview-header">
          <span class="preview-title">Primeros items:</span>
        </div>
        <div class="preview-list">
          <div v-for="item in items.slice(0, 3)" :key="item.id" class="preview-item">
            <span class="item-quantity">{{ item.quantity }}x</span>
            <span class="item-name">{{ item.product.name }}</span>
          </div>
          <div v-if="items.length > 3" class="more-items">+{{ items.length - 3 }} más</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.08);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  border: 1px solid rgba(96, 154, 187, 0.1);
}

.order-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 25px rgba(5, 27, 58, 0.15);
}

/* Barra de acento superior */
.card-accent {
  height: 6px;
  width: 100%;
  transition: background-color 0.3s ease;
}

.card-content {
  padding: 1.25rem;
}

/* Header Styles */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.title-section {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.order-icon {
  font-size: 1.3rem;
  background: #e4f4fc;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #609abb;
}

.order-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: #051b3a;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.3px;
}

.order-time {
  font-size: 0.8rem;
  color: #b4cbd8;
  margin: 0;
}

.status-badge {
  padding: 0.4rem 0.8rem;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: 2px solid transparent;
  white-space: nowrap;
}

.status-icon {
  font-size: 0.9rem;
}

/* Info Section */
.order-info {
  background: #e4f4fc;
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #5d7a90;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-icon {
  font-size: 1rem;
  min-width: 20px;
  text-align: center;
}

.info-text {
  flex: 1;
  line-height: 1.4;
}

.info-text strong {
  color: #051b3a;
  font-weight: 600;
}

.notes-item {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 2px dashed rgba(96, 154, 187, 0.2);
}

.notes {
  font-style: italic;
  color: #5d7a90;
}

/* Total Section */
.order-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-top: 2px solid #e4f4fc;
  border-bottom: 2px solid #e4f4fc;
  margin-bottom: 1rem;
}

.total-label {
  font-weight: 600;
  color: #051b3a;
  font-size: 0.95rem;
}

.total-amount {
  color: #10b981;
  font-size: 1.4rem;
  font-weight: 700;
}

/* Actions */
.order-actions {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-icon {
  font-size: 1rem;
}

.btn-view {
  background: #e4f4fc;
  color: #609abb;
  border: 2px solid #609abb;
}

.btn-view:hover {
  background: #609abb;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.btn-cancel {
  background: #fee2e2;
  color: #ef4444;
  border: 2px solid #ef4444;
}

.btn-cancel:hover {
  background: #ef4444;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
}

.btn-delete {
  background: #fee2e2;
  color: #ef4444;
  border: 2px solid #ef4444;
}

.btn-delete:hover {
  background: #ef4444;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
}

/* Items Preview */
.items-preview {
  background: #e4f4fc;
  border-radius: 12px;
  padding: 0.75rem;
}

.preview-header {
  margin-bottom: 0.5rem;
}

.preview-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #5d7a90;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.item-quantity {
  font-weight: 700;
  color: #609abb;
  min-width: 30px;
}

.item-name {
  color: #051b3a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-items {
  font-size: 0.8rem;
  color: #b4cbd8;
  font-style: italic;
  margin-top: 0.25rem;
}

/* Estados específicos */
.status-open .card-accent {
  background-color: #10b981;
}
.status-in_progress .card-accent {
  background-color: #609abb;
}
.status-ready .card-accent {
  background-color: #f59e0b;
}
.status-delivered .card-accent {
  background-color: #8b5cf6;
}
.status-paid .card-accent {
  background-color: #5d7a90;
}
.status-cancelled .card-accent {
  background-color: #ef4444;
}

/* Responsive */
@media (max-width: 768px) {
  .card-content {
    padding: 1rem;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-badge {
    align-self: flex-start;
  }

  .order-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .btn-text {
    display: inline;
  }

  .items-preview {
    display: none; /* Ocultar preview en móviles para ahorrar espacio */
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .order-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}

/* Animaciones */
.order-card {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
