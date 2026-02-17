<!-- src/components/TableCard.vue -->
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
      return {
        color: '#10b981',
        label: 'Disponible',
        bgColor: '#d1fae5',
        borderColor: '#10b981',
        icon: '✅',
      }
    case TableStatus.OCCUPIED:
      return {
        color: '#ef4444',
        label: 'Ocupada',
        bgColor: '#fee2e2',
        borderColor: '#ef4444',
        icon: '👥',
      }
    case TableStatus.RESERVED:
      return {
        color: '#f59e0b',
        label: 'Reservada',
        bgColor: '#fef3c7',
        borderColor: '#f59e0b',
        icon: '📅',
      }
    default:
      return {
        color: '#5d7a90',
        label: 'Desconocido',
        bgColor: '#e4f4fc',
        borderColor: '#5d7a90',
        icon: '❓',
      }
  }
})

const capacityIcon = computed(() => {
  if (props.table.capacity <= 2) return '🪑'
  if (props.table.capacity <= 4) return '🪑🪑'
  return '🪑🪑🪑'
})

const canTakeOrder = computed(() => {
  return props.table.status === TableStatus.AVAILABLE || props.table.status === TableStatus.OCCUPIED
})

const orderButtonText = computed(() => {
  return props.table.status === TableStatus.OCCUPIED ? 'Agregar a orden' : 'Tomar orden'
})
</script>

<template>
  <div class="table-card" :class="[`status-${table.status.toLowerCase()}`]">
    <!-- Barra de acento superior -->
    <div class="card-accent" :style="{ backgroundColor: statusConfig.borderColor }"></div>

    <div class="card-content">
      <!-- Header con número de mesa y badge -->
      <div class="table-header">
        <div class="title-section">
          <span class="table-icon">🍽️</span>
          <h3 class="table-name">Mesa {{ table.tableNumber }}</h3>
        </div>
        <span
          class="status-badge"
          :style="{
            backgroundColor: statusConfig.bgColor,
            color: statusConfig.color,
            borderColor: statusConfig.borderColor,
          }"
        >
          <span class="status-icon">{{ statusConfig.icon }}</span>
          {{ statusConfig.label }}
        </span>
      </div>

      <!-- Información de la mesa -->
      <div class="table-info">
        <div class="info-item">
          <span class="info-icon">{{ capacityIcon }}</span>
          <span class="info-text">
            <strong>Capacidad:</strong> {{ table.capacity }}
            {{ table.capacity === 1 ? 'persona' : 'personas' }}
          </span>
        </div>

        <!-- Información adicional si está ocupada -->
        <div v-if="table.status === TableStatus.OCCUPIED" class="order-info">
          <span class="order-dot"></span>
          <span class="order-text">Orden en curso</span>
        </div>

        <!-- Información adicional si está reservada -->
        <div v-if="table.status === TableStatus.RESERVED" class="reservation-info">
          <span class="reservation-icon">⏰</span>
          <span class="reservation-text">Reservada</span>
        </div>
      </div>

      <!-- Acciones de la mesa -->
      <div class="table-actions">
        <!-- Botón principal de orden -->
        <button
          v-if="canTakeOrder"
          @click="emit('takeOrder', table)"
          class="btn btn-take-order"
          :class="{ 'btn-continue-order': table.status === TableStatus.OCCUPIED }"
        >
          <span class="btn-icon">{{ table.status === TableStatus.OCCUPIED ? '➕' : '📝' }}</span>
          <span class="btn-text">{{ orderButtonText }}</span>
        </button>

        <!-- Grid de acciones secundarias -->
        <div class="action-grid">
          <!-- Acciones de cambio de estado -->
          <button
            v-if="table.status === TableStatus.AVAILABLE"
            @click="emit('changeStatus', table.id, TableStatus.OCCUPIED)"
            class="btn btn-status btn-occupy"
            title="Ocupar mesa"
          >
            <span class="btn-icon">👥</span>
            <span class="btn-text">Ocupar</span>
          </button>

          <button
            v-if="table.status === TableStatus.OCCUPIED"
            @click="emit('changeStatus', table.id, TableStatus.AVAILABLE)"
            class="btn btn-status btn-release"
            title="Liberar mesa"
          >
            <span class="btn-icon">✅</span>
            <span class="btn-text">Liberar</span>
          </button>

          <button
            v-if="table.status === TableStatus.AVAILABLE"
            @click="emit('changeStatus', table.id, TableStatus.RESERVED)"
            class="btn btn-status btn-reserve"
            title="Reservar mesa"
          >
            <span class="btn-icon">📅</span>
            <span class="btn-text">Reservar</span>
          </button>

          <!-- Acciones de gestión -->
          <button @click="emit('edit', table)" class="btn btn-edit" title="Editar mesa">
            <span class="btn-icon">✏️</span>
            <span class="btn-text">Editar</span>
          </button>

          <button @click="emit('delete', table.id)" class="btn btn-delete" title="Eliminar mesa">
            <span class="btn-icon">🗑️</span>
            <span class="btn-text">Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.08);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  border: 1px solid rgba(96, 154, 187, 0.1);
}

