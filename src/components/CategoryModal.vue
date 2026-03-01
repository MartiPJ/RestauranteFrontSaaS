<!-- src/components/CategoryModal.vue -->
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Category } from '@/types/category'

interface Props {
  show: boolean
  category?: Category | null
  mode: 'create' | 'edit'
  existingCategories?: Category[]
}

interface Emits {
  (e: 'close'): void
  (
    e: 'save',
    data: {
      name: string
      description: string
      displayOrder: number
      isActive: boolean
    },
  ): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = ref({
  name: '',
  description: '',
  displayOrder: 1,
  isActive: true,
})

const errors = ref({
  name: '',
  description: '',
  displayOrder: '',
})

const title = computed(() => (props.mode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'))
const modalIcon = computed(() => (props.mode === 'create' ? '➕' : '✏️'))

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (props.category && props.mode === 'edit') {
        form.value = {
          name: props.category.name,
          description: props.category.description,
          displayOrder: props.category.displayOrder,
          isActive: props.category.isActive,
        }
      } else {
        resetForm()
      }
      resetErrors()
    }
  },
)

function resetForm() {
  form.value = {
    name: '',
    description: '',
    displayOrder: 1,
    isActive: true,
  }
}

function resetErrors() {
  errors.value = {
    name: '',
    description: '',
    displayOrder: '',
  }
}

function validate(): boolean {
  resetErrors()
  let isValid = true

  if (!form.value.name.trim()) {
    errors.value.name = 'El nombre es requerido'
    isValid = false
  } else if (form.value.name.length > 50) {
    errors.value.name = 'El nombre no puede exceder los 50 caracteres'
    isValid = false
  }

  if (!form.value.description.trim()) {
    errors.value.description = 'La descripción es requerida'
    isValid = false
  } else if (form.value.description.length > 200) {
    errors.value.description = 'La descripción no puede exceder los 200 caracteres'
    isValid = false
  }

  if (form.value.displayOrder < 1) {
    errors.value.displayOrder = 'El orden debe ser mayor a 0'
    isValid = false
  } else if (form.value.displayOrder > 999) {
    errors.value.displayOrder = 'El orden no puede ser mayor a 999'
    isValid = false
  } else if (props.mode === 'edit') {
    // ← Validación de orden duplicado SOLO en modo edición
    const isDuplicate = (props.existingCategories ?? []).some((cat) => {
      // En edición, excluimos la categoría actual
      const isSelf = props.mode === 'edit' && props.category?.id === cat.id
      return !isSelf && cat.displayOrder === form.value.displayOrder
    })
    if (isDuplicate) {
      errors.value.displayOrder = `El orden #${form.value.displayOrder} ya está ocupado por otra categoría`
      isValid = false
    }
  }

  return isValid
}

