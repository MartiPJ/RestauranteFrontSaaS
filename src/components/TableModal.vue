<!-- src/components/TableModal.vue -->
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
  tableNumber: '',
  capacity: 2,
  status: TableStatus.AVAILABLE,
})

const errors = ref<{ [key: string]: string }>({})

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      errors.value = {}
      if (props.isEdit && props.table) {
        formData.value = {
          tableNumber: props.table.tableNumber,
          capacity: props.table.capacity,
          status: props.table.status,
        }
      } else {
        formData.value = {
          tableNumber: '',
          capacity: 2,
          status: TableStatus.AVAILABLE,
        }
      }
    }
  },
)

const validateForm = (): boolean => {
  const newErrors: { [key: string]: string } = {}

  if (!formData.value.tableNumber.trim()) {
    newErrors.tableNumber = 'El número de mesa es requerido'
  } else if (formData.value.tableNumber.length > 10) {
    newErrors.tableNumber = 'El número de mesa no puede exceder 10 caracteres'
  }

  if (formData.value.capacity < 1) {
    newErrors.capacity = 'La capacidad debe ser al menos 1 persona'
  } else if (formData.value.capacity > 20) {
    newErrors.capacity = 'La capacidad no puede exceder 20 personas'
  }

  errors.value = newErrors
  return Object.keys(newErrors).length === 0
}

const handleSubmit = () => {
  if (validateForm()) {
    emit('submit', formData.value)
  }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-container">
        <!-- Header del modal -->
        <div class="modal-header">
          <div class="header-icon">
            <span class="icon-emoji">{{ isEdit ? '✏️' : '➕' }}</span>
          </div>
          <div class="header-text">
            <h2>{{ isEdit ? 'Editar Mesa' : 'Nueva Mesa' }}</h2>
            <p class="header-subtitle">
              {{ isEdit ? 'Modifica los datos de la mesa' : 'Ingresa los datos de la nueva mesa' }}
            </p>
          </div>
          <button @click="emit('close')" class="close-btn" title="Cerrar">
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

        <!-- Formulario -->
        <form @submit.prevent="handleSubmit" class="modal-form">
          <!-- Número de Mesa -->
          <div class="form-group" :class="{ 'has-error': errors.tableNumber }">
            <label for="tableNumber">
              <span class="label-icon">🔢</span>
              Número de Mesa
            </label>
            <input
              id="tableNumber"
              v-model="formData.tableNumber"
              type="text"
              placeholder="Ej: Mesa 1, A-101, Terraza 2..."
              :class="{ 'error-input': errors.tableNumber }"
            />
            <span v-if="errors.tableNumber" class="error-message">
              ⚠️ {{ errors.tableNumber }}
            </span>
            <span class="input-hint">Máximo 10 caracteres</span>
          </div>

          <!-- Capacidad -->
          <div class="form-group" :class="{ 'has-error': errors.capacity }">
            <label for="capacity">
              <span class="label-icon">🪑</span>
              Capacidad
            </label>
            <div class="capacity-input-group">
              <button
                type="button"
                class="capacity-btn minus"
                @click="formData.capacity = Math.max(1, formData.capacity - 1)"
                :disabled="formData.capacity <= 1"
              >
                −
              </button>
              <input
                id="capacity"
                v-model.number="formData.capacity"
                type="number"
                min="1"
                max="20"
                placeholder="Número de personas"
                class="capacity-input"
                :class="{ 'error-input': errors.capacity }"
              />
              <button
                type="button"
                class="capacity-btn plus"
                @click="formData.capacity = Math.min(20, formData.capacity + 1)"
                :disabled="formData.capacity >= 20"
              >
                +
              </button>
            </div>
            <span v-if="errors.capacity" class="error-message"> ⚠️ {{ errors.capacity }} </span>
            <span class="input-hint">Mínimo 1, máximo 20 personas</span>
          </div>

          <!-- Estado -->
          <div class="form-group">
            <label for="status">
              <span class="label-icon">📊</span>
              Estado Inicial
            </label>
            <div class="status-options">
              <button
                type="button"
                class="status-option"
                :class="{ active: formData.status === TableStatus.AVAILABLE }"
                @click="formData.status = TableStatus.AVAILABLE"
              >
                <span class="status-indicator available"></span>
                <span class="status-label">Disponible</span>
              </button>
              <button
                type="button"
                class="status-option"
                :class="{ active: formData.status === TableStatus.OCCUPIED }"
                @click="formData.status = TableStatus.OCCUPIED"
              >
                <span class="status-indicator occupied"></span>
                <span class="status-label">Ocupada</span>
              </button>
              <button
                type="button"
                class="status-option"
                :class="{ active: formData.status === TableStatus.RESERVED }"
                @click="formData.status = TableStatus.RESERVED"
              >
                <span class="status-indicator reserved"></span>
                <span class="status-label">Reservada</span>
              </button>
            </div>
          </div>

          <!-- Acciones -->
          <div class="modal-actions">
            <button type="button" @click="emit('close')" class="btn btn-cancel">
              <span class="btn-icon">✕</span>
              <span class="btn-text">Cancelar</span>
            </button>
            <button type="submit" class="btn btn-primary">
              <span class="btn-icon">{{ isEdit ? '✓' : '➕' }}</span>
              <span class="btn-text">{{ isEdit ? 'Actualizar' : 'Crear Mesa' }}</span>
            </button>
          </div>
        </form>

        <!-- Decoración inferior -->
        <div class="modal-footer-decoration"></div>
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
  background-color: rgba(5, 27, 58, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 25px 50px -12px rgba(5, 27, 58, 0.25);
  position: relative;
  overflow: hidden;
  animation: modalAppear 0.3s ease;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header Styles */
.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 2px solid #e4f4fc;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(145deg, #609abb, #e4f4fc);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-emoji {
  font-size: 1.5rem;
}

.header-text {
  flex: 1;
}

.header-text h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #051b3a;
  letter-spacing: -0.3px;
}

