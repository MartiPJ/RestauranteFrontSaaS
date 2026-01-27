// src/stores/orderStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { orderService } from '@/services/orderService'
import type {
  Order,
  CreateOrderDTO,
  UpdateOrderDTO,
  UpdateOrderStatusDTO,
  AddOrderItemsDTO,
  UpdateOrderItemDTO,
  OrderStatus,
} from '@/types/order'

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Paginación
  const currentPage = ref(1)
  const itemsPerPage = ref(20)
  const totalItems = ref(0)
  const totalPages = ref(0)

  // Computed
  const openOrders = computed(() => orders.value.filter((o) => o.status === 'open'))

  const closedOrders = computed(() => orders.value.filter((o) => o.status === 'closed'))

  const cancelledOrders = computed(() => orders.value.filter((o) => o.status === 'cancelled'))

  // Actions
  async function fetchOrders(params?: {
    page?: number
    limit?: number
    status?: string
    tableId?: string
  }) {
    loading.value = true
    error.value = null
    try {
      const response = await orderService.getAllOrders(params)
      orders.value = response.data
      currentPage.value = response.meta.currentPage
      itemsPerPage.value = response.meta.itemsPerPage
      totalItems.value = response.meta.totalItems
      totalPages.value = response.meta.totalPages
      return response
    } catch (e: any) {
      error.value = e.message || 'Error al cargar las órdenes'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchOrderById(id: string) {
    loading.value = true
    error.value = null
    try {
      const order = await orderService.getOrderById(id)
      currentOrder.value = order
      return order
    } catch (e: any) {
      error.value = e.message || 'Error al cargar la orden'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createOrder(data: CreateOrderDTO) {
    loading.value = true
    error.value = null
    try {
      const newOrder = await orderService.createOrder(data)
      orders.value.unshift(newOrder)
      currentOrder.value = newOrder
      return newOrder
    } catch (e: any) {
      error.value = e.message || 'Error al crear la orden'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateOrder(id: string, data: UpdateOrderDTO) {
    loading.value = true
    error.value = null
    try {
      const updatedOrder = await orderService.updateOrder(id, data)
      const index = orders.value.findIndex((o) => o.id === id)
      if (index !== -1) {
        orders.value[index] = updatedOrder
      }
      if (currentOrder.value?.id === id) {
        currentOrder.value = updatedOrder
      }
      return updatedOrder
    } catch (e: any) {
      error.value = e.message || 'Error al actualizar la orden'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateOrderStatus(id: string, status: OrderStatus) {
    loading.value = true
    error.value = null
    try {
      const updatedOrder = await orderService.updateOrderStatus(id, { status })
      const index = orders.value.findIndex((o) => o.id === id)
      if (index !== -1) {
        orders.value[index] = updatedOrder
      }
      if (currentOrder.value?.id === id) {
        currentOrder.value = updatedOrder
      }
      return updatedOrder
    } catch (e: any) {
      error.value = e.message || 'Error al actualizar estado de la orden'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addOrderItems(id: string, data: AddOrderItemsDTO) {
    loading.value = true
    error.value = null
    try {
      const updatedOrder = await orderService.addOrderItems(id, data)
      const index = orders.value.findIndex((o) => o.id === id)
      if (index !== -1) {
        orders.value[index] = updatedOrder
      }
      if (currentOrder.value?.id === id) {
        currentOrder.value = updatedOrder
      }
      return updatedOrder
    } catch (e: any) {
      error.value = e.message || 'Error al agregar items a la orden'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteOrder(id: string) {
    loading.value = true
    error.value = null
    try {
      await orderService.deleteOrder(id)
      orders.value = orders.value.filter((o) => o.id !== id)
      if (currentOrder.value?.id === id) {
        currentOrder.value = null
      }
    } catch (e: any) {
      error.value = e.message || 'Error al eliminar la orden'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateOrderItem(itemId: string, data: UpdateOrderItemDTO) {
    error.value = null
    try {
      await orderService.updateOrderItem(itemId, data)
      // Refrescar la orden actual para ver los cambios
      if (currentOrder.value) {
        await fetchOrderById(currentOrder.value.id)
      }
    } catch (e: any) {
      error.value = e.message || 'Error al actualizar item'
      throw e
    }
  }

  async function deleteOrderItem(itemId: string) {
    error.value = null
    try {
      await orderService.deleteOrderItem(itemId)
      // Refrescar la orden actual para ver los cambios
      if (currentOrder.value) {
        await fetchOrderById(currentOrder.value.id)
      }
    } catch (e: any) {
      error.value = e.message || 'Error al eliminar item'
      throw e
    }
  }

  function getOrderById(id: string) {
    return orders.value.find((o) => o.id === id)
  }

  function clearCurrentOrder() {
    currentOrder.value = null
  }

  return {
    orders,
    currentOrder,
    loading,
    error,
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    openOrders,
    closedOrders,
    cancelledOrders,
    fetchOrders,
    fetchOrderById,
    createOrder,
    updateOrder,
    updateOrderStatus,
    addOrderItems,
    deleteOrder,
    updateOrderItem,
    deleteOrderItem,
    getOrderById,
    clearCurrentOrder,
  }
})
