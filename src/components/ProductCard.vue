<template>
  <div class="product-card">
    <div class="product-image">
      <img :src="product.imageUrl" :alt="product.name" @error="handleImageError" />
      <div v-if="!product.isAvailable" class="unavailable-badge">No disponible</div>
    </div>

    <div class="product-info">
      <div class="product-header">
        <h3 class="product-name">{{ product.name }}</h3>
        <span class="product-price">Q{{ parseFloat(product.price).toFixed(2) }}</span>
      </div>

      <p class="product-description">{{ product.description }}</p>

      <div class="product-meta">
        <span class="category-badge">{{ product.category.name }}</span>
      </div>

      <div class="product-actions">
        <button class="btn-icon btn-edit" @click="$emit('edit', product)" title="Editar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button class="btn-icon btn-delete" @click="$emit('delete', product.id)" title="Eliminar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="3 6 5 6 21 6"></polyline>
            <path
              d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
            ></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '@/types/product'

defineProps<{
  product: Product
}>()

defineEmits<{
  edit: [product: Product]
  delete: [id: string]
}>()

function handleImageError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = 'https://via.placeholder.com/300x200?text=Imagen+no+disponible'
}
</script>

<style scoped>
.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.product-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f3f4f6;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.unavailable-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #ef4444;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.product-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 8px;
  gap: 12px;
}

.product-name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
}

.product-price {
  font-size: 18px;
  font-weight: 700;
  color: #059669;
  white-space: nowrap;
}

.product-description {
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
  flex: 1;
}

.product-meta {
  margin-bottom: 12px;
}

.category-badge {
  display: inline-block;
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.product-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.btn-icon {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}

.btn-edit {
  background: #dbeafe;
  color: #1e40af;
}

.btn-edit:hover {
  background: #bfdbfe;
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
}

.btn-delete:hover {
  background: #fecaca;
}
</style>
