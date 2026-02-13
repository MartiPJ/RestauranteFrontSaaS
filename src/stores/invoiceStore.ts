import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { orderService } from '@/services/orderService'
import type { Order } from '@/types/order'
import { OrderStatus } from '@/types/order'
import type { Invoice } from '@/types/invoice'

export const useInvoiceStore = defineStore('invoice', () => {
  const deliveredOrders = ref<Order[]>([])
  const selectedOrder = ref<Order | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Paginación
  const currentPage = ref(1)
  const itemsPerPage = ref(20)
  const totalItems = ref(0)
  const totalPages = ref(0)

  // Computed: Convertir orden a factura SOLO si la orden existe y está entregada
  const currentInvoice = computed((): Invoice | null => {
    if (!selectedOrder.value) return null

    // ✅ NO permitir facturar órdenes ya pagadas
    if (selectedOrder.value.status === OrderStatus.PAID) {
      return null
    }

    return {
      id: selectedOrder.value.id,
      orderNumber: selectedOrder.value.orderNumber,
      orderDate: selectedOrder.value.createdAt,
      subtotal: selectedOrder.value.subtotal,
      tax: selectedOrder.value.tax,
      total: selectedOrder.value.total,
      notes: selectedOrder.value.notes,
      userName: selectedOrder.value.user?.name || 'N/A',
      userRole: selectedOrder.value.user?.roles?.[0] || 'N/A',
      tableNumber: selectedOrder.value.table?.tableNumber || null,
      products:
        selectedOrder.value.orderProducts?.map((op) => ({
          id: op.id,
          name: op.product.name,
          quantity: op.quantity,
          unitPrice: op.unitPrice,
          subtotal: op.subtotal,
          notes: op.notes,
        })) || [],
    }
  })

  // Actions
  async function fetchDeliveredOrders(params?: { page?: number; limit?: number }) {
    loading.value = true
    error.value = null
    try {
      const response = await orderService.getAllOrders({
        ...params,
        status: OrderStatus.DELIVERED, // Esto pide delivered al backend
      })

      // 🔥 FILTRO ADICIONAL: Asegurar que solo órdenes DELIVERED estén en la lista
      // Esto es un respaldo por si el backend no filtra correctamente
      const filteredOrders = response.data.filter((order) => order.status === OrderStatus.DELIVERED)

      console.log(
        `Backend devolvió ${response.data.length} órdenes, filtradas a ${filteredOrders.length} entregadas`,
      )

      deliveredOrders.value = filteredOrders
      currentPage.value = response.meta.currentPage
      itemsPerPage.value = response.meta.itemsPerPage
      totalItems.value = filteredOrders.length // ✅ Ajustar total items
      totalPages.value = Math.ceil(filteredOrders.length / itemsPerPage.value) // ✅ Recalcular páginas

      return response
    } catch (e: any) {
      error.value = e.message || 'Error al cargar órdenes entregadas'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchOrderDetails(orderId: string) {
    // ✅ Si ya tenemos la orden seleccionada y está pagada, no recargar
    if (selectedOrder.value?.id === orderId && selectedOrder.value.status === OrderStatus.PAID) {
      console.log('La orden ya está pagada, no se puede facturar')
      return null
    }

    loading.value = true
    error.value = null
    try {
      const order = await orderService.getOrderById(orderId)

      // ✅ Si la orden ya está pagada, no seleccionarla
      if (order.status === OrderStatus.PAID) {
        console.warn('Intento de seleccionar orden pagada')
        selectedOrder.value = null
        return null
      }

      selectedOrder.value = order
      return order
    } catch (e: any) {
      error.value = e.message || 'Error al cargar detalles de la orden'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function markOrderAsPaid(orderId: string) {
    loading.value = true
    error.value = null
    try {
      await orderService.updateOrderStatus(orderId, { status: OrderStatus.PAID })

      // Remover la orden de la lista de entregadas
      deliveredOrders.value = deliveredOrders.value.filter((o) => o.id !== orderId)

      // ✅ IMPORTANTE: Si la orden que se pagó es la seleccionada, limpiar selección
      if (selectedOrder.value?.id === orderId) {
        selectedOrder.value = null
      }

      return true
    } catch (e: any) {
      error.value = e.message || 'Error al marcar orden como pagada'
      throw e
    } finally {
      loading.value = false
    }
  }

  function selectOrder(order: Order) {
    // ✅ No seleccionar si la orden ya está pagada
    if (order.status === OrderStatus.PAID) {
      console.warn('No se puede seleccionar una orden pagada')
      return
    }
    selectedOrder.value = order
  }

  function clearSelection() {
    selectedOrder.value = null
  }

  return {
    deliveredOrders,
    selectedOrder,
    currentInvoice,
    loading,
    error,
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    fetchDeliveredOrders,
    fetchOrderDetails,
    markOrderAsPaid,
    selectOrder,
    clearSelection,
  }
})
