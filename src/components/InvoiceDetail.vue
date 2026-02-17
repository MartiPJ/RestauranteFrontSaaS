<!-- src/components/InvoiceDetail.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useInvoiceStore } from '@/stores/invoiceStore'
import type { Order } from '@/types/order'

const props = defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  paid: [orderId: string]
  close: []
}>()

const invoiceStore = useInvoiceStore()
const isProcessing = ref(false)
const showConfirmModal = ref(false)

// Usar el invoice del store
const invoice = computed(() => invoiceStore.currentInvoice)

watch(
  () => props.order,
  async (newOrder) => {
    if (newOrder) {
      if (invoiceStore.selectedOrder?.id !== newOrder.id) {
        try {
          await invoiceStore.fetchOrderDetails(newOrder.id)
        } catch (error) {
          console.error('Error al cargar detalles:', error)
        }
      }
    }
  },
  { immediate: true },
)

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-GT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  }).format(num)
}

function openConfirmModal() {
  showConfirmModal.value = true
}

function closeConfirmModal() {
  showConfirmModal.value = false
}

async function confirmPayment() {
  if (!invoice.value) return

  isProcessing.value = true
  try {
    await invoiceStore.markOrderAsPaid(invoice.value.id)
    showConfirmModal.value = false
    emit('paid', invoice.value.id)
  } catch (error) {
    console.error('Error al procesar pago:', error)
  } finally {
    isProcessing.value = false
  }
}

function handleClose() {
  emit('close')
}

function printInvoice() {
  window.print()
}
</script>