function handleSave() {
  if (validate()) {
    emit('save', { ...form.value })
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-icon">
            <span class="icon-emoji">{{ modalIcon }}</span>
          </div>
          <div class="header-text">
            <h2>{{ title }}</h2>
            <p class="header-subtitle">
              {{
                mode === 'create'
                  ? 'Completa los datos de la nueva categoría'
                  : 'Modifica los datos de la categoría'
              }}
            </p>
          </div>
          <button @click="handleClose" class="close-btn" title="Cerrar">
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
        <form @submit.prevent="handleSave" class="modal-form">
          <!-- Nombre -->
          <div class="form-group" :class="{ 'has-error': errors.name }">
            <label for="name">
              <span class="label-icon">📝</span>
              Nombre *
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="Ej: Platos Principales, Bebidas, Postres..."
              :class="{ 'error-input': errors.name }"
            />
            <span v-if="errors.name" class="error-message"> ⚠️ {{ errors.name }} </span>
            <span class="input-hint">Máximo 50 caracteres</span>
          </div>

          <!-- Descripción -->
          <div class="form-group" :class="{ 'has-error': errors.description }">
            <label for="description">
              <span class="label-icon">📄</span>
              Descripción *
            </label>
            <textarea
              id="description"
              v-model="form.description"
              placeholder="Describe el contenido de esta categoría..."
              rows="3"
              :class="{ 'error-input': errors.description }"
            ></textarea>
            <span v-if="errors.description" class="error-message">
              ⚠️ {{ errors.description }}
            </span>
            <span class="input-hint">Máximo 200 caracteres</span>
          </div>

          <!-- Orden de visualización -->
          <div class="form-group" :class="{ 'has-error': errors.displayOrder }">
            <label for="displayOrder">
              <span class="label-icon">🔢</span>
              Orden de visualización *
            </label>
            <div class="order-input-group">
              <button
                type="button"
                class="order-btn minus"
                @click="form.displayOrder = Math.max(1, form.displayOrder - 1)"
                :disabled="form.displayOrder <= 1"
              >
                −
              </button>
              <input
                id="displayOrder"
                v-model.number="form.displayOrder"
                type="number"
                min="1"
                max="999"
                class="order-input"
                :class="{ 'error-input': errors.displayOrder }"
              />
              <button
                type="button"
                class="order-btn plus"
                @click="form.displayOrder = Math.min(999, form.displayOrder + 1)"
                :disabled="form.displayOrder >= 999"
              >
                +
              </button>
            </div>
            <span v-if="errors.displayOrder" class="error-message">
              ⚠️ {{ errors.displayOrder }}
            </span>
            <span class="input-hint">Número entre 1 y 999</span>
          </div>

          <!-- Estado Activo/Inactivo -->
          <div class="form-group toggle-group">
            <label class="toggle-label">
              <span class="label-icon">⚡</span>
              Estado de la categoría
            </label>
            <div class="toggle-options">
              <button
                type="button"
                class="toggle-option"
                :class="{ active: form.isActive }"
                @click="form.isActive = true"
              >
                <span class="toggle-indicator active"></span>
                <span class="toggle-text">Activa</span>
              </button>
              <button
                type="button"
                class="toggle-option"
                :class="{ active: !form.isActive }"
                @click="form.isActive = false"
              >
                <span class="toggle-indicator inactive"></span>
                <span class="toggle-text">Inactiva</span>
              </button>
            </div>
            <span class="input-hint"> Las categorías inactivas no se mostrarán en el menú </span>
          </div>

          <!-- Acciones -->
          <div class="modal-actions">
            <button type="button" @click="handleClose" class="btn btn-cancel">
              <span class="btn-icon">✕</span>
              <span class="btn-text">Cancelar</span>
            </button>
            <button type="submit" class="btn btn-primary">
              <span class="btn-icon">{{ mode === 'create' ? '➕' : '✓' }}</span>
              <span class="btn-text">{{
                mode === 'create' ? 'Crear Categoría' : 'Guardar Cambios'
              }}</span>
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
  overflow-y: auto;
  box-sizing: border-box;
}

.modal-container {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 520px;
  max-height: calc(100dvh - 2rem);
  box-shadow: 0 25px 50px -12px rgba(5, 27, 58, 0.25);
  position: relative;
  overflow: hidden;
  animation: modalAppear 0.3s ease;
  display: flex;
  flex-direction: column;
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
  overflow-y: auto;
  min-height: 0;
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

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #e4f4fc;
  color: #051b3a;
  box-sizing: border-box;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #b4cbd8;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #609abb;
  background: white;
  box-shadow: 0 0 0 4px rgba(96, 154, 187, 0.1);
}

/* Error States */
.form-group.has-error input,
.form-group.has-error textarea {
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

/* Order Input Group */
.order-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.order-input {
  flex: 1;
  text-align: center;
  appearance: textfield;
  -webkit-appearance: textfield;
  -moz-appearance: textfield;
}

.order-input::-webkit-outer-spin-button,
.order-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.order-btn {
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

.order-btn:hover:not(:disabled) {
  background: #609abb;
  color: white;
  border-color: #609abb;
  transform: scale(1.05);
}

.order-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Toggle Group */
.toggle-group {
  margin-bottom: 2rem;
}

.toggle-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.toggle-option {
  background: #e4f4fc;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.toggle-option:hover {
  transform: translateY(-2px);
  background: white;
  border-color: #609abb;
}

.toggle-option.active {
  background: white;
  border-color: #609abb;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.2);
}

.toggle-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.toggle-indicator.active {
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.toggle-indicator.inactive {
  background: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.toggle-text {
  font-size: 0.9rem;
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
  .modal-overlay {
    align-items: flex-start;
    padding: 0.75rem;
  }

  .modal-container {
    max-width: 100%;
    max-height: calc(100dvh - 1.5rem);
    border-radius: 18px;
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

  .toggle-options {
    grid-template-columns: 1fr;
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
  .toggle-text {
    color: #e4f4fc;
  }

  .header-subtitle,
  .input-hint {
    color: #b4cbd8;
  }

  .form-group input,
  .form-group textarea {
    background: #2a3644;
    border-color: #2a3644;
    color: #e4f4fc;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    background: #1a2634;
  }

  .toggle-option {
    background: #2a3644;
  }

  .toggle-option.active {
    background: #1a2634;
  }

  .btn-cancel {
    background: #2a3644;
    color: #b4cbd8;
  }
}
</style>
