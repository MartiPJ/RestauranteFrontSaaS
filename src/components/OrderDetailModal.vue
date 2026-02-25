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
  { value: OrderItemStatus.PREPARING, label: 'Preparando', color: '#609abb' },
  { value: OrderItemStatus.SERVED, label: 'Servido', color: '#10b981' },
  { value: OrderItemStatus.CANCELLED, label: 'Cancelado', color: '#ef4444' },
]

const orderStatusConfig = computed(() => {
  if (!order.value)
    return { label: 'Desconocido', color: '#5d7a90', bgColor: '#e4f4fc', icon: '❓' }

  switch (order.value.status) {
    case OrderStatus.OPEN:
      return { label: 'Abierta', color: '#10b981', bgColor: '#d1fae5', icon: '📋' }
    case OrderStatus.IN_PROGRESS:
      return { label: 'En Progreso', color: '#609abb', bgColor: '#e4f4fc', icon: '⚙️' }
    case OrderStatus.READY:
      return { label: 'Lista', color: '#f59e0b', bgColor: '#fef3c7', icon: '✅' }
    case OrderStatus.DELIVERED:
      return { label: 'Entregada', color: '#8b5cf6', bgColor: '#ede9fe', icon: '🚚' }
    case OrderStatus.PAID:
      return { label: 'Pagada', color: '#5d7a90', bgColor: '#e4f4fc', icon: '💰' }
    case OrderStatus.CANCELLED:
      return { label: 'Cancelada', color: '#ef4444', bgColor: '#fee2e2', icon: '❌' }
    default:
      return { label: 'Desconocido', color: '#5d7a90', bgColor: '#e4f4fc', icon: '❓' }
  }
})

const getStatusColor = (status: OrderItemStatus) => {
  const option = statusOptions.find((opt) => opt.value === status)
  return option ? option.color : '#5d7a90'
}

const getStatusLabel = (status: OrderItemStatus) => {
  const option = statusOptions.find((opt) => opt.value === status)
  return option ? option.label : 'Desconocido'
}