<template>
  <div class="invoice-detail-container">
    <!-- Loading Overlay -->
    <div v-if="invoiceStore.loading" class="loading-overlay">
      <div class="spinner"></div>
      <p class="loading-text">Cargando detalles de factura...</p>
    </div>

    <div v-else-if="invoice" class="invoice-content">
      <!-- Header con acciones (no imprimible) -->
      <div class="invoice-header no-print">
        <div class="header-left">
          <button @click="handleClose" class="btn-icon back-btn" title="Volver">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="19" y1="12" x2="5" y2="12" stroke-width="2" />
              <polyline points="12 19 5 12 12 5" stroke-width="2" />
            </svg>
          </button>
          <h2>Detalles de Factura</h2>
        </div>
        <div class="action-buttons">
          <button @click="printInvoice" class="btn btn-secondary">
            <span class="btn-icon">🖨️</span>
            <span class="btn-text">Imprimir</span>
          </button>
          <button @click="openConfirmModal" class="btn btn-primary">
            <span class="btn-icon">💰</span>
            <span class="btn-text">Marcar como Pagada</span>
          </button>
        </div>
      </div>

      <!-- Documento de factura -->
      <div class="invoice-document">
        <!-- Encabezado del restaurante -->
        <div class="restaurant-header">
          <div class="restaurant-logo">
            <span class="logo-emoji">🍽️</span>
          </div>
          <h1>FACTURA</h1>
          <p class="invoice-number">#{{ invoice.orderNumber }}</p>
        </div>

        <!-- Información de la orden -->
        <div class="invoice-info-section">
          <div class="info-grid">
            <div class="info-block">
              <span class="info-label">📅 Fecha</span>
              <span class="info-value">{{ formatDate(invoice.orderDate) }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">👤 Mesero</span>
              <span class="info-value">{{ invoice.userName }}</span>
            </div>
            <div class="info-block" v-if="invoice.tableNumber">
              <span class="info-label">📍 Mesa</span>
              <span class="info-value location-badge">{{ invoice.tableNumber }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">🎭 Rol</span>
              <span class="info-value role-badge">{{ invoice.userRole }}</span>
            </div>
          </div>
        </div>

        <!-- Notas de la orden -->
        <div v-if="invoice.notes" class="notes-section">
          <div class="notes-header">
            <span class="notes-icon">📝</span>
            <span class="notes-label">Notas de la orden</span>
          </div>
          <p class="notes-text">{{ invoice.notes }}</p>
        </div>

        <!-- Tabla de productos -->
        <div class="products-section">
          <h3>Detalle de Productos</h3>
          <div class="table-container">
            <table class="products-table">
              <thead>
                <tr>
                  <th class="text-left">Producto</th>
                  <th class="text-center">Cant.</th>
                  <th class="text-right">Precio Unit.</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="product in invoice.products" :key="product.id">
                  <td class="text-left">
                    <div class="product-name">{{ product.name }}</div>
                    <div v-if="product.notes" class="product-notes">
                      <span class="note-icon">💬</span>
                      {{ product.notes }}
                    </div>
                  </td>
                  <td class="text-center quantity-cell">
                    <span class="quantity-badge">{{ product.quantity }}</span>
                  </td>
                  <td class="text-right">{{ formatCurrency(product.unitPrice) }}</td>
                  <td class="text-right price-cell">{{ formatCurrency(product.subtotal) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Totales -->
        <div class="totals-section">
          <div class="totals-card">
            <div class="total-row">
              <span class="total-label">Subtotal:</span>
              <span class="total-value">{{ formatCurrency(invoice.subtotal) }}</span>
            </div>
            <div class="total-row tax-row">
              <span class="total-label">Impuesto (IVA):</span>
              <span class="total-value">{{ formatCurrency(invoice.tax) }}</span>
            </div>
            <div class="total-row final-total">
              <span class="total-label">Total a Pagar:</span>
              <span class="total-amount">{{ formatCurrency(invoice.total) }}</span>
            </div>
          </div>
        </div>

        <!-- Pie de página -->
        <div class="invoice-footer">
          <p class="footer-thanks">¡Gracias por su preferencia!</p>
          <p class="footer-note">Este documento es válido como comprobante de pago</p>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación -->
    <div v-if="showConfirmModal" class="modal-overlay no-print" @click.self="closeConfirmModal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="header-icon">
            <span class="icon-emoji">💰</span>
          </div>
          <h3>Confirmar Pago</h3>
          <button @click="closeConfirmModal" class="close-btn" title="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" />
              <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="confirm-icon">✅</div>
          <p class="confirm-message">
            ¿Confirmar que la orden <strong>{{ invoice?.orderNumber }}</strong> ha sido pagada?
          </p>
          <div class="confirm-amount-card">
            <span class="amount-label">Monto total</span>
            <span class="amount-value">{{ formatCurrency(invoice?.total || 0) }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeConfirmModal" class="btn btn-cancel" :disabled="isProcessing">
            <span class="btn-icon">✕</span>
            Cancelar
          </button>
          <button @click="confirmPayment" class="btn btn-success" :disabled="isProcessing">
            <span class="btn-icon" v-if="!isProcessing">✅</span>
            <span class="spinner-small" v-else></span>
            <span>{{ isProcessing ? 'Procesando...' : 'Confirmar Pago' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.invoice-detail-container {
  height: 100%;
  background: white;
  border-radius: 20px;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  border: 1px solid rgba(96, 154, 187, 0.1);
}

/* Loading Overlay */
.loading-overlay {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: white;
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
  color: #5d7a90;
  font-size: 1rem;
  margin: 0;
}

/* Invoice Content */
.invoice-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Header */
.invoice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 2px solid #e4f4fc;
  background: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-icon {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: #e4f4fc;
  color: #609abb;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #609abb;
  color: white;
  transform: translateX(-3px);
}

.invoice-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: #051b3a;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
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

.btn-secondary {
  background: #e4f4fc;
  color: #5d7a90;
  border: 2px solid #b4cbd8;
}

.btn-secondary:hover {
  background: #b4cbd8;
  color: #051b3a;
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 1.1rem;
}

/* Invoice Document */
.invoice-document {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: white;
}

/* Restaurant Header */
.restaurant-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 3px solid #609abb;
}

.restaurant-logo {
  width: 64px;
  height: 64px;
  background: linear-gradient(145deg, #609abb, #e4f4fc);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
}

.logo-emoji {
  font-size: 2rem;
}

.restaurant-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 800;
  color: #051b3a;
  letter-spacing: 1px;
}

.invoice-number {
  margin: 0;
  font-size: 1.1rem;
  color: #609abb;
  font-weight: 600;
}

/* Info Section */
.invoice-info-section {
  margin-bottom: 1.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  background: #e4f4fc;
  padding: 1.25rem;
  border-radius: 16px;
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.7rem;
  color: #5d7a90;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.9rem;
  color: #051b3a;
  font-weight: 600;
}

.location-badge {
  display: inline-block;
  background: #609abb;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
  width: fit-content;
}

.role-badge {
  display: inline-block;
  background: #fef3c7;
  color: #f59e0b;
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
  width: fit-content;
}

/* Notes Section */
.notes-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #fff3cd;
  border-left: 4px solid #f59e0b;
  border-radius: 12px;
}

.notes-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.notes-icon {
  font-size: 1rem;
}

.notes-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #856404;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.notes-text {
  margin: 0;
  font-size: 0.9rem;
  color: #856404;
  line-height: 1.5;
}

/* Products Section */
.products-section {
  margin-bottom: 2rem;
}

.products-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #051b3a;
}

.table-container {
  border: 1px solid #e4f4fc;
  border-radius: 16px;
  overflow: hidden;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.products-table thead {
  background: #e4f4fc;
}

.products-table th {
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: #051b3a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.products-table td {
  padding: 1rem;
  font-size: 0.9rem;
  color: #5d7a90;
  border-bottom: 1px solid #e4f4fc;
}

.products-table tbody tr:last-child td {
  border-bottom: none;
}

.text-left {
  text-align: left;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.product-name {
  font-weight: 700;
  color: #051b3a;
  margin-bottom: 0.25rem;
}

.product-notes {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: #b4cbd8;
  font-style: italic;
}

.note-icon {
  font-size: 0.8rem;
}

.quantity-badge {
  display: inline-block;
  background: #609abb;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
  min-width: 40px;
}

.price-cell {
  font-weight: 700;
  color: #10b981;
}

/* Totals Section */
.totals-section {
  margin-bottom: 2rem;
}

.totals-card {
  max-width: 400px;
  margin-left: auto;
  background: #e4f4fc;
  border-radius: 16px;
  padding: 1.25rem;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(96, 154, 187, 0.2);
}

.total-row:last-child {
  border-bottom: none;
}

.total-label {
  font-size: 0.9rem;
  color: #5d7a90;
  font-weight: 500;
}

.total-value {
  font-size: 0.9rem;
  color: #051b3a;
  font-weight: 600;
}

.tax-row .total-value {
  color: #f59e0b;
}

.final-total {
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 2px solid #609abb;
}

.total-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #10b981;
}

/* Invoice Footer */
.invoice-footer {
  text-align: center;
  padding-top: 1.5rem;
  border-top: 2px dashed #b4cbd8;
}

.footer-thanks {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #051b3a;
}

.footer-note {
  margin: 0;
  font-size: 0.8rem;
  color: #b4cbd8;
  font-style: italic;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(5, 27, 58, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 24px;
  width: 90%;
  max-width: 450px;
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

.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-bottom: 2px solid #e4f4fc;
}

.header-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(145deg, #609abb, #e4f4fc);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-emoji {
  font-size: 1.2rem;
}

.modal-header h3 {
  flex: 1;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #051b3a;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: #e4f4fc;
  color: #609abb;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #609abb;
  color: white;
  transform: rotate(90deg);
}

.modal-body {
  padding: 2rem 1.5rem;
  text-align: center;
}

.confirm-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  background: #d1fae5;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.confirm-message {
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
  color: #5d7a90;
  line-height: 1.5;
}

.confirm-message strong {
  color: #051b3a;
}

.confirm-amount-card {
  background: #e4f4fc;
  padding: 1.25rem;
  border-radius: 16px;
  max-width: 300px;
  margin: 0 auto;
}

.amount-label {
  display: block;
  font-size: 0.8rem;
  color: #5d7a90;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.25rem;
}

.amount-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #10b981;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 2px solid #e4f4fc;
}

.btn-cancel,
.btn-success {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #e4f4fc;
  color: #5d7a90;
  border: 2px solid #b4cbd8;
}

.btn-cancel:hover:not(:disabled) {
  background: #b4cbd8;
  color: #051b3a;
  transform: translateY(-2px);
}

.btn-success {
  background: linear-gradient(145deg, #10b981, #059669);
  color: white;
  box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
}

.btn-success:hover:not(:disabled) {
  background: linear-gradient(145deg, #059669, #047857);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.btn-cancel:disabled,
.btn-success:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }

  .invoice-detail-container {
    box-shadow: none;
    border-radius: 0;
  }

  .invoice-document {
    padding: 0;
  }

  .products-table {
    border: 1px solid #000;
  }

  .products-table th,
  .products-table td {
    border: 1px solid #000;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .invoice-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .action-buttons {
    width: 100%;
  }

  .btn {
    flex: 1;
    justify-content: center;
  }

  .invoice-document {
    padding: 1rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .table-container {
    overflow-x: auto;
  }

  .products-table {
    min-width: 600px;
  }

  .totals-card {
    margin-left: 0;
    width: 100%;
  }

  .modal-footer {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .invoice-header h2 {
    font-size: 1.1rem;
  }

  .btn-text {
    display: none;
  }

  .btn-icon {
    margin-right: 0;
  }

  .restaurant-header h1 {
    font-size: 1.5rem;
  }

  .total-amount {
    font-size: 1.2rem;
  }

  .amount-value {
    font-size: 1.5rem;
  }
}
</style>
