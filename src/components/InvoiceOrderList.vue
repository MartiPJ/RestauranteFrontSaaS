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
      <div class="header-icon">
        <span class="icon-emoji">📋</span>
      </div>
      <div class="header-text">
        <h2>Órdenes Entregadas</h2>
        <p class="subtitle">Selecciona una orden para procesar el pago</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="invoiceStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p class="loading-text">Cargando órdenes...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="invoiceStore.error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ invoiceStore.error }}</p>
      <button @click="loadOrders" class="btn-retry">
        <span class="btn-icon">↻</span>
        Reintentar
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="invoiceStore.deliveredOrders.length === 0" class="empty-state">
      <div class="empty-icon">🧾</div>
      <h3 class="empty-title">No hay órdenes pendientes</h3>
      <p class="empty-message">Las órdenes entregadas aparecerán aquí para facturación</p>
    </div>

    <!-- Orders Grid -->
    <div v-else class="orders-grid">
      <div
        v-for="order in invoiceStore.deliveredOrders"
        :key="order.id"
        class="order-card"
        :class="{ selected: isOrderSelected(order.id) }"
        @click="handleSelectOrder(order)"
      >
        <div class="order-header">
          <div class="order-number-badge">
            <span class="badge-icon">📋</span>
            <span class="order-number">{{ order.orderNumber }}</span>
          </div>
          <span class="order-total">{{ formatCurrency(order.total) }}</span>
        </div>

        <div class="order-info">
          <div class="info-row">
            <span class="info-icon">👤</span>
            <span class="info-text">{{ order.user?.name || 'Cliente' }}</span>
            <span class="role-chip" v-if="order.user?.roles?.[0]">
              {{ order.user.roles[0] }}
            </span>
          </div>

          <div class="info-row" v-if="order.table">
            <span class="info-icon">📍</span>
            <span class="info-text">Mesa {{ order.table.tableNumber }}</span>
          </div>

          <div class="info-row">
            <span class="info-icon">🕒</span>
            <span class="info-text">{{ formatDate(order.createdAt) }}</span>
          </div>
        </div>

        <div class="order-summary">
          <div class="summary-row">
            <span class="summary-label">Subtotal</span>
            <span class="summary-value">{{ formatCurrency(order.subtotal) }}</span>
          </div>
          <div class="summary-row tax">
            <span class="summary-label">Impuesto</span>
            <span class="summary-value">{{ formatCurrency(order.tax) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="invoiceStore.totalPages > 1" class="pagination">
      <button
        @click="loadOrders()"
        :disabled="invoiceStore.currentPage === 1"
        class="pagination-btn prev"
      >
        <span class="btn-icon">←</span>
        <span>Anterior</span>
      </button>
      <span class="page-info">
        Página {{ invoiceStore.currentPage }} de {{ invoiceStore.totalPages }}
      </span>
      <button
        @click="loadOrders()"
        :disabled="invoiceStore.currentPage === invoiceStore.totalPages"
        class="pagination-btn next"
      >
        <span>Siguiente</span>
        <span class="btn-icon">→</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.order-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  border: 1px solid rgba(96, 154, 187, 0.1);
}

/* Header */
.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e4f4fc;
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
  font-size: 1.2rem;
  font-weight: 700;
  color: #051b3a;
}

.subtitle {
  margin: 0;
  font-size: 0.85rem;
  color: #5d7a90;
}

/* Loading State */
.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #5d7a90;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e4f4fc;
  border-top-color: #609abb;
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

.loading-text {
  font-size: 0.95rem;
  margin: 0;
}

/* Error State */
.error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
}

.error-icon {
  font-size: 2.5rem;
  background: #fee2e2;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
}

.error-message {
  color: #5d7a90;
  font-size: 0.95rem;
  margin: 0;
  max-width: 300px;
}

.btn-retry {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(145deg, #609abb, #5d7a90);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.btn-retry:hover {
  background: linear-gradient(145deg, #5d7a90, #051b3a);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.3);
}

.btn-icon {
  font-size: 1.1rem;
}

/* Empty State */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
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

.empty-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #051b3a;
}

.empty-message {
  margin: 0;
  font-size: 0.9rem;
  color: #5d7a90;
}

/* Orders Grid */
.orders-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  padding-right: 0.5rem;
  align-content: start;
}

.orders-grid::-webkit-scrollbar {
  width: 6px;
}

.orders-grid::-webkit-scrollbar-track {
  background: #e4f4fc;
  border-radius: 3px;
}

.orders-grid::-webkit-scrollbar-thumb {
  background: #b4cbd8;
  border-radius: 3px;
}

.orders-grid::-webkit-scrollbar-thumb:hover {
  background: #609abb;
}

/* Order Card */
.order-card {
  background: #f8fafc;
  border: 2px solid #e4f4fc;
  border-radius: 16px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  height: fit-content;
  position: relative;
  overflow: hidden;
}

.order-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: #b4cbd8;
  transition: all 0.3s ease;
}

.order-card:hover {
  border-color: #609abb;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(96, 154, 187, 0.15);
}

.order-card:hover::before {
  background: #609abb;
}

.order-card.selected {
  border-color: #10b981;
  background: #f0fdf4;
}

.order-card.selected::before {
  background: #10b981;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px dashed #e4f4fc;
}

.order-number-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge-icon {
  font-size: 1rem;
}

.order-number {
  font-size: 0.95rem;
  font-weight: 700;
  color: #051b3a;
}

.order-total {
  font-size: 1.2rem;
  font-weight: 700;
  color: #10b981;
}

/* Order Info */
.order-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #5d7a90;
  flex-wrap: wrap;
}

.info-icon {
  font-size: 1rem;
  min-width: 20px;
}

.info-text {
  color: #051b3a;
}

.role-chip {
  margin-left: auto;
  padding: 0.2rem 0.6rem;
  background: #e4f4fc;
  color: #609abb;
  border-radius: 30px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: capitalize;
}

/* Order Summary */
.order-summary {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 0;
  border-top: 2px solid #e4f4fc;
  border-bottom: 2px solid #e4f4fc;
  margin-bottom: 0.75rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}

.summary-row.tax .summary-value {
  color: #f59e0b;
}

.summary-label {
  color: #5d7a90;
}

.summary-value {
  font-weight: 600;
  color: #051b3a;
}

/* Order Footer */
.order-footer {
  display: flex;
  justify-content: flex-end;
}

.items-count {
  font-size: 0.8rem;
  color: #b4cbd8;
  background: #e4f4fc;
  padding: 0.2rem 0.8rem;
  border-radius: 30px;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 2px solid #e4f4fc;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #e4f4fc;
  border: 2px solid #b4cbd8;
  border-radius: 30px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #609abb;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #609abb;
  border-color: #609abb;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn.prev .btn-icon {
  margin-right: 0.25rem;
}

.pagination-btn.next .btn-icon {
  margin-left: 0.25rem;
}

.page-info {
  font-size: 0.9rem;
  color: #5d7a90;
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .order-list-container {
    padding: 1rem;
  }

  .orders-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    flex-wrap: wrap;
  }

  .pagination-btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .header {
    flex-direction: column;
    text-align: center;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .order-total {
    align-self: flex-end;
  }

  .info-row {
    flex-wrap: wrap;
  }

  .role-chip {
    margin-left: 0;
  }
}

/* Optimizaciones táctiles */
@media (hover: none) and (pointer: coarse) {
  .order-card {
    cursor: default;
  }

  .pagination-btn {
    padding: 0.75rem 1rem;
  }
}
</style>
