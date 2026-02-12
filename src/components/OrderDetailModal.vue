<!-- src/components/OrderDetailModal.vue -->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useOrderStore } from '@/stores/orderStore'
import type { Order, OrderProduct } from '@/types/order'
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
}>()

const order = ref<Order | null>(null)

const statusOptions = [
  { value: OrderItemStatus.PENDING, label: 'Pendiente', color: '#f59e0b' },
  { value: OrderItemStatus.PREPARING, label: 'En preparación', color: '#3b82f6' },
  { value: OrderItemStatus.SERVED, label: 'Servido', color: '#10b981' },
  { value: OrderItemStatus.CANCELLED, label: 'Cancelado', color: '#ef4444' },
]

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

const getStatusColor = (status: OrderItemStatus) => {
  const option = statusOptions.find((opt) => opt.value === status)
  return option ? option.color : '#6b7280'
}

const getStatusLabel = (status: OrderItemStatus) => {
  const option = statusOptions.find((opt) => opt.value === status)
  return option ? option.label : 'Desconocido'
}

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
    const data = await orderStore.fetchOrderById(props.orderId)

    order.value = {
      id: data.id,
      orderNumber: data.orderNumber,
      status: data.status as OrderStatus,
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      notes: data.notes ?? undefined,
      closedAt: data.closedAt ?? null,
      table: data.table ?? null,
      user: data.user ?? { id: '', name: 'Desconocido' },
      orderProducts: data.orderProducts ?? [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
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
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container">
        <div class="modal-header">
          <div>
            <h2 v-if="order">Orden #{{ order.orderNumber }}</h2>
            <p v-if="order" class="subtitle">
              <span class="table-highlight">
                {{ order.table ? `Mesa ${order.table.tableNumber}` : 'Para llevar' }}
              </span>
              <span class="separator">•</span>
              <span>{{ new Date(order.createdAt).toLocaleString('es-GT') }}</span>
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
                <span class="value" :style="{ color: orderStatusColor, fontWeight: 600 }">
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
              <div
                v-if="!order.orderProducts || order.orderProducts.length === 0"
                class="empty-items"
              >
                <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <p>No hay items en esta orden</p>
              </div>
              <div v-else class="items-list">
                <div v-for="item in order.orderProducts" :key="item.id" class="item-card">
                  <div class="item-main">
                    <div class="item-info">
                      <h4>{{ item.product.name }}</h4>
                      <div class="item-details">
                        <div class="detail-item">
                          <span class="detail-label">Cantidad:</span>
                          <span class="detail-value">{{ item.quantity }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Precio unitario:</span>
                          <span class="detail-value"
                            >${{ parseFloat(item.unitPrice).toFixed(2) }}</span
                          >
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Subtotal:</span>
                          <span class="detail-value subtotal"
                            >${{ parseFloat(item.subtotal).toFixed(2) }}</span
                          >
                        </div>
                      </div>
                      <div v-if="item.notes" class="item-notes">
                        <svg
                          class="note-icon"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                          />
                        </svg>
                        <span>{{ item.notes }}</span>
                      </div>
                    </div>
                    <div class="item-status-container">
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
                        :style="{
                          borderColor: status.color,
                          backgroundColor: item.status === status.value ? status.color : 'white',
                          color: item.status === status.value ? 'white' : status.color,
                        }"
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
          <button @click="handleClose" class="btn btn-primary">Cerrar</button>
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
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #1f2937;
}

.subtitle {
  margin: 0;
  font-size: 15px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-highlight {
  font-weight: 700;
  font-size: 16px;
  color: #1f2937;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.separator {
  color: #d1d5db;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #d1d5db;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
}

.item-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.item-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.item-info {
  flex: 1;
}

.item-info h4 {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.item-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.detail-value.subtotal {
  color: #10b981;
  font-size: 16px;
}

.item-notes {
  display: flex;
  align-items: start;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;
  background: #fef3c7;
  padding: 10px 12px;
  border-radius: 6px;
  border-left: 3px solid #f59e0b;
}

.note-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #f59e0b;
  margin-top: 2px;
}

.item-status-container {
  margin-left: 16px;
}

.status-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.item-actions {
  border-top: 2px solid #e5e7eb;
  padding-top: 16px;
}

.item-actions label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-btn {
  padding: 8px 16px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.status-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.status-btn.active {
  font-weight: 700;
}

.totals-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  margin-top: 16px;
  color: white;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
}

.total-row.total {
  border-top: 2px solid rgba(255, 255, 255, 0.3);
  margin-top: 8px;
  padding-top: 12px;
  font-weight: 700;
  color: white;
  font-size: 16px;
}

.total-amount {
  font-size: 28px;
  font-weight: 700;
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