const getStatusBgColor = (status: OrderItemStatus) => {
  const colors = {
    [OrderItemStatus.PENDING]: '#fef3c7',
    [OrderItemStatus.PREPARING]: '#e4f4fc',
    [OrderItemStatus.SERVED]: '#d1fae5',
    [OrderItemStatus.CANCELLED]: '#fee2e2',
  }
  return colors[status] || '#e4f4fc'
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

const formattedDate = computed(() => {
  if (!order.value) return ''
  return new Date(order.value.createdAt).toLocaleString('es-GT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-content">
            <div class="header-icon">
              <span class="icon-emoji">📋</span>
            </div>
            <div class="header-text">
              <h2 v-if="order">Orden #{{ order.orderNumber }}</h2>
              <div v-if="order" class="header-subtitle">
                <span class="table-badge" :class="{ takeout: !order.table }">
                  {{ order.table ? `Mesa ${order.table.tableNumber}` : 'Para llevar' }}
                </span>
                <span class="separator">•</span>
                <span class="date">{{ formattedDate }}</span>
              </div>
            </div>
          </div>
          <button @click="handleClose" class="close-btn" title="Cerrar">
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
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Cargando detalles de la orden...</p>
          </div>

          <div v-else-if="!order" class="empty-state">
            <span class="empty-icon">❌</span>
            <h3>Error al cargar</h3>
            <p>No se pudo cargar la información de la orden</p>
          </div>

          <div v-else class="order-details">
            <!-- Info Card -->
            <div class="info-card">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-icon">📊</span>
                  <div class="info-content">
                    <span class="info-label">Estado de orden</span>
                    <span class="info-value" :style="{ color: orderStatusConfig.color }">
                      <span
                        class="status-dot"
                        :style="{ backgroundColor: orderStatusConfig.color }"
                      ></span>
                      {{ orderStatusConfig.label }}
                    </span>
                  </div>
                </div>

                <div class="info-item">
                  <span class="info-icon">👤</span>
                  <div class="info-content">
                    <span class="info-label">Mesero</span>
                    <span class="info-value">{{ order.user.name }}</span>
                  </div>
                </div>

                <div v-if="order.notes" class="info-item full-width">
                  <span class="info-icon">📝</span>
                  <div class="info-content">
                    <span class="info-label">Notas</span>
                    <span class="info-value notes">{{ order.notes }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Items Section -->
            <div class="items-section">
              <div class="section-header">
                <h3>Items de la Orden</h3>
                <span class="section-badge">{{ order.orderProducts?.length || 0 }} items</span>
              </div>

              <div
                v-if="!order.orderProducts || order.orderProducts.length === 0"
                class="empty-items"
              >
                <span class="empty-icon">🍽️</span>
                <p>No hay items en esta orden</p>
              </div>

              <div v-else class="items-list">
                <div v-for="item in order.orderProducts" :key="item.id" class="item-card">
                  <!-- Item Header -->
                  <div class="item-header">
                    <div class="item-title">
                      <h4>{{ item.product.name }}</h4>
                      <span
                        class="item-status-badge"
                        :style="{
                          backgroundColor: getStatusBgColor(item.status),
                          color: getStatusColor(item.status),
                          borderColor: getStatusColor(item.status),
                        }"
                      >
                        {{ getStatusLabel(item.status) }}
                      </span>
                    </div>
                  </div>

                  <!-- Item Details -->
                  <div class="item-details">
                    <div class="detail-grid">
                      <div class="detail-box">
                        <span class="detail-label">Cantidad</span>
                        <span class="detail-value quantity">{{ item.quantity }}</span>
                      </div>
                      <div class="detail-box">
                        <span class="detail-label">Precio unitario</span>
                        <span class="detail-value"
                          >${{ parseFloat(item.unitPrice).toFixed(2) }}</span
                        >
                      </div>
                      <div class="detail-box highlight">
                        <span class="detail-label">Subtotal</span>
                        <span class="detail-value subtotal"
                          >${{ parseFloat(item.subtotal).toFixed(2) }}</span
                        >
                      </div>
                    </div>

                    <div v-if="item.notes" class="item-notes">
                      <span class="note-icon">💬</span>
                      <span class="note-text">{{ item.notes }}</span>
                    </div>
                  </div>

                  <!-- Status Actions -->
                  <div class="item-actions">
                    <label class="actions-label">Cambiar estado:</label>
                    <div class="status-buttons">
                      <button
                        v-for="status in statusOptions"
                        :key="status.value"
                        @click="handleUpdateItemStatus(item.id, status.value)"
                        class="status-btn"
                        :class="{ active: item.status === status.value }"
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

            <!-- Totals Section -->
            <div class="totals-card">
              <div class="total-row">
                <span>Subtotal</span>
                <span>${{ parseFloat(order.subtotal).toFixed(2) }}</span>
              </div>
              <!-- <div class="total-row">
                <span>Impuestos</span>
                <span>${{ parseFloat(order.tax).toFixed(2) }}</span>
              </div> -->
              <div class="total-row final">
                <span>Total</span>
                <span class="total-amount">${{ parseFloat(order.total).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button @click="handleClose" class="btn btn-primary">
            <span class="btn-icon">✓</span>
            <span class="btn-text">Cerrar</span>
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
  background-color: rgba(5, 27, 58, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(5, 27, 58, 0.25);
  animation: modalAppear 0.3s ease;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 2px solid #e4f4fc;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(145deg, #609abb, #e4f4fc);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-emoji {
  font-size: 1.5rem;
}

.header-text h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #051b3a;
  letter-spacing: -0.3px;
}

.header-subtitle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #5d7a90;
}

.table-badge {
  background: #e4f4fc;
  color: #609abb;
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.85rem;
}

.table-badge.takeout {
  background: #fef3c7;
  color: #f59e0b;
}

.separator {
  color: #b4cbd8;
}

.date {
  color: #5d7a90;
}

.close-btn {
  background: #e4f4fc;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #609abb;
  border-radius: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.close-btn:hover {
  background: #609abb;
  color: white;
  transform: rotate(90deg);
}

.icon {
  width: 20px;
  height: 20px;
}

/* Body */
.modal-body {
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #5d7a90;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e4f4fc;
  border-top-color: #609abb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

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
}

.empty-state h3 {
  color: #051b3a;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #5d7a90;
  margin: 0;
}

/* Info Card */
.info-card {
  background: #e4f4fc;
  border-radius: 20px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-icon {
  font-size: 1.25rem;
  background: white;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-content {
  flex: 1;
}

.info-label {
  display: block;
  font-size: 0.75rem;
  color: #5d7a90;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.info-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #051b3a;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.info-value.notes {
  font-style: italic;
  font-weight: 400;
  color: #5d7a90;
}

/* Items Section */
.items-section {
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #051b3a;
  margin: 0;
}

.section-badge {
  background: #e4f4fc;
  color: #609abb;
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-card {
  background: white;
  border: 2px solid #e4f4fc;
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.3s ease;
}

.item-card:hover {
  border-color: #609abb;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.1);
}

.item-header {
  margin-bottom: 1rem;
}

.item-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.item-title h4 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #051b3a;
  margin: 0;
}

.item-status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 2px solid transparent;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.detail-box {
  background: #e4f4fc;
  padding: 0.75rem;
  border-radius: 12px;
  text-align: center;
}

.detail-box.highlight {
  background: #d1fae5;
}

.detail-label {
  display: block;
  font-size: 0.7rem;
  color: #5d7a90;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.detail-value {
  font-weight: 700;
  color: #051b3a;
  font-size: 1rem;
}

.detail-value.quantity {
  color: #609abb;
  font-size: 1.1rem;
}

.detail-value.subtotal {
  color: #10b981;
  font-size: 1.1rem;
}

.item-notes {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: #fef3c7;
  padding: 0.75rem;
  border-radius: 10px;
  font-size: 0.9rem;
  color: #f59e0b;
  border-left: 3px solid #f59e0b;
}

.note-icon {
  font-size: 1rem;
}

.note-text {
  flex: 1;
  font-style: italic;
  color: #5d7a90;
}

.item-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px dashed #e4f4fc;
}

.actions-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #5d7a90;
  margin-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-btn {
  padding: 0.5rem 1rem;
  border: 2px solid;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.status-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.status-btn.active {
  font-weight: 700;
}

/* Totals Card */
.totals-card {
  background: linear-gradient(145deg, #609abb, #5d7a90);
  border-radius: 20px;
  padding: 1.5rem;
  color: white;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
}

.total-row.final {
  border-top: 2px solid rgba(255, 255, 255, 0.3);
  margin-top: 0.5rem;
  padding-top: 1rem;
  font-weight: 700;
  font-size: 1.1rem;
}

.total-amount {
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
}

/* Footer */
.modal-footer {
  display: flex;
  padding: 1.5rem;
  border-top: 2px solid #e4f4fc;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(145deg, #609abb, #5d7a90);
  color: white;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(145deg, #5d7a90, #051b3a);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.3);
}

.btn-icon {
  font-size: 1.1rem;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .detail-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .status-buttons {
    flex-direction: column;
  }

  .status-btn {
    width: 100%;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-subtitle {
    flex-wrap: wrap;
  }

  .total-amount {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .close-btn {
    align-self: flex-end;
  }

  .item-title {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
