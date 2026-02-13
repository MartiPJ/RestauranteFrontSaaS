<!-- src/components/InvoiceOrderList.vue -->
<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useInvoiceStore } from '@/stores/invoiceStore'
import type { Order } from '@/types/order'

const invoiceStore = useInvoiceStore()

const emit = defineEmits<{
  selectOrder: [order: Order]
}>()

onMounted(() => {
  loadOrders()
})

async function loadOrders() {
  try {
    await invoiceStore.fetchDeliveredOrders()
  } catch (error) {
    console.error('Error al cargar órdenes:', error)
  }
}

function handleSelectOrder(order: Order) {
  emit('selectOrder', order)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
  }).format(num)
}

const isOrderSelected = computed(() => {
  return (orderId: string) => invoiceStore.selectedOrder?.id === orderId
})
</script>

<template>
  <div class="order-list-container">
    <div class="header">
      <h2>Órdenes Entregadas</h2>
      <p class="subtitle">Selecciona una orden para procesar el pago</p>
    </div>

    <div v-if="invoiceStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando órdenes...</p>
    </div>

    <div v-else-if="invoiceStore.error" class="error-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" stroke-width="2" />
        <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round" />
        <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2" stroke-linecap="round" />
      </svg>
      <p>{{ invoiceStore.error }}</p>
      <button @click="loadOrders" class="retry-btn">Reintentar</button>
    </div>

    <div v-else-if="invoiceStore.deliveredOrders.length === 0" class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2" />
        <line x1="9" y1="9" x2="15" y2="15" stroke-width="2" stroke-linecap="round" />
        <line x1="15" y1="9" x2="9" y2="15" stroke-width="2" stroke-linecap="round" />
      </svg>
      <p>No hay órdenes pendientes de facturación</p>
    </div>

    <div v-else class="orders-grid">
      <div
        v-for="order in invoiceStore.deliveredOrders"
        :key="order.id"
        class="order-card"
        :class="{ selected: isOrderSelected(order.id) }"
        @click="handleSelectOrder(order)"
      >
        <div class="order-header">
          <span class="order-number">{{ order.orderNumber }}</span>
          <span class="order-total">{{ formatCurrency(order.total) }}</span>
        </div>

        <div class="order-info">
          <div class="info-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke-width="2" />
              <circle cx="12" cy="7" r="4" stroke-width="2" />
            </svg>
            <span>{{ order.user?.name || 'N/A' }}</span>
            <span class="role-badge" v-if="order.user?.roles?.[0]">
              {{ order.user.roles[0] }}
            </span>
          </div>

          <div class="info-row" v-if="order.table">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2" />
            </svg>
            <span>Mesa {{ order.table.tableNumber }}</span>
          </div>

          <div class="info-row">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2" />
              <line x1="16" y1="2" x2="16" y2="6" stroke-width="2" />
              <line x1="8" y1="2" x2="8" y2="6" stroke-width="2" />
              <line x1="3" y1="10" x2="21" y2="10" stroke-width="2" />
            </svg>
            <span>{{ formatDate(order.createdAt) }}</span>
          </div>
        </div>

        <div class="order-summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>{{ formatCurrency(order.subtotal) }}</span>
          </div>
          <div class="summary-row">
            <span>Impuesto:</span>
            <span>{{ formatCurrency(order.tax) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="invoiceStore.totalPages > 1" class="pagination">
      <button
        @click="loadOrders()"
        :disabled="invoiceStore.currentPage === 1"
        class="pagination-btn"
      >
        Anterior
      </button>
      <span class="page-info">
        Página {{ invoiceStore.currentPage }} de {{ invoiceStore.totalPages }}
      </span>
      <button
        @click="loadOrders()"
        :disabled="invoiceStore.currentPage === invoiceStore.totalPages"
        class="pagination-btn"
      >
        Siguiente
      </button>
    </div>
  </div>
</template>

<style scoped>
.order-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header {
  margin-bottom: 24px;
}

.header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.loading-state,
.error-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-state {
  color: #d32f2f;
}

.retry-btn {
  padding: 10px 20px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #45a049;
}

.empty-state svg {
  color: #bbb;
}

.orders-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding-right: 8px;
}

.orders-grid::-webkit-scrollbar {
  width: 8px;
}

.orders-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.orders-grid::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.orders-grid::-webkit-scrollbar-thumb:hover {
  background: #999;
}

.order-card {
  background: #fafafa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  height: fit-content;
}

.order-card:hover {
  border-color: #4caf50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
  transform: translateY(-2px);
}

.order-card.selected {
  border-color: #4caf50;
  background: #f1f8f4;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.25);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.order-number {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.order-total {
  font-size: 18px;
  font-weight: 700;
  color: #4caf50;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #555;
}

.info-row svg {
  flex-shrink: 0;
  stroke: #777;
}

.role-badge {
  margin-left: auto;
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: capitalize;
}

.order-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.pagination-btn {
  padding: 8px 16px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #45a049;
}

.pagination-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}
</style>
