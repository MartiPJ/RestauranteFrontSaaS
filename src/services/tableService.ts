// src/services/tableService.ts
import api from '@/utils/api'
import type { Table, CreateTableDTO, UpdateTableDTO, PaginatedResponse } from '@/types/table'

export const tableService = {
  // Obtener todas las mesas
  async getAllTables(): Promise<Table[]> {
    try {
      const response = await api.get<PaginatedResponse<Table>>('/api/tables')
      // El backend devuelve { data: [...], meta: {...}, links: {...} }
      return response.data || []
    } catch (error) {
      console.error('Error al obtener mesas:', error)
      throw error
    }
  },

  // Obtener una mesa por ID
  async getTableById(id: string): Promise<Table> {
    try {
      return await api.get<Table>(`/api/tables/${id}`)
    } catch (error) {
      console.error('Error al obtener mesa:', error)
      throw error
    }
  },

  // Crear una nueva mesa
  async createTable(data: CreateTableDTO): Promise<Table> {
    try {
      // El backend espera tableNumber, no name
      const payload = {
        tableNumber: data.tableNumber,
        capacity: data.capacity,
        status: data.status || 'available',
      }
      return await api.post<Table>('/api/tables', payload)
    } catch (error) {
      console.error('Error al crear mesa:', error)
      throw error
    }
  },

  // Actualizar una mesa
  async updateTable(id: string, data: UpdateTableDTO): Promise<Table> {
    try {
      const payload: any = {}
      if (data.tableNumber) payload.tableNumber = data.tableNumber
      if (data.capacity) payload.capacity = data.capacity
      if (data.status) payload.status = data.status

      return await api.patch<Table>(`/api/tables/${id}`, payload)
    } catch (error) {
      console.error('Error al actualizar mesa:', error)
      throw error
    }
  },

  // Eliminar una mesa
  async deleteTable(id: string): Promise<void> {
    try {
      await api.delete(`/api/tables/${id}`)
    } catch (error) {
      console.error('Error al eliminar mesa:', error)
      throw error
    }
  },
}
