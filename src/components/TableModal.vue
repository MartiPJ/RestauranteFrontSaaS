<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Table, CreateTableDTO } from '@/types/table'
import { TableStatus } from '@/types/table'

const props = defineProps<{
  show: boolean
  table?: Table | null
  isEdit: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [data: CreateTableDTO]
}>()

const formData = ref<CreateTableDTO>({
  tableNumber: '', // ← CAMBIA
  capacity: 2,
  status: TableStatus.AVAILABLE,
})

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (props.isEdit && props.table) {
        formData.value = {
          tableNumber: props.table.tableNumber, // ← CAMBIA
          capacity: props.table.capacity,
          status: props.table.status,
        }
      } else {
        formData.value = {
          tableNumber: '', // ← CAMBIA
          capacity: 2,
          status: TableStatus.AVAILABLE,
        }
      }
    }
  },
)

const handleSubmit = () => {
  // Cambia la validación
  if (!formData.value.tableNumber || formData.value.capacity < 1) {
    alert('Por favor completa todos los campos correctamente')
    return
  }
  emit('submit', formData.value)
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-container">
        <div class="modal-header">
          <h2>{{ isEdit ? 'Editar Mesa' : 'Nueva Mesa' }}</h2>
          <button @click="emit('close')" class="close-btn">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label for="tableNumber">Número de Mesa</label> <!-- Cambia -->
            <input id="tableNumber" v-model="formData.tableNumber" type="text" placeholder="Ej: A-101, B-202..." <!--
              Cambia -->
            required
            />
          </div>

          <div class="form-group">
            <label for="capacity">Capacidad</label>
            <input
              id="capacity"
              v-model.number="formData.capacity"
              type="number"
              min="1"
              max="20"
              placeholder="Número de personas"
              required
            />
          </div>

          <div class="form-group">
            <label for="status">Estado</label>
            <select id="status" v-model="formData.status">
              <option :value="TableStatus.AVAILABLE">Disponible</option>
              <option :value="TableStatus.OCCUPIED">Ocupada</option>
              <option :value="TableStatus.RESERVED">Reservada</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" @click="emit('close')" class="btn btn-cancel">Cancelar</button>
            <button type="submit" class="btn btn-primary">
              {{ isEdit ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #1f2937;
}

.icon {
  width: 24px;
  height: 24px;
}

.modal-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn {
  flex: 1;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background-color: #e5e7eb;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}
</style>
