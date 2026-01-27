<script setup lang="ts">
import { computed } from 'vue'
import type { Table } from '@/types/table'
import { TableStatus } from '@/types/table'

const props = defineProps<{
  table: Table
}>()

const emit = defineEmits<{
  edit: [table: Table]
  delete: [id: string]
  changeStatus: [id: string, status: TableStatus]
  takeOrder: [table: Table]
}>()

const statusConfig = computed(() => {
  switch (props.table.status) {
    case TableStatus.AVAILABLE:
      return { color: '#10b981', label: 'Disponible', bgColor: '#d1fae5' }
    case TableStatus.OCCUPIED:
      return { color: '#ef4444', label: 'Ocupada', bgColor: '#fee2e2' }
    case TableStatus.RESERVED:
      return { color: '#f59e0b', label: 'Reservada', bgColor: '#fef3c7' }
    default:
      return { color: '#6b7280', label: 'Desconocido', bgColor: '#f3f4f6' }
  }
})
</script>

<template>
  <div class="table-card">
    <div class="table-header">
      <h3 class="table-name">Mesa {{ table.tableNumber }}</h3>
      <span
        class="status-badge"
        :style="{
          backgroundColor: statusConfig.bgColor,
          color: statusConfig.color,
        }"
      >
        {{ statusConfig.label }}
      </span>
    </div>

    <div class="table-info">
      <div class="info-item">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <span>Capacidad: {{ table.capacity }} personas</span>
      </div>
    </div>

    <div class="table-actions">
      <!-- Botón principal de tomar orden -->
      <button
        v-if="table.status === TableStatus.AVAILABLE"
        @click="emit('takeOrder', table)"
        class="btn btn-take-order"
      >
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
        Tomar Orden
      </button>

      <!-- Acciones de estado -->
      <button
        v-if="table.status === TableStatus.AVAILABLE"
        @click="emit('changeStatus', table.id, TableStatus.OCCUPIED)"
        class="btn btn-success"
      >
        Ocupar
      </button>
      <button
        v-if="table.status === TableStatus.OCCUPIED"
        @click="emit('changeStatus', table.id, TableStatus.AVAILABLE)"
        class="btn btn-success"
      >
        Liberar
      </button>
      <button
        v-if="table.status === TableStatus.AVAILABLE"
        @click="emit('changeStatus', table.id, TableStatus.RESERVED)"
        class="btn btn-warning"
      >
        Reservar
      </button>

      <!-- Acciones de gestión -->
      <button @click="emit('edit', table)" class="btn btn-secondary">Editar</button>
      <button @click="emit('delete', table.id)" class="btn btn-danger">Eliminar</button>
    </div>
  </div>
</template>

<style scoped>
.table-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.table-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-name {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.table-info {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.icon {
  width: 20px;
  height: 20px;
}

.table-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-take-order {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-basis: 100%;
  font-weight: 600;
  font-size: 15px;
  padding: 12px 16px;
}

.btn-take-order:hover {
  background: linear-gradient(135deg, #5568d3 0%, #653a8e 100%);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-success {
  background-color: #10b981;
  color: white;
}

.btn-success:hover {
  background-color: #059669;
}

.btn-warning {
  background-color: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background-color: #d97706;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover {
  background-color: #dc2626;
}
</style>
