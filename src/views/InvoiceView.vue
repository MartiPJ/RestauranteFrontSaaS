<script setup lang="ts">
import { ref } from 'vue'
import InvoiceOrderList from '@/components/InvoiceOrderList.vue'
import InvoiceDetail from '@/components/InvoiceDetail.vue'
import { useInvoiceStore } from '@/stores/invoiceStore'
import type { Order } from '@/types/order'
import { OrderStatus } from '@/types/order'

const invoiceStore = useInvoiceStore()
const selectedOrder = ref<Order | null>(null)

async function handleSelectOrder(order: Order) {
  // ✅ Verificar que la orden no esté pagada
  if (order.status === OrderStatus.PAID) {
    alert('Esta orden ya está pagada')
    return
  }

  selectedOrder.value = order
  await invoiceStore.fetchOrderDetails(order.id)
}

function handleOrderPaid(orderId: string) {
  selectedOrder.value = null
  invoiceStore.clearSelection()
  showSuccessNotification()
}

function handleCloseDetail() {
  selectedOrder.value = null
  invoiceStore.clearSelection()
}

function showSuccessNotification() {
  alert('¡Orden marcada como pagada exitosamente!')
}
</script>

<template>
  <div class="invoice-view">
    <div class="view-header">
      <div class="header-content">
        <div class="title-section">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            class="header-icon"
          >
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke-width="2" />
            <line x1="1" y1="10" x2="23" y2="10" stroke-width="2" />
          </svg>
          <div>
            <h1>Facturación</h1>
            <p class="subtitle">Gestiona los pagos de las órdenes entregadas</p>
          </div>
        </div>
        <div class="stats-section">
          <div class="stat-card">
            <span class="stat-label">Órdenes Pendientes</span>
            <span class="stat-value">{{ invoiceStore.deliveredOrders.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="view-content">
      <div class="content-grid" :class="{ 'has-selection': selectedOrder }">
        <div class="orders-panel">
          <InvoiceOrderList @select-order="handleSelectOrder" />
        </div>

        <transition name="slide">
          <div v-if="selectedOrder" class="detail-panel">
            <InvoiceDetail
              :order="selectedOrder"
              @paid="handleOrderPaid"
              @close="handleCloseDetail"
            />
          </div>
        </transition>
      </div>
    </div>

    <!-- Empty state cuando no hay orden seleccionada -->
    <!-- <div v-if="!selectedOrder && invoiceStore.deliveredOrders.length > 0" class="empty-selection">
      <svg
        width="120"
        height="120"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        class="empty-icon"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-width="2" />
        <polyline points="14 2 14 8 20 8" stroke-width="2" />
        <line x1="16" y1="13" x2="8" y2="13" stroke-width="2" />
        <line x1="16" y1="17" x2="8" y2="17" stroke-width="2" />
        <polyline points="10 9 9 9 8 9" stroke-width="2" />
      </svg>
      <h3>Selecciona una orden</h3>
      <p>Elige una orden de la lista para ver sus detalles y procesar el pago</p>
    </div> -->
  </div>
</template>

<style scoped>
.invoice-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.view-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 24px 32px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1600px;
  margin: 0 auto;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  stroke: #4caf50;
  flex-shrink: 0;
}

.title-section h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
}

.subtitle {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #666;
}

.stats-section {
  display: flex;
  gap: 16px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 12px 20px;
  background: #f0f9f4;
  border-radius: 8px;
  border: 1px solid #c8e6c9;
}

.stat-label {
  font-size: 12px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #4caf50;
}

.view-content {
  flex: 1;
  padding: 24px 32px;
  overflow: hidden;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.content-grid {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  position: relative;
}

.content-grid.has-selection {
  grid-template-columns: 450px 1fr;
}

.orders-panel,
.detail-panel {
  height: 100%;
  overflow: hidden;
}

.empty-selection {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.empty-icon {
  stroke: #e0e0e0;
  margin-bottom: 16px;
}

.empty-selection h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #999;
}

.empty-selection p {
  margin: 0;
  font-size: 14px;
  color: #bbb;
}

/* Transitions */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Responsive */
@media (max-width: 1200px) {
  .content-grid.has-selection {
    grid-template-columns: 400px 1fr;
  }
}

@media (max-width: 968px) {
  .view-header {
    padding: 16px 20px;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stats-section {
    width: 100%;
    justify-content: flex-start;
  }

  .view-content {
    padding: 16px 20px;
  }

  .content-grid.has-selection {
    grid-template-columns: 1fr;
  }

  .orders-panel {
    display: none;
  }

  .detail-panel {
    grid-column: 1;
  }

  .empty-selection {
    display: none;
  }
}

@media (max-width: 640px) {
  .title-section h1 {
    font-size: 24px;
  }

  .subtitle {
    font-size: 13px;
  }

  .stat-value {
    font-size: 24px;
  }

  .view-content {
    padding: 12px 16px;
  }
}
</style>
