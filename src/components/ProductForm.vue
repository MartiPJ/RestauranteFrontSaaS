<!-- src/components/ProductForm.vue -->
<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-icon">
          <span class="icon-emoji">{{ isEditing ? '✏️' : '➕' }}</span>
        </div>
        <div class="header-text">
          <h2>{{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}</h2>
          <p class="header-subtitle">
            {{
              isEditing ? 'Modifica los datos del producto' : 'Ingresa los datos del nuevo producto'
            }}
          </p>
        </div>
        <button class="close-btn" @click="$emit('close')" title="Cerrar">
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
        <!-- Nombre -->
        <div class="form-group">
          <label for="name">
            <span class="label-icon">📝</span>
            Nombre *
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            required
            placeholder="Ej: Tacos al Pastor, Enchiladas, Pozole..."
          />
          <span class="input-hint">Máximo 50 caracteres</span>
        </div>

        <!-- Descripción -->
        <div class="form-group">
          <label for="description">
            <span class="label-icon">📄</span>
            Descripción *
          </label>
          <textarea
            id="description"
            v-model="formData.description"
            required
            rows="3"
            placeholder="Describe el producto, ingredientes, preparación..."
          ></textarea>
          <span class="input-hint">Máximo 200 caracteres</span>
        </div>

        <!-- Precio -->
        <div class="form-group">
          <label for="price">
            <span class="label-icon">💰</span>
            Precio (Q) *
          </label>
          <div class="price-input-group">
            <span class="currency-symbol">Q</span>
            <input
              id="price"
              v-model.number="formData.price"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              class="price-input"
            />
          </div>
          <span class="input-hint">Precio en quetzales</span>
        </div>

        <!-- URL de Imagen -->
        <div class="form-group">
          <label for="imageUrl">
            <span class="label-icon">🖼️</span>
            URL de Imagen *
          </label>
          <input
            id="imageUrl"
            v-model="formData.imageUrl"
            type="url"
            required
            placeholder="https://ejemplo.com/imagen.jpg"
          />

          <!-- Preview de imagen -->
          <div v-if="formData.imageUrl" class="image-preview">
            <div class="preview-header">
              <span class="preview-label">Vista previa:</span>
            </div>
            <div class="preview-container">
              <img
                :src="formData.imageUrl"
                alt="Preview"
                @error="handleImageError"
                class="preview-image"
              />
            </div>
          </div>
        </div>

        <!-- Categoría -->
        <div class="form-group">
          <label for="category">
            <span class="label-icon">📋</span>
            Categoría *
          </label>
          <select id="category" v-model="formData.categoryId" required>
            <option value="" disabled>Selecciona una categoría</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>

        <!-- Disponibilidad -->
        <div class="form-group toggle-group">
          <label class="toggle-label">
            <span class="label-icon">⚡</span>
            Estado del producto
          </label>
          <div class="toggle-options">
            <button
              type="button"
              class="toggle-option"
              :class="{ active: formData.isAvailable }"
              @click="formData.isAvailable = true"
            >
              <span class="toggle-indicator active"></span>
              <span class="toggle-text">Disponible</span>
            </button>
            <button
              type="button"
              class="toggle-option"
              :class="{ active: !formData.isAvailable }"
              @click="formData.isAvailable = false"
            >
              <span class="toggle-indicator inactive"></span>
              <span class="toggle-text">No disponible</span>
            </button>
          </div>
          <span class="input-hint"> Los productos no disponibles no se mostrarán en el menú </span>
        </div>

        <!-- Acciones -->
        <div class="modal-actions">
          <button type="button" class="btn btn-cancel" @click="$emit('close')">
            <span class="btn-icon">✕</span>
            <span class="btn-text">Cancelar</span>
          </button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span class="btn-icon">{{ isEditing ? '✓' : '➕' }}</span>
            <span class="btn-text">
              {{ loading ? 'Guardando...' : isEditing ? 'Actualizar Producto' : 'Crear Producto' }}
            </span>
            <span v-if="loading" class="loading-spinner"></span>
          </button>
        </div>
      </form>

      <!-- Decoración inferior -->
      <div class="modal-footer-decoration"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Product, Category, ProductFormData } from '@/types/product'

const props = defineProps<{
  product?: Product | null
  categories: Category[]
  loading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: ProductFormData]
  close: []
}>()

const isEditing = ref(!!props.product)

const formData = ref<ProductFormData>({
  name: '',
  description: '',
  imageUrl: '',
  price: 0,
  isAvailable: true,
  categoryId: '',
})

watch(
  () => props.product,
  (newProduct) => {
    if (newProduct) {
      formData.value = {
        name: newProduct.name,
        description: newProduct.description,
        imageUrl: newProduct.imageUrl,
        price: parseFloat(newProduct.price),
        isAvailable: newProduct.isAvailable,
        categoryId: newProduct.category.id,
      }
      isEditing.value = true
    }
  },
  { immediate: true },
)

watch(
  () => props.categories,
  () => {
    // Reset category selection if needed
  },
)

function handleSubmit() {
  emit('submit', { ...formData.value })
}

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = 'https://via.placeholder.com/300x200?text=Error+al+cargar'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(5, 27, 58, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(5, 27, 58, 0.25);
  animation: modalAppear 0.3s ease;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 2px solid #e4f4fc;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
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
  width: 40px;
  height: 40px;
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

/* Form */
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

.form-group input,
.form-group textarea,
.form-group select {
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
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #609abb;
  background: white;
  box-shadow: 0 0 0 4px rgba(96, 154, 187, 0.1);
}

.input-hint {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: #b4cbd8;
  font-style: italic;
}

/* Price Input */
.price-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.currency-symbol {
  background: #609abb;
  color: white;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
}

.price-input {
  flex: 1;
}

/* Image Preview */
.image-preview {
  margin-top: 1rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  overflow: hidden;
}

.preview-header {
  background: #e4f4fc;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid rgba(96, 154, 187, 0.2);
}

.preview-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #609abb;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.preview-container {
  padding: 1rem;
  background: #f8fafc;
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 150px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

/* Actions */
.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 2px solid #e4f4fc;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.btn-cancel:hover:not(:disabled) {
  background: #b4cbd8;
  color: #051b3a;
  transform: translateY(-2px);
}

.btn-primary {
  background: linear-gradient(145deg, #609abb, #5d7a90);
  color: white;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(145deg, #5d7a90, #051b3a);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.3);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-left: 0.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Footer Decoration */
.modal-footer-decoration {
  height: 4px;
  background: linear-gradient(90deg, #609abb, #b4cbd8, #e4f4fc);
  width: 100%;
}

/* Responsive */
@media (max-width: 640px) {
  .modal-container {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-header {
    padding: 1rem;
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

  .price-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .currency-symbol {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .modal-form {
    padding: 1rem;
  }

  .form-group label {
    font-size: 0.85rem;
  }
}

/* Modo oscuro */
@media (prefers-color-scheme: dark) {
  .modal-container {
    background: #1a2634;
  }

  .modal-header {
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
  .form-group textarea,
  .form-group select {
    background: #2a3644;
    border-color: #2a3644;
    color: #e4f4fc;
  }

  .form-group input:focus,
  .form-group textarea:focus,
  .form-group select:focus {
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

  .preview-container {
    background: #2a3644;
  }
}
</style>
