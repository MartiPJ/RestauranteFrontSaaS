// src/stores/tableStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { tableService } from '@/services/tableService'
import type { Table, CreateTableDTO, UpdateTableDTO } from '@/types/table'
import { TableStatus } from '@/types/table'

export const useTableStore = defineStore('table', () => {
  const tables = ref<Table[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const availableTables = computed(() =>
    tables.value.filter((t) => t.status === TableStatus.AVAILABLE),
  )

  const occupiedTables = computed(() =>
    tables.value.filter((t) => t.status === TableStatus.OCCUPIED),
  )

  const reservedTables = computed(() =>
    tables.value.filter((t) => t.status === TableStatus.RESERVED),
  )

  const totalCapacity = computed(() => tables.value.reduce((sum, table) => sum + table.capacity, 0))

  // Actions
  async function fetchTables() {
    loading.value = true
    error.value = null
    try {
      tables.value = await tableService.getAllTables()
    } catch (e: any) {
      error.value = e.message || 'Error al cargar las mesas'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createTable(data: CreateTableDTO) {
    loading.value = true
    error.value = null
    try {
      const newTable = await tableService.createTable(data)
      tables.value.push(newTable)
      return newTable
    } catch (e: any) {
      error.value = e.message || 'Error al crear la mesa'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateTable(id: string, data: UpdateTableDTO) {
    loading.value = true
    error.value = null
    try {
      const updatedTable = await tableService.updateTable(id, data)
      const index = tables.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        tables.value[index] = updatedTable
      }
      return updatedTable
    } catch (e: any) {
      error.value = e.message || 'Error al actualizar la mesa'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteTable(id: string) {
    loading.value = true
    error.value = null
    try {
      await tableService.deleteTable(id)
      tables.value = tables.value.filter((t) => t.id !== id)
    } catch (e: any) {
      error.value = e.message || 'Error al eliminar la mesa'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateTableStatus(id: string, status: TableStatus) {
    try {
      // Usa updateTable en lugar de updateTableStatus
      const updatedTable = await tableService.updateTable(id, { status })
      const index = tables.value.findIndex((t) => t.id === id)
      if (index !== -1) {
        tables.value[index] = updatedTable
      }
      return updatedTable
    } catch (e: any) {
      error.value = e.message || 'Error al actualizar estado'
      throw e
    }
  }

  function getTableById(id: string) {
    return tables.value.find((t) => t.id === id)
  }

  return {
    tables,
    loading,
    error,
    availableTables,
    occupiedTables,
    reservedTables,
    totalCapacity,
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    updateTableStatus,
    getTableById,
  }
})
