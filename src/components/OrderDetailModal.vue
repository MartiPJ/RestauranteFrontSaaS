<!-- src/components/OrderDetailModal.vue -->
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useOrderStore } from '@/stores/orderStore'
import type { Order, OrderItem } from '@/types/order'
import { OrderItemStatus, OrderStatus } from '@/types/order'

const orderStore = useOrderStore()
const loading = ref(false)

const props = defineProps<{
  show: boolean
  orderId: string | null
}>()

const emit = defineEmits<{
  close: []
  updateItemStatus: [itemId: string, status: OrderItemStatus]
  closeOrder: [orderId: string]
}>()

const order = ref<Order | null>(null)

const statusOptions = [
  { value: OrderItemStatus.PENDING, label: 'Pendiente', color: '#f59e0b' },
  { value: OrderItemStatus.PREPARING, label: 'En preparación', color: '#3b82f6' },
  { value: OrderItemStatus.SERVED, label: 'Servido', color: '#10b981' },
  { value: OrderItemStatus.CANCELLED, label: 'Cancelado', color: '#ef4444' },
]

// Agregar computed properties para manejar el estado de la orden
const orderStatusLabel = computed(() => {
  if (!order.value) return ''

  switch (order.value.status) {
    case OrderStatus.OPEN:
      return 'Abierta'
    case OrderStatus.IN_PROGRESS:
      return 'En Progreso'
    case OrderStatus.READY:
      return 'Lista'
    case OrderStatus.DELIVERED:
      return 'Entregada'
    case OrderStatus.PAID:
      return 'Pagada'
    case OrderStatus.CANCELLED:
      return 'Cancelada'
    default:
      return 'Desconocido'
  }
})

const orderStatusColor = computed(() => {
  if (!order.value) return '#6b7280'

  switch (order.value.status) {
    case OrderStatus.OPEN:
      return '#10b981'
    case OrderStatus.IN_PROGRESS:
      return '#3b82f6'
    case OrderStatus.READY:
      return '#f59e0b'
    case OrderStatus.DELIVERED:
      return '#8b5cf6'
    case OrderStatus.PAID:
      return '#6b7280'
    case OrderStatus.CANCELLED:
      return '#ef4444'
    default:
      return '#6b7280'
  }
})

const canCloseOrder = computed(() => {
  if (!order.value) return false
  // Permitir marcar como pagada si la orden está abierta o entregada
  return order.value.status === OrderStatus.OPEN || order.value.status === OrderStatus.DELIVERED
})

const getStatusColor = (status: OrderItemStatus) => {
  const option = statusOptions.find((opt) => opt.value === status)
  return option ? option.color : '#6b7280'
}

const getStatusLabel = (status: OrderItemStatus) => {
  const option = statusOptions.find((opt) => opt.value === status)
  return option ? option.label : 'Desconocido'
}

// Usar watch para cargar la orden cuando cambie el orderId o show
watch(
  () => [props.show, props.orderId],
  async ([show, orderId]) => {
    if (show && orderId) {
      await loadOrder()
    } else {
      order.value = null
    }
  },
  { immediate: true },
)

async function loadOrder() {
  if (!props.orderId) return

  loading.value = true
  try {
    order.value = await orderStore.fetchOrderById(props.orderId)
  } catch (error) {
    console.error('Error al cargar orden:', error)
    alert('Error al cargar los detalles de la orden')
  } finally {
    loading.value = false
  }
}

function handleClose() {
  order.value = null
  emit('close')
}

function handleUpdateItemStatus(itemId: string, status: OrderItemStatus) {
  emit('updateItemStatus', itemId, status)
}

