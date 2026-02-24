<!-- src/views/CashClosureView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { orderService } from '@/services/orderService'
import type { Order } from '@/types/order'

// ── State ──────────────────────────────────────────────────────────────────
const allPaidOrders = ref<Order[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const expandedOrderId = ref<string | null>(null)
const loadingDetail = ref<string | null>(null)
const orderDetails = ref<Record<string, Order>>({})

// Selected date defaults to today
const today = new Date()
const formatDateInput = (d: Date) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const selectedDate = ref(formatDateInput(today))

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function getOrderDateKey(order: Order): string | null {
  const dateValue = order.closedAt || order.updatedAt || order.createdAt
  const parsed = parseDate(dateValue)
  return parsed ? formatDateInput(parsed) : null
}

function toNumber(value: string | number | null | undefined): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

// ── Fetch all paid orders ──────────────────────────────────────────────────
async function fetchPaidOrders() {
  loading.value = true
  error.value = null
  try {
    // Fetch all paid orders with a high limit to get all results
    const response = await orderService.getAllOrders({ status: 'paid', limit: 200 })
    allPaidOrders.value = response.data
  } catch (e: any) {
    error.value = e.message || 'Error al cargar las órdenes'
  } finally {
    loading.value = false
  }
}

// ── Filter orders by selected date ────────────────────────────────────────
const ordersForSelectedDate = computed(() => {
  return allPaidOrders.value
    .filter((order) => {
      const orderDate = getOrderDateKey(order)
      return (
        order.status === 'paid' && // 🔥 seguridad extra
        orderDate !== null &&
        orderDate === selectedDate.value
      )
    })
    .sort((a, b) => {
      const dateA = parseDate(a.closedAt || a.updatedAt || a.createdAt)?.getTime() ?? 0
      const dateB = parseDate(b.closedAt || b.updatedAt || b.createdAt)?.getTime() ?? 0
      return dateB - dateA
    })
})

// ── Summary totals ─────────────────────────────────────────────────────────
const totalRevenue = computed(() =>
  ordersForSelectedDate.value.reduce((sum, o) => sum + toNumber(o.total), 0),
)
const totalSubtotal = computed(() =>
  ordersForSelectedDate.value.reduce((sum, o) => sum + toNumber(o.subtotal), 0),
)
const totalTax = computed(() =>
  ordersForSelectedDate.value.reduce((sum, o) => sum + toNumber(o.tax), 0),
)
const totalOrders = computed(() => ordersForSelectedDate.value.length)

// ── Available dates (dates that have paid orders) ──────────────────────────
const availableDates = computed(() => {
  const dates = new Set<string>()
  allPaidOrders.value.forEach((order) => {
    const dateKey = getOrderDateKey(order)
    if (dateKey) dates.add(dateKey)
  })
  return Array.from(dates).sort((a, b) => b.localeCompare(a))
})

// ── Formatted selected date label ─────────────────────────────────────────
const formattedSelectedDate = computed(() => {
  if (!selectedDate.value) return 'Fecha no seleccionada'
  const [year, month, day] = selectedDate.value.split('-').map(Number)
  if (!year || !month || !day) return 'Fecha inválida'
  return new Date(year, month - 1, day).toLocaleDateString('es-GT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

// ── Toggle order detail ────────────────────────────────────────────────────
async function toggleDetail(order: Order) {
  if (expandedOrderId.value === order.id) {
    expandedOrderId.value = null
    return
  }

  expandedOrderId.value = order.id

  // Load detail if not already loaded
  if (!orderDetails.value[order.id]) {
    loadingDetail.value = order.id
    try {
      const detail = await orderService.getOrderById(order.id)
      orderDetails.value[order.id] = detail
    } catch (e: any) {
      error.value = e.message || 'Error al cargar detalle de la orden'
    } finally {
      loadingDetail.value = null
    }
  }
}

function getOrderDetail(id: string): Order | null {
  return orderDetails.value[id] || null
}

// ── Format helpers ─────────────────────────────────────────────────────────
function formatTime(dateStr: string) {
  const parsed = parseDate(dateStr)
  if (!parsed) return '--:--'
  return parsed.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(value: string | number | null | undefined) {
  return `Q${toNumber(value).toFixed(2)}`
}

// ── Init ───────────────────────────────────────────────────────────────────
onMounted(fetchPaidOrders)
</script>

<template>
  <div class="cash-closure-view">
    <!-- ── Page Header ── -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon-wrap">
          <span class="header-icon">💰</span>
        </div>
        <div>
          <h1 class="page-title">Cierre de Caja</h1>
          <p class="page-subtitle">Resumen de ingresos por fecha</p>
        </div>
      </div>
      <button @click="fetchPaidOrders" class="btn-refresh" :disabled="loading">
        <span :class="['refresh-icon', { spinning: loading }]">↻</span>
        <span>Actualizar</span>
      </button>
    </div>

    <!-- ── Date Picker ── -->
    <div class="date-section">
      <div class="date-picker-card">
        <div class="date-picker-label">
          <span class="label-icon">📅</span>
          <span>Seleccionar fecha</span>
        </div>
        <input v-model="selectedDate" type="date" class="date-input" />
        <div class="date-display">{{ formattedSelectedDate }}</div>
      </div>

      <!-- Quick date nav -->
      <div class="quick-dates" v-if="availableDates.length > 0">
        <span class="quick-label">Fechas con ventas:</span>
        <div class="date-chips">
          <button
            v-for="date in availableDates.slice(0, 7)"
            :key="date"
            @click="selectedDate = date"
            :class="['date-chip', { active: selectedDate === date }]"
          >
            {{
              new Date(date + 'T12:00:00').toLocaleDateString('es-GT', {
                day: '2-digit',
                month: 'short',
              })
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── Loading / Error ── -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Cargando órdenes...</p>
    </div>

    <div v-else-if="error" class="error-banner">
      <span class="error-icon">⚠️</span>
      {{ error }}
    </div>

    <template v-else>
      <!-- ── Summary Cards ── -->
      <div class="summary-grid">
        <div class="summary-card total">
          <div class="summary-icon">💵</div>
          <div class="summary-info">
            <div class="summary-value">{{ formatCurrency(totalRevenue) }}</div>
            <div class="summary-label">Total del día</div>
          </div>
        </div>

        <div class="summary-card subtotal">
          <div class="summary-icon">🧾</div>
          <div class="summary-info">
            <div class="summary-value">{{ formatCurrency(totalSubtotal) }}</div>
            <div class="summary-label">Subtotal</div>
          </div>
        </div>

        <div class="summary-card tax">
          <div class="summary-icon">📊</div>
          <div class="summary-info">
            <div class="summary-value">{{ formatCurrency(totalTax) }}</div>
            <div class="summary-label">Impuestos</div>
          </div>
        </div>

        <div class="summary-card orders">
          <div class="summary-icon">📋</div>
          <div class="summary-info">
            <div class="summary-value">{{ totalOrders }}</div>
            <div class="summary-label">
              {{ totalOrders === 1 ? 'Orden pagada' : 'Órdenes pagadas' }}
            </div>
          </div>
        </div>
      </div>

      <!-- ── Empty State ── -->
      <div v-if="ordersForSelectedDate.length === 0" class="empty-state">
        <div class="empty-icon">🗓️</div>
        <h3>Sin ventas este día</h3>
        <p>No hay órdenes pagadas para el {{ formattedSelectedDate }}</p>
      </div>

      <!-- ── Orders List ── -->
      <div v-else class="orders-section">
        <div class="orders-section-header">
          <h2>Órdenes del día</h2>
          <span class="count-badge">{{ totalOrders }} órdenes</span>
        </div>

        <div class="orders-list">
          <div
            v-for="order in ordersForSelectedDate"
            :key="order.id"
            class="order-row"
            :class="{ expanded: expandedOrderId === order.id }"
          >
            <!-- ── Split Button Row ── -->
            <div class="order-summary-row">
              <!-- Left: order info -->
              <div class="order-main-info">
                <div class="order-number-badge">
                  <span class="paid-dot"></span>
                  <span class="order-number">{{ order.orderNumber }}</span>
                </div>
                <div class="order-meta">
                  <span class="meta-item">
                    <span class="meta-icon">{{ order.table ? '🪑' : '🥡' }}</span>
                    {{ order.table ? `Mesa ${order.table.tableNumber}` : 'Para llevar' }}
                  </span>
                  <span class="meta-sep">•</span>
                  <span class="meta-item">
                    <span class="meta-icon">🕐</span>
                    {{ formatTime(order.closedAt || order.updatedAt || order.createdAt) }}
                  </span>
                  <span v-if="order.notes" class="meta-sep">•</span>
                  <span v-if="order.notes" class="meta-item notes-meta">
                    <span class="meta-icon">📝</span>
                    {{ order.notes }}
                  </span>
                </div>
              </div>

              <!-- Right: total + expand button -->
              <div class="order-right">
                <div class="order-total-display">
                  {{ formatCurrency(order.total) }}
                </div>

                <button
                  @click="toggleDetail(order)"
                  class="btn-expand"
                  :class="{ active: expandedOrderId === order.id }"
                >
                  <span class="expand-icon" :class="{ rotated: expandedOrderId === order.id }"
                    >▾</span
                  >
                  <span class="expand-label">{{
                    expandedOrderId === order.id ? 'Ocultar' : 'Detalles'
                  }}</span>
                </button>
              </div>
            </div>

            <!-- ── Collapsible Detail Panel ── -->
            <Transition name="detail-slide">
              <div v-if="expandedOrderId === order.id" class="order-detail-panel">
                <!-- Loading detail -->
                <div v-if="loadingDetail === order.id" class="detail-loading">
                  <div class="mini-spinner"></div>
                  <span>Cargando detalle...</span>
                </div>

                <template v-else-if="getOrderDetail(order.id)">
                  <div class="detail-grid">
                    <!-- Info block -->
                    <div class="detail-info-block">
                      <div class="detail-info-row">
                        <span class="di-label">👤 Mesero</span>
                        <span class="di-value">{{ getOrderDetail(order.id)!.user.name }}</span>
                      </div>
                      <div class="detail-info-row" v-if="getOrderDetail(order.id)!.closedAt">
                        <span class="di-label">🔒 Cerrada</span>
                        <span class="di-value">{{
                          formatTime(getOrderDetail(order.id)!.closedAt!)
                        }}</span>
                      </div>
                      <div class="detail-info-row" v-if="getOrderDetail(order.id)!.notes">
                        <span class="di-label">📝 Notas</span>
                        <span class="di-value italic">{{ getOrderDetail(order.id)!.notes }}</span>
                      </div>
                    </div>

                    <!-- Products table -->
                    <div class="detail-products">
                      <div class="products-table-header">
                        <span>Producto</span>
                        <span>Cant.</span>
                        <span>Precio</span>
                        <span>Subtotal</span>
                      </div>
                      <div
                        v-for="item in getOrderDetail(order.id)!.orderProducts"
                        :key="item.id"
                        class="product-row"
                      >
                        <span class="product-name">{{ item.product.name }}</span>
                        <span class="product-qty">{{ item.quantity }}</span>
                        <span class="product-price">{{ formatCurrency(item.unitPrice) }}</span>
                        <span class="product-subtotal">{{ formatCurrency(item.subtotal) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Totals footer -->
                  <div class="detail-totals">
                    <div class="detail-total-row">
                      <span>Subtotal</span>
                      <span>{{ formatCurrency(getOrderDetail(order.id)!.subtotal) }}</span>
                    </div>
                    <div class="detail-total-row">
                      <span>Impuestos (12%)</span>
                      <span>{{ formatCurrency(getOrderDetail(order.id)!.tax) }}</span>
                    </div>
                    <div class="detail-total-row final">
                      <span>Total</span>
                      <span>{{ formatCurrency(getOrderDetail(order.id)!.total) }}</span>
                    </div>
                  </div>
                </template>

                <!-- Fallback if no detail loaded -->
                <template v-else>
                  <div class="detail-grid">
                    <div class="detail-info-block">
                      <div class="detail-info-row">
                        <span class="di-label">👤 Mesero</span>
                        <span class="di-value">{{ order.user.name }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="detail-totals">
                    <div class="detail-total-row">
                      <span>Subtotal</span>
                      <span>{{ formatCurrency(order.subtotal) }}</span>
                    </div>
                    <div class="detail-total-row">
                      <span>Impuestos</span>
                      <span>{{ formatCurrency(order.tax) }}</span>
                    </div>
                    <div class="detail-total-row final">
                      <span>Total</span>
                      <span>{{ formatCurrency(order.total) }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </Transition>
          </div>
        </div>

        <!-- ── Day Total Footer ── -->
        <div class="day-total-footer">
          <div class="day-total-label">
            <span class="day-total-icon">💰</span>
            <span>Total recaudado</span>
          </div>
          <div class="day-total-amount">{{ formatCurrency(totalRevenue) }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ── Base ─────────────────────────────────────────────────────────────────── */
.cash-closure-view {
  min-height: 100vh;
  background: #e4f4fc;
  padding: 2rem;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

/* ── Page Header ─────────────────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon-wrap {
  width: 56px;
  height: 56px;
  background: linear-gradient(145deg, #609abb, #e4f4fc);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(96, 154, 187, 0.3);
}

.header-icon {
  font-size: 1.8rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #051b3a;
  margin: 0;
  letter-spacing: -0.5px;
}

.page-subtitle {
  color: #5d7a90;
  font-size: 0.95rem;
  margin: 0.15rem 0 0;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  color: #609abb;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-refresh:hover:not(:disabled) {
  background: #609abb;
  color: white;
  border-color: #609abb;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(96, 154, 187, 0.3);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 1.1rem;
  display: inline-block;
}

.refresh-icon.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Date Section ─────────────────────────────────────────────────────────── */
.date-section {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  border: 1px solid rgba(96, 154, 187, 0.1);
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;
}

.date-picker-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 220px;
}

.date-picker-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #5d7a90;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.label-icon {
  font-size: 1rem;
}

.date-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  font-size: 1rem;
  color: #051b3a;
  background: #e4f4fc;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.date-input:focus {
  outline: none;
  border-color: #609abb;
  background: white;
  box-shadow: 0 0 0 4px rgba(96, 154, 187, 0.1);
}

.date-display {
  font-size: 0.85rem;
  color: #609abb;
  font-weight: 500;
  text-transform: capitalize;
}

.quick-dates {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quick-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #5d7a90;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.date-chip {
  padding: 0.4rem 0.9rem;
  background: #e4f4fc;
  border: 2px solid transparent;
  border-radius: 30px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #5d7a90;
  cursor: pointer;
  transition: all 0.3s ease;
}

.date-chip:hover {
  border-color: #609abb;
  color: #609abb;
  background: white;
  transform: translateY(-2px);
}

.date-chip.active {
  background: #609abb;
  color: white;
  border-color: #609abb;
}

/* ── Loading / Error ─────────────────────────────────────────────────────── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  background: white;
  border-radius: 20px;
  color: #5d7a90;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
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

.error-banner {
  background: #fee2e2;
  color: #ef4444;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-weight: 500;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 2px solid #fecaca;
}

.error-icon {
  font-size: 1.1rem;
}

/* ── Summary Cards ───────────────────────────────────────────────────────── */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.summary-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  transition: all 0.3s ease;
  border: 1px solid rgba(96, 154, 187, 0.1);
}

.summary-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(5, 27, 58, 0.1);
}

.summary-card.total {
  background: linear-gradient(145deg, #10b981, #059669);
  color: white;
}

.summary-card.total .summary-icon {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.summary-card.total .summary-value,
.summary-card.total .summary-label {
  color: white;
}

.summary-icon {
  width: 52px;
  height: 52px;
  background: #e4f4fc;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  color: #609abb;
}

.summary-info {
  flex: 1;
}

.summary-value {
  font-size: 1.7rem;
  font-weight: 700;
  color: #051b3a;
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.summary-label {
  font-size: 0.8rem;
  color: #5d7a90;
  font-weight: 600;
  margin-top: 0.2rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── Empty State ─────────────────────────────────────────────────────────── */
.empty-state {
  background: white;
  border-radius: 20px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  border: 1px solid rgba(96, 154, 187, 0.1);
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
  margin: 0 auto 1rem;
}

.empty-state h3 {
  font-size: 1.3rem;
  color: #051b3a;
  margin: 0 0 0.5rem;
}

.empty-state p {
  color: #5d7a90;
  margin: 0;
  text-transform: capitalize;
}

/* ── Orders Section ──────────────────────────────────────────────────────── */
.orders-section {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  border: 1px solid rgba(96, 154, 187, 0.1);
}

.orders-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 2px solid #e4f4fc;
}

.orders-section-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #051b3a;
  margin: 0;
}

.count-badge {
  background: #e4f4fc;
  color: #609abb;
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
}

.orders-list {
  display: flex;
  flex-direction: column;
}

/* ── Order Row ────────────────────────────────────────────── */
.order-row {
  border-bottom: 1px solid #e4f4fc;
  transition: background 0.2s ease;
}

.order-row:last-child {
  border-bottom: none;
}

.order-row.expanded {
  background: #f8fcff;
}

.order-summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  gap: 1rem;
  cursor: default;
}

.order-main-info {
  flex: 1;
  min-width: 0;
}

.order-number-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
}

.paid-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.order-number {
  font-size: 0.95rem;
  font-weight: 700;
  color: #051b3a;
}

.order-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.82rem;
  color: #5d7a90;
}

.meta-icon {
  font-size: 0.85rem;
}

.meta-sep {
  color: #b4cbd8;
  font-size: 0.75rem;
}

.notes-meta {
  font-style: italic;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Right side */
.order-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.order-total-display {
  font-size: 1.15rem;
  font-weight: 700;
  color: #10b981;
  letter-spacing: -0.3px;
}

.btn-expand {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: #e4f4fc;
  border: 2px solid transparent;
  border-radius: 30px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #609abb;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-expand:hover {
  background: #609abb;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.btn-expand.active {
  background: #051b3a;
  color: white;
  border-color: #051b3a;
}

.expand-icon {
  font-size: 1rem;
  display: inline-block;
  transition: transform 0.3s ease;
}

.expand-icon.rotated {
  transform: rotate(180deg);
}

/* ── Detail Panel ────────────────────────────────────────────────────────── */
.order-detail-panel {
  padding: 0 1.5rem 1.5rem;
  border-top: 2px dashed #e4f4fc;
}

.detail-loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  color: #5d7a90;
  font-size: 0.9rem;
}

.mini-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #e4f4fc;
  border-top-color: #609abb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

.detail-grid {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1rem;
  margin-top: 1rem;
}

/* Info block */
.detail-info-block {
  background: #e4f4fc;
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-self: start;
  border: 1px solid rgba(96, 154, 187, 0.2);
}

.detail-info-row {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.di-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #5d7a90;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.di-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #051b3a;
}

.di-value.italic {
  font-style: italic;
  font-weight: 400;
  color: #5d7a90;
}

/* Products table */
.detail-products {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid #e4f4fc;
}

.products-table-header {
  display: grid;
  grid-template-columns: 1fr 60px 90px 90px;
  padding: 0.65rem 1rem;
  background: #e4f4fc;
  font-size: 0.7rem;
  font-weight: 700;
  color: #5d7a90;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.product-row {
  display: grid;
  grid-template-columns: 1fr 60px 90px 90px;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid #e4f4fc;
  transition: background 0.15s ease;
  align-items: center;
}

.product-row:last-child {
  border-bottom: none;
}

.product-row:hover {
  background: #e4f4fc;
}

.product-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #051b3a;
}

.product-qty {
  font-size: 0.88rem;
  font-weight: 700;
  color: #609abb;
  text-align: center;
}

.product-price {
  font-size: 0.85rem;
  color: #5d7a90;
  text-align: right;
}

.product-subtotal {
  font-size: 0.88rem;
  font-weight: 600;
  color: #10b981;
  text-align: right;
}

/* Detail totals */
.detail-totals {
  margin-top: 1rem;
  background: linear-gradient(145deg, #609abb, #5d7a90);
  border-radius: 16px;
  padding: 1rem 1.25rem;
  color: white;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.detail-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.detail-total-row.final {
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  margin-top: 0.5rem;
  padding-top: 0.7rem;
  font-size: 1.05rem;
  font-weight: 700;
  opacity: 1;
}

/* ── Day Total Footer ────────────────────────────────────────────────────── */
.day-total-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(145deg, #10b981, #059669);
  color: white;
  border-top: 2px solid rgba(255, 255, 255, 0.2);
}

.day-total-label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1rem;
  font-weight: 600;
  opacity: 0.95;
}

.day-total-icon {
  font-size: 1.2rem;
}

.day-total-amount {
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

/* ── Transitions ─────────────────────────────────────────────────────────── */
.detail-slide-enter-active,
.detail-slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.detail-slide-enter-from,
.detail-slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.detail-slide-enter-to,
.detail-slide-leave-from {
  opacity: 1;
  max-height: 600px;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .cash-closure-view {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.6rem;
  }

  .date-section {
    flex-direction: column;
    gap: 1rem;
  }

  .date-picker-card {
    width: 100%;
  }

  .date-input {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: 1fr 1fr;
  }

  .order-summary-row {
    padding: 0.875rem 1rem;
    flex-wrap: wrap;
  }

  .order-right {
    width: 100%;
    justify-content: space-between;
  }

  .order-detail-panel {
    padding: 0 1rem 1rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .products-table-header,
  .product-row {
    grid-template-columns: 1fr 50px 80px 80px;
    font-size: 0.78rem;
    padding: 0.5rem 0.75rem;
  }

  .day-total-footer {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }

  .day-total-amount {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .expand-label {
    display: none;
  }

  .products-table-header,
  .product-row {
    grid-template-columns: 1fr 40px 70px;
  }

  .product-price {
    display: none;
  }

  .products-table-header span:nth-child(3) {
    display: none;
  }

  .order-meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .meta-sep {
    display: none;
  }
}
</style>
