<!-- src/components/ProductCard.vue -->
<template>
  <div class="product-card" :class="{ unavailable: !product.isAvailable }">
    <div class="product-image">
      <img :src="product.imageUrl" :alt="product.name" @error="handleImageError" />
      <div v-if="!product.isAvailable" class="unavailable-badge">
        <span class="badge-icon">⛔</span>
        No disponible
      </div>
    </div>

    <div class="product-info">
      <div class="product-header">
        <div class="title-section">
          <h3 class="product-name" :class="{ 'text-muted': !product.isAvailable }">
            {{ product.name }}
          </h3>
          <span class="category-badge">{{ product.category.name }}</span>
        </div>
        <span class="product-price" :class="{ 'text-muted': !product.isAvailable }">
          Q{{ parseFloat(product.price).toFixed(2) }}
        </span>
      </div>

      <p class="product-description" :class="{ 'text-muted': !product.isAvailable }">
        {{ product.description }}
      </p>

      <div class="product-actions">
        <button class="btn-action btn-edit" @click="$emit('edit', product)" title="Editar producto">
          <span class="action-icon">✏️</span>
          <span class="action-text">Editar</span>
        </button>
        <button
          class="btn-action btn-delete"
          @click="$emit('delete', product.id)"
          title="Eliminar producto"
        >
          <span class="action-icon">🗑️</span>
          <span class="action-text">Eliminar</span>
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
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.08);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid rgba(96, 154, 187, 0.1);
}

.product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 25px rgba(5, 27, 58, 0.15);
}

.product-card.unavailable {
  opacity: 0.8;
  background: #f8fafc;
}

/* Imagen */
.product-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #e4f4fc;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.unavailable-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(145deg, #ef4444, #dc2626);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
  z-index: 10;
}

.badge-icon {
  font-size: 0.9rem;
}

/* Información */
.product-info {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  gap: 1rem;
}

.title-section {
  flex: 1;
}

.product-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #051b3a;
  line-height: 1.3;
  letter-spacing: -0.3px;
}

.product-name.text-muted {
  color: #b4cbd8;
}

.category-badge {
  display: inline-block;
  background: #e4f4fc;
  color: #609abb;
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(96, 154, 187, 0.2);
}

.product-price {
  font-size: 1.2rem;
  font-weight: 700;
  color: #10b981;
  white-space: nowrap;
  background: #d1fae5;
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.product-price.text-muted {
  color: #b4cbd8;
  background: #e4f4fc;
}

.product-description {
  margin: 0 0 1rem 0;
  color: #5d7a90;
  font-size: 0.9rem;
  line-height: 1.5;
  flex: 1;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-description.text-muted {
  color: #b4cbd8;
}

/* Acciones */
.product-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 2px solid #e4f4fc;
}

.btn-action {
  flex: 1;
  padding: 0.6rem 0.5rem;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-weight: 600;
  font-size: 0.85rem;
  border: 2px solid transparent;
}

.action-icon {
  font-size: 1rem;
}

.action-text {
  line-height: 1;
}

.btn-edit {
  background: #e4f4fc;
  color: #609abb;
  border-color: rgba(96, 154, 187, 0.2);
}

.btn-edit:hover {
  background: #609abb;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
  border-color: #609abb;
}

.btn-delete {
  background: #fee2e2;
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.btn-delete:hover {
  background: #ef4444;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(239, 68, 68, 0.3);
  border-color: #ef4444;
}

.btn-action:active {
  transform: translateY(0);
}

/* Tooltip para móviles */
@media (max-width: 768px) {
  .action-text {
    display: none;
  }

  .btn-action {
    padding: 0.75rem;
  }

  .action-icon {
    font-size: 1.2rem;
  }

  .btn-action:hover::after {
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

  .btn-action {
    position: relative;
  }
}

@media (max-width: 480px) {
  .product-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .product-price {
    align-self: flex-start;
  }

  .product-description {
    line-clamp: 2;
    -webkit-line-clamp: 2;
  }
}

/* Animación */
.product-card {
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
