// src/services/orderService.ts
import api from '@/utils/api'
import type {
  Order,
  CreateOrderDTO,
  UpdateOrderDTO,
  UpdateOrderStatusDTO,
  AddOrderItemsDTO,
  UpdateOrderItemDTO,
  PaginatedResponse,
} from '@/types/order'

export const orderService = {
  // Obtener todas las órdenes con paginación
  async getAllOrders(params?: {
    page?: number
    limit?: number
    status?: string
    tableId?: string
  }): Promise<PaginatedResponse<Order>> {
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.status) queryParams.append('status', params.status)
      if (params?.tableId) queryParams.append('tableId', params.tableId)

      const endpoint = `/api/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
      return await api.get<PaginatedResponse<Order>>(endpoint)
    } catch (error) {
      console.error('Error al obtener órdenes:', error)
      throw error
    }
  },

  // Obtener una orden por ID con sus items
  async getOrderById(id: string): Promise<Order> {
    try {
      return await api.get<Order>(`/api/orders/${id}`)
    } catch (error) {
      console.error('Error al obtener orden:', error)
      throw error
    }
  },

  // Crear una nueva orden
  async createOrder(data: CreateOrderDTO): Promise<Order> {
    try {
      return await api.post<Order>('/api/orders', data)
    } catch (error) {
      console.error('Error al crear orden:', error)
      throw error
    }
  },

  // Actualizar notas de una orden
  async updateOrder(id: string, data: UpdateOrderDTO): Promise<Order> {
    try {
      return await api.patch<Order>(`/api/orders/${id}`, data)
    } catch (error) {
      console.error('Error al actualizar orden:', error)
      throw error
    }
  },

  // Actualizar estado de una orden
  async updateOrderStatus(id: string, data: UpdateOrderStatusDTO): Promise<Order> {
    try {
      return await api.patch<Order>(`/api/orders/${id}/status`, data)
    } catch (error) {
      console.error('Error al actualizar estado de orden:', error)
      throw error
    }
  },

  // Agregar items a una orden existente
  async addOrderItems(id: string, data: AddOrderItemsDTO): Promise<Order> {
    try {
      return await api.post<Order>(`/api/orders/${id}/items`, data)
    } catch (error) {
      console.error('Error al agregar items a orden:', error)
      throw error
    }
  },

  // Eliminar una orden
  async deleteOrder(id: string): Promise<void> {
    try {
      await api.delete(`/api/orders/${id}`)
    } catch (error) {
      console.error('Error al eliminar orden:', error)
      throw error
    }
  },

  // Actualizar un item de orden (cantidad, notas o estado)
  async updateOrderItem(itemId: string, data: UpdateOrderItemDTO): Promise<void> {
    try {
      await api.patch(`/api/order-products/${itemId}`, data)
    } catch (error) {
      console.error('Error al actualizar item de orden:', error)
      throw error
    }
  },

  // Eliminar un item de orden
  async deleteOrderItem(itemId: string): Promise<void> {
    try {
      await api.delete(`/api/order-items/${itemId}`)
    } catch (error) {
      console.error('Error al eliminar item de orden:', error)
      throw error
    }
  },
}
