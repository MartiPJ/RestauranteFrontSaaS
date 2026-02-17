<!-- src/views/InvoiceView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import InvoiceOrderList from '@/components/InvoiceOrderList.vue'
import InvoiceDetail from '@/components/InvoiceDetail.vue'
import { useInvoiceStore } from '@/stores/invoiceStore'
import type { Order } from '@/types/order'
import { OrderStatus } from '@/types/order'

const invoiceStore = useInvoiceStore()
const selectedOrder = ref<Order | null>(null)
const showToast = ref(false)
const toastMessage = ref('')

async function handleSelectOrder(order: Order) {
  // Verificar que la orden no esté pagada
  if (order.status === OrderStatus.PAID) {
    showNotification('Esta orden ya está pagada', 'error')
    return
  }

  selectedOrder.value = order
  await invoiceStore.fetchOrderDetails(order.id)
}

function handleOrderPaid(orderId: string) {
  selectedOrder.value = null
  invoiceStore.clearSelection()
  showNotification('¡Orden marcada como pagada exitosamente!', 'success')
}

function handleCloseDetail() {
  selectedOrder.value = null
  invoiceStore.clearSelection()
}

function showNotification(message: string, type: 'success' | 'error' = 'success') {
  toastMessage.value = message
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, 3000)
}
</script>

<template>
  <div class="invoice-view">
    <!-- Toast Notification -->
    <Transition name="toast">
      <div
        v-if="showToast"
        class="toast"
        :class="`toast-${toastMessage.includes('error') ? 'error' : 'success'}`"
      >
        <span class="toast-icon">{{ toastMessage.includes('error') ? '❌' : '✅' }}</span>
        <span class="toast-message">{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- Header -->
    <div class="view-header">
      <div class="header-content">
        <div class="title-section">
          <div class="header-icon">
            <span class="icon-emoji">💰</span>
          </div>
          <div class="title-text">
            <h1>Facturación</h1>
            <p class="subtitle">Gestiona los pagos de las órdenes entregadas</p>
          </div>
        </div>

        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-content">
              <span class="stat-value">{{ invoiceStore.deliveredOrders.length }}</span>
              <span class="stat-label">Órdenes Pendientes</span>
            </div>
          </div>
          <div class="stat-card total">
            <div class="stat-icon">💰</div>
            <div class="stat-content">
              <span class="stat-value">
                Q{{
                  invoiceStore.deliveredOrders
                    .reduce((sum, order) => sum + parseFloat(order.total), 0)
                    .toFixed(2)
                }}
              </span>
              <span class="stat-label">Total por Cobrar</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="view-content">
      <div class="content-grid" :class="{ 'has-selection': selectedOrder }">
        <!-- Panel de lista de órdenes -->
        <div class="orders-panel" :class="{ 'mobile-hidden': selectedOrder }">
          <InvoiceOrderList @select-order="handleSelectOrder" />
        </div>

        <!-- Panel de detalle de factura -->
        <transition name="slide">
          <InvoiceDetail
            v-if="selectedOrder"
            :order="selectedOrder"
            @paid="handleOrderPaid"
            @close="handleCloseDetail"
          />
        </transition>

        <!-- Empty State cuando no hay orden seleccionada -->
      </div>
    </div>
  </div>
</template>

<style scoped>
.invoice-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #e4f4fc;
}

/* Toast Notification */
.toast {
  position: fixed;
  top: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  box-shadow: 0 15px 30px rgba(5, 27, 58, 0.2);
  z-index: 2000;
  animation: slideInRight 0.3s ease;
  border-left: 4px solid;
}

.toast-success {
  background: linear-gradient(145deg, #10b981, #059669);
  border-left-color: #10b981;
}

.toast-error {
  background: linear-gradient(145deg, #ef4444, #dc2626);
  border-left-color: #ef4444;
}

.toast-icon {
  font-size: 1.25rem;
}

.toast-message {
  font-size: 0.95rem;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Header */
.view-header {
  background: white;
  border-bottom: 2px solid #e4f4fc;
  padding: 1.5rem 2rem;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1600px;
  margin: 0 auto;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(145deg, #609abb, #e4f4fc);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-emoji {
  font-size: 2rem;
}

.title-text h1 {
  margin: 0 0 0.25rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #051b3a;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  color: #5d7a90;
  font-size: 0.95rem;
}

/* Stats */
.stats-section {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background: #e4f4fc;
  border-radius: 100px;
  border: 1px solid rgba(96, 154, 187, 0.2);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.2);
}

.stat-card.total {
  background: #fef3c7;
  border-color: #f59e0b;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #051b3a;
  line-height: 1.2;
}

.stat-card.total .stat-value {
  color: #f59e0b;
}

.stat-label {
  font-size: 0.75rem;
  color: #5d7a90;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-card.total .stat-label {
  color: #b45309;
}

/* Content */
.view-content {
  flex: 1;
  padding: 2rem;
  overflow: hidden;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.content-grid {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  position: relative;
}

.content-grid.has-selection {
  grid-template-columns: 400px 1fr;
}

.orders-panel,
.detail-panel {
  height: 100%;
  overflow: hidden;
  background: white;
  border-radius: 20px;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  border: 1px solid rgba(96, 154, 187, 0.1);
}

/* Empty Selection */
.empty-selection {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  background: white;
  padding: 3rem;
  border-radius: 24px;
  box-shadow: 0 10px 25px rgba(5, 27, 58, 0.1);
  border: 2px dashed #b4cbd8;
  min-width: 320px;
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
  margin: 0 auto 1.5rem;
}

.empty-selection h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #051b3a;
}

.empty-selection p {
  margin: 0;
  font-size: 0.95rem;
  color: #5d7a90;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Responsive */
@media (max-width: 1200px) {
  .content-grid.has-selection {
    grid-template-columns: 350px 1fr;
  }
}

@media (max-width: 968px) {
  .view-header {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-section {
    width: 100%;
  }

  .stat-card {
    flex: 1;
    justify-content: center;
  }

  .view-content {
    padding: 1rem;
  }

  .content-grid.has-selection {
    grid-template-columns: 1fr;
  }

  .orders-panel.mobile-hidden {
    display: none;
  }

  .detail-panel {
    grid-column: 1;
  }
}

@media (max-width: 640px) {
  .title-text h1 {
    font-size: 1.5rem;
  }

  .header-icon {
    width: 48px;
    height: 48px;
  }

  .icon-emoji {
    font-size: 1.5rem;
  }

  .stats-section {
    flex-direction: column;
  }

  .stat-card {
    width: 100%;
    justify-content: space-between;
  }

  .empty-selection {
    padding: 2rem;
    min-width: auto;
  }

  .empty-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }

  .toast {
    top: 1rem;
    right: 1rem;
    left: 1rem;
  }
}

/* Optimizaciones táctiles */
@media (hover: none) and (pointer: coarse) {
  .stat-card {
    cursor: default;
  }
}
</style>