function handleCloseOrder() {
  if (order.value) {
    emit('closeOrder', order.value.id)
  }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container">
        <div class="modal-header">
          <div>
            <h2 v-if="order">Orden #{{ order.orderNumber }}</h2>
            <p v-if="order" class="subtitle">
              {{ order.table ? `Mesa ${order.table.tableNumber}` : 'Para llevar' }} -
              {{ new Date(order.createdAt).toLocaleString('es-GT') }}
            </p>
          </div>
          <button @click="handleClose" class="close-btn">
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
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>Cargando detalles...</p>
          </div>

          <div v-else-if="!order" class="empty">
            <p>No se pudo cargar la orden</p>
          </div>

          <div v-else class="order-details">
            <!-- Información de la orden -->
            <div class="order-info-section">
              <div class="info-row">
                <span class="label">Estado:</span>
                <span class="value" :style="{ color: orderStatusColor }">
                  {{ orderStatusLabel }}
                </span>
              </div>
              <div class="info-row">
                <span class="label">Mesero:</span>
                <span class="value">{{ order.user.name }}</span>
              </div>
              <div v-if="order.notes" class="info-row">
                <span class="label">Notas:</span>
                <span class="value notes">{{ order.notes }}</span>
              </div>
            </div>

            <!-- Items de la orden -->
            <div class="items-section">
              <h3>Items de la Orden</h3>
              <div v-if="!order.items || order.items.length === 0" class="empty-items">
                <p>No hay items en esta orden</p>
              </div>
              <div v-else class="items-list">
                <div v-for="item in order.items" :key="item.id" class="item-card">
                  <div class="item-header">
                    <div class="item-info">
                      <h4>{{ item.product.name }}</h4>
                      <div class="item-details">
                        <span>Cantidad: {{ item.quantity }}</span>
                        <span>Precio: ${{ parseFloat(item.unitPrice).toFixed(2) }}</span>
                        <span>Subtotal: ${{ parseFloat(item.subtotal).toFixed(2) }}</span>
                      </div>
                      <div v-if="item.notes" class="item-notes">
                        <strong>Notas:</strong> {{ item.notes }}
                      </div>
                    </div>
                    <div class="item-status">
                      <span
                        class="status-badge"
                        :style="{
                          backgroundColor: getStatusColor(item.status) + '20',
                          color: getStatusColor(item.status),
                        }"
                      >
                        {{ getStatusLabel(item.status) }}
                      </span>
                    </div>
                  </div>

                  <div class="item-actions">
                    <label>Cambiar estado:</label>
                    <div class="status-buttons">
                      <button
                        v-for="status in statusOptions"
                        :key="status.value"
                        @click="handleUpdateItemStatus(item.id, status.value)"
                        :class="['status-btn', { active: item.status === status.value }]"
                        :style="{ borderColor: status.color }"
                      >
                        {{ status.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Totales -->
            <div class="totals-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${{ parseFloat(order.subtotal).toFixed(2) }}</span>
              </div>
              <div class="total-row">
                <span>Impuestos:</span>
                <span>${{ parseFloat(order.tax).toFixed(2) }}</span>
              </div>
              <div class="total-row total">
                <span>Total:</span>
                <span class="total-amount">${{ parseFloat(order.total).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="handleClose" class="btn btn-secondary">Cerrar</button>
          <button v-if="canCloseOrder" @click="handleCloseOrder" class="btn btn-primary">
            Marcar como Pagada
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
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
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0 0 4px 0;
  font-size: 24px;
  color: #1f2937;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
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

.icon {
  width: 24px;
  height: 24px;
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

.loading,
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
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

.order-details {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.order-info-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #374151;
  min-width: 100px;
}

.value {
  color: #6b7280;
  flex: 1;
  text-align: right;
}

.value.notes {
  font-style: italic;
  color: #4b5563;
}

.items-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.empty-items {
  text-align: center;
  padding: 40px 20px;
  color: #9ca3af;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.item-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.item-details {
  display: flex;
  gap: 16px;
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 8px;
}

.item-notes {
  font-size: 13px;
  color: #4b5563;
  background: #f3f4f6;
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.item-actions {
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
}

.item-actions label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.status-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-btn {
  padding: 6px 12px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.status-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-btn.active {
  background-color: #e5e7eb;
  font-weight: 600;
}

.totals-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  color: #4b5563;
}

.total-row.total {
  border-top: 2px solid #e5e7eb;
  margin-top: 8px;
  padding-top: 12px;
  font-weight: 600;
  color: #1f2937;
}

.total-amount {
  font-size: 20px;
  color: #10b981;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
