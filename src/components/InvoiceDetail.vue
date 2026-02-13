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

// Usar el invoice del store en lugar de computarlo localmente
const invoice = computed(() => invoiceStore.currentInvoice)

// NO cargar detalles automáticamente - dejar que el store maneje esto
// O mejor, verificar si la orden ya está cargada
watch(
  () => props.order,
  async (newOrder) => {
    if (newOrder) {
      // Solo cargar si no es la misma orden ya seleccionada en el store
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
    <div v-if="invoiceStore.loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Cargando detalles...</p>
    </div>

    <div v-else-if="invoice" class="invoice-content">
      <!-- Header con acciones -->
      <div class="invoice-header no-print">
        <button @click="handleClose" class="close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" />
            <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" />
          </svg>
        </button>
        <h2>Detalles de Factura</h2>
        <div class="action-buttons">
          <button @click="printInvoice" class="print-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="6 9 6 2 18 2 18 9" stroke-width="2" />
              <path
                d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"
                stroke-width="2"
              />
              <rect x="6" y="14" width="12" height="8" stroke-width="2" />
            </svg>
            Imprimir
          </button>
          <button @click="openConfirmModal" class="pay-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke-width="2" />
              <line x1="1" y1="10" x2="23" y2="10" stroke-width="2" />
            </svg>
            Marcar como Pagada
          </button>
        </div>
      </div>

      <!-- Documento de factura -->
      <div class="invoice-document">
        <!-- Encabezado del restaurante -->
        <div class="restaurant-header">
          <h1>FACTURA</h1>
          <p class="invoice-number">{{ invoice.orderNumber }}</p>
        </div>

        <!-- Información de la orden -->
        <div class="invoice-info-section">
          <div class="info-grid">
            <div class="info-block">
              <span class="info-label">Fecha de Emisión:</span>
              <span class="info-value">{{ formatDate(invoice.orderDate) }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">Atendido por:</span>
              <span class="info-value">{{ invoice.userName }}</span>
            </div>
            <div class="info-block" v-if="invoice.tableNumber">
              <span class="info-label">Mesa:</span>
              <span class="info-value">{{ invoice.tableNumber }}</span>
            </div>
            <div class="info-block">
              <span class="info-label">Rol:</span>
              <span class="info-value role-tag">{{ invoice.userRole }}</span>
            </div>
          </div>
        </div>

        <!-- Notas de la orden -->
        <div v-if="invoice.notes" class="notes-section">
          <span class="notes-label">Notas:</span>
          <p class="notes-text">{{ invoice.notes }}</p>
        </div>

        <!-- Tabla de productos -->
        <div class="products-section">
          <h3>Detalle de Productos</h3>
          <table class="products-table">
            <thead>
              <tr>
                <th class="text-left">Producto</th>
                <th class="text-center">Cantidad</th>
                <th class="text-right">Precio Unit.</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in invoice.products" :key="product.id">
                <td class="text-left">
                  <div class="product-name">{{ product.name }}</div>
                  <div v-if="product.notes" class="product-notes">Nota: {{ product.notes }}</div>
                </td>
                <td class="text-center">{{ product.quantity }}</td>
                <td class="text-right">{{ formatCurrency(product.unitPrice) }}</td>
                <td class="text-right">{{ formatCurrency(product.subtotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totales -->
        <div class="totals-section">
          <div class="totals-grid">
            <div class="total-row">
              <span class="total-label">Subtotal:</span>
              <span class="total-value">{{ formatCurrency(invoice.subtotal) }}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Impuesto (IVA):</span>
              <span class="total-value">{{ formatCurrency(invoice.tax) }}</span>
            </div>
            <div class="total-row final-total">
              <span class="total-label">Total a Pagar:</span>
              <span class="total-value">{{ formatCurrency(invoice.total) }}</span>
            </div>
          </div>
        </div>

        <!-- Pie de página -->
        <div class="invoice-footer">
          <p>Gracias por su preferencia</p>
          <p class="footer-note">Este documento es válido como comprobante de pago</p>
        </div>
      </div>
    </div>

    <!-- Modal de confirmación -->
    <div v-if="showConfirmModal" class="modal-overlay no-print" @click.self="closeConfirmModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Confirmar Pago</h3>
          <button @click="closeConfirmModal" class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" />
              <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            class="confirm-icon"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-width="2" />
            <polyline points="22 4 12 14.01 9 11.01" stroke-width="2" />
          </svg>
          <p>
            ¿Confirmar que la orden <strong>{{ invoice?.orderNumber }}</strong> ha sido pagada?
          </p>
          <p class="confirm-amount">Monto: {{ formatCurrency(invoice?.total || 0) }}</p>
        </div>
        <div class="modal-footer">
          <button @click="closeConfirmModal" class="cancel-btn" :disabled="isProcessing">
            Cancelar
          </button>
          <button @click="confirmPayment" class="confirm-btn" :disabled="isProcessing">
            <span v-if="!isProcessing">Confirmar Pago</span>
            <span v-else>Procesando...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.invoice-detail-container {
  height: 100%;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.loading-overlay {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
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

.invoice-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.invoice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.invoice-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.close-btn {
  padding: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
}

.close-btn svg {
  display: block;
  stroke: #666;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.print-btn,
.pay-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.print-btn {
  background: #ffffff;
  color: #666;
  border: 1px solid #e0e0e0;
}

.print-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.pay-btn {
  background: #4caf50;
  color: white;
}

.pay-btn:hover {
  background: #45a049;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.invoice-document {
  flex: 1;
  overflow-y: auto;
  padding: 32px 48px;
  background: white;
}

.restaurant-header {
  text-align: center;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #4caf50;
}

.restaurant-header h1 {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
}

.invoice-number {
  margin: 0;
  font-size: 18px;
  color: #4caf50;
  font-weight: 600;
}

.invoice-info-section {
  margin-bottom: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #777;
  font-weight: 600;
  text-transform: uppercase;
}

.info-value {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 500;
}

.role-tag {
  display: inline-block;
  padding: 4px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
  width: fit-content;
}

.notes-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #fff9e6;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
}

.notes-label {
  font-size: 12px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
}

.notes-text {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.products-section {
  margin-bottom: 32px;
}

.products-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.products-table thead {
  background: #f5f5f5;
}

.products-table th {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 700;
  color: #555;
  text-transform: uppercase;
  border-bottom: 2px solid #e0e0e0;
}

.products-table td {
  padding: 16px;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
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
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.product-notes {
  font-size: 12px;
  color: #777;
  font-style: italic;
}

.totals-section {
  margin-bottom: 32px;
}

.totals-grid {
  max-width: 400px;
  margin-left: auto;
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
}

.total-row:last-child {
  border-bottom: none;
}

.total-label {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.total-value {
  font-size: 14px;
  color: #1a1a1a;
  font-weight: 600;
}

.final-total {
  margin-top: 8px;
  padding-top: 16px;
  border-top: 2px solid #4caf50;
}

.final-total .total-label {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
}

.final-total .total-value {
  font-size: 24px;
  font-weight: 700;
  color: #4caf50;
}

.invoice-footer {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
}

.invoice-footer p {
  margin: 8px 0;
  font-size: 14px;
  color: #555;
}

.footer-note {
  font-size: 12px;
  color: #999;
  font-style: italic;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.modal-close {
  padding: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.modal-close:hover {
  background: #f0f0f0;
}

.modal-body {
  padding: 32px 24px;
  text-align: center;
}

.confirm-icon {
  margin: 0 auto 16px;
  stroke: #4caf50;
}

.modal-body p {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
  line-height: 1.5;
}

.confirm-amount {
  font-size: 24px;
  font-weight: 700;
  color: #4caf50;
  margin-top: 16px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.confirm-btn {
  background: #4caf50;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background: #45a049;
}

.cancel-btn:disabled,
.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
</style>
