<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}</h2>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="product-form">
        <div class="form-group">
          <label for="name">Nombre *</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            required
            placeholder="Ej: Tacos al Pastor"
          />
        </div>

        <div class="form-group">
          <label for="description">Descripción *</label>
          <textarea
            id="description"
            v-model="formData.description"
            required
            rows="3"
            placeholder="Describe el producto..."
          ></textarea>
        </div>

        <div class="form-group">
          <label for="price">Precio (Q) *</label>
          <input
            id="price"
            v-model.number="formData.price"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
          />
        </div>

        <div class="form-group">
          <label for="imageUrl">URL de Imagen *</label>
          <input
            id="imageUrl"
            v-model="formData.imageUrl"
            type="url"
            required
            placeholder="https://ejemplo.com/imagen.jpg"
          />
          <div v-if="formData.imageUrl" class="image-preview">
            <img :src="formData.imageUrl" alt="Preview" @error="handleImageError" />
          </div>
        </div>

        <div class="form-group">
          <label for="category">Categoría *</label>
          <select id="category" v-model="formData.categoryId" required>
            <option value="" disabled>Selecciona una categoría</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input v-model="formData.isAvailable" type="checkbox" />
            <span>Producto disponible</span>
          </label>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-cancel" @click="$emit('close')">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
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

function handleSubmit() {
  emit('submit', { ...formData.value })
}

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = 'https://via.placeholder.com/150?text=Error+al+cargar'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
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
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #111827;
}

.product-form {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea {
  resize: vertical;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 400;
}

.checkbox-group input[type='checkbox'] {
  width: auto;
  margin-right: 8px;
  cursor: pointer;
}

.image-preview {
  margin-top: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  max-width: 200px;
}

.image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