.header-subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: #5d7a90;
}

.close-btn {
  background: #e4f4fc;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #609abb;
  border-radius: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.close-btn:hover {
  background: #609abb;
  color: white;
  transform: rotate(90deg);
}

.icon {
  width: 20px;
  height: 20px;
}

/* Form Styles */
.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #051b3a;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.label-icon {
  font-size: 1.1rem;
}

.form-group input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #e4f4fc;
  color: #051b3a;
  box-sizing: border-box;
}

.form-group input::placeholder {
  color: #b4cbd8;
}

.form-group input:focus {
  outline: none;
  border-color: #609abb;
  background: white;
  box-shadow: 0 0 0 4px rgba(96, 154, 187, 0.1);
}

/* Error States */
.form-group.has-error input {
  border-color: #ef4444;
  background: #fee2e2;
}

.error-message {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #ef4444;
  font-weight: 500;
}

.input-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #b4cbd8;
  font-style: italic;
}

/* Capacity Input Group */
.capacity-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.capacity-input {
  flex: 1;
  text-align: center;
  -moz-appearance: textfield;
}

.capacity-input::-webkit-outer-spin-button,
.capacity-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.capacity-btn {
  width: 48px;
  height: 48px;
  border: 2px solid #e4f4fc;
  background: white;
  border-radius: 12px;
  font-size: 1.5rem;
  font-weight: 600;
  color: #609abb;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.capacity-btn:hover:not(:disabled) {
  background: #609abb;
  color: white;
  border-color: #609abb;
  transform: scale(1.05);
}

.capacity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Status Options */
.status-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.status-option {
  background: #e4f4fc;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 0.75rem 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.status-option:hover {
  transform: translateY(-2px);
  background: white;
  border-color: #609abb;
}

.status-option.active {
  background: white;
  border-color: #609abb;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.2);
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-indicator.available {
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.status-indicator.occupied {
  background: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.status-indicator.reserved {
  background: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}

.status-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #051b3a;
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-icon {
  font-size: 1.1rem;
}

.btn-text {
  line-height: 1;
}

.btn-cancel {
  background: #e4f4fc;
  color: #5d7a90;
  border: 2px solid #b4cbd8;
}

.btn-cancel:hover {
  background: #b4cbd8;
  color: #051b3a;
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(145deg, #609abb, #5d7a90);
  color: white;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(145deg, #5d7a90, #051b3a);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Footer Decoration */
.modal-footer-decoration {
  height: 4px;
  background: linear-gradient(90deg, #609abb, #b4cbd8, #e4f4fc);
  width: 100%;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(20px);
}

/* Responsive */
@media (max-width: 640px) {
  .modal-container {
    max-width: 100%;
  }

  .modal-header {
    padding: 1.25rem;
  }

  .header-icon {
    width: 40px;
    height: 40px;
  }

  .icon-emoji {
    font-size: 1.25rem;
  }

  .header-text h2 {
    font-size: 1.25rem;
  }

  .status-options {
    grid-template-columns: 1fr;
  }

  .status-option {
    flex-direction: row;
    justify-content: center;
  }

  .modal-actions {
    flex-direction: column;
  }

  .btn {
    padding: 0.875rem;
  }
}

/* Soporte para modo oscuro */
@media (prefers-color-scheme: dark) {
  .modal-container {
    background: #1a2634;
  }

  .header-text h2,
  .form-group label,
  .status-label {
    color: #e4f4fc;
  }

  .header-subtitle,
  .input-hint {
    color: #b4cbd8;
  }

  .form-group input {
    background: #2a3644;
    border-color: #2a3644;
    color: #e4f4fc;
  }

  .form-group input:focus {
    background: #1a2634;
  }

  .status-option {
    background: #2a3644;
  }

  .status-option.active {
    background: #1a2634;
  }

  .btn-cancel {
    background: #2a3644;
    color: #b4cbd8;
  }
}
</style>