.table-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 25px rgba(5, 27, 58, 0.15);
}

/* Barra de acento superior */
.card-accent {
  height: 6px;
  width: 100%;
  transition: background-color 0.3s ease;
}

.card-content {
  padding: 1.5rem;
}

/* Header Styles */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.table-icon {
  font-size: 1.5rem;
  background: #e4f4fc;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-name {
  font-size: 1.3rem;
  font-weight: 700;
  color: #051b3a;
  margin: 0;
  letter-spacing: -0.3px;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 30px;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.status-icon {
  font-size: 1rem;
}

/* Info Section */
.table-info {
  background: #e4f4fc;
  border-radius: 16px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #051b3a;
}

.info-icon {
  font-size: 1.25rem;
}

.info-text {
  font-size: 0.95rem;
  color: #5d7a90;
}

.info-text strong {
  color: #051b3a;
  font-weight: 600;
}

/* Estado Ocupado */
.order-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 2px dashed rgba(96, 154, 187, 0.2);
}

.order-dot {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 1.5s ease infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.order-text {
  font-size: 0.9rem;
  color: #ef4444;
  font-weight: 500;
}

/* Estado Reservado */
.reservation-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 2px dashed rgba(96, 154, 187, 0.2);
}

.reservation-icon {
  font-size: 1rem;
}

.reservation-text {
  font-size: 0.9rem;
  color: #f59e0b;
  font-weight: 500;
}

/* Actions */
.table-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn {
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
}

.btn-icon {
  font-size: 1.1rem;
}

.btn-text {
  line-height: 1;
}

/* Botón principal de orden */
.btn-take-order {
  background: linear-gradient(145deg, #609abb, #5d7a90);
  color: white;
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.btn-take-order:hover {
  background: linear-gradient(145deg, #5d7a90, #051b3a);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.3);
}

.btn-take-order:active {
  transform: translateY(0);
}

.btn-continue-order {
  background: linear-gradient(145deg, #f59e0b, #d97706);
  box-shadow: 0 5px 15px rgba(245, 158, 11, 0.3);
}

.btn-continue-order:hover {
  background: linear-gradient(145deg, #d97706, #b45309);
}

/* Grid de acciones secundarias */
.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

/* Estilos base para botones secundarios */
.btn-status,
.btn-edit,
.btn-delete {
  background: #e4f4fc;
  color: #5d7a90;
  padding: 0.6rem 0.5rem;
  font-size: 0.85rem;
  border: 1px solid rgba(96, 154, 187, 0.2);
}

.btn-status:hover,
.btn-edit:hover,
.btn-delete:hover {
  transform: translateY(-2px);
  color: white;
}

/* Colores específicos para cada acción */
.btn-occupy:hover {
  background: #10b981;
  border-color: #10b981;
  box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
}

.btn-release:hover {
  background: #10b981;
  border-color: #10b981;
  box-shadow: 0 5px 15px rgba(16, 185, 129, 0.3);
}

.btn-reserve:hover {
  background: #f59e0b;
  border-color: #f59e0b;
  box-shadow: 0 5px 15px rgba(245, 158, 11, 0.3);
}

.btn-edit:hover {
  background: #609abb;
  border-color: #609abb;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.btn-delete:hover {
  background: #ef4444;
  border-color: #ef4444;
  box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
}

/* Estados específicos para las tarjetas */
.status-available .card-accent {
  background-color: #10b981;
}

.status-occupied .card-accent {
  background-color: #ef4444;
}

.status-reserved .card-accent {
  background-color: #f59e0b;
}

/* Tooltip para móviles */
@media (max-width: 768px) {
  .card-content {
    padding: 1.25rem;
  }

  .table-name {
    font-size: 1.2rem;
  }

  .status-badge {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .btn-text {
    display: none;
  }

  .btn {
    padding: 0.75rem;
  }

  .btn-icon {
    font-size: 1.2rem;
    margin: 0;
  }

  .btn:hover::after {
    content: attr(title);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #051b3a;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.75rem;
    white-space: nowrap;
    z-index: 10;
    margin-bottom: 5px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Animaciones */
.table-card {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
