<!-- src/components/MenuModal.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Table } from '@/types/table'
import type { Category, Product } from '@/types/category'
import { useCategoryStore } from '@/stores/categoryStore'

const props = defineProps<{
  show: boolean
  table?: Table | null
  isForTakeout?: boolean
}>()

const emit = defineEmits<{
  close: []
  submit: [
    items: {
      productId: string
      quantity: number
      notes?: string
    }[],
    orderNotes?: string,
  ]
}>()

const categoryStore = useCategoryStore()

const currentView = ref<'categories' | 'products'>('categories')
const selectedCategory = ref<Category | null>(null)
const searchQuery = ref('')
const orderNotes = ref('')
const activeTab = ref<'menu' | 'cart'>('menu')

// Carrito de compras
interface CartItem {
  productId: string
  product: Product
  quantity: number
  notes: string
}

const cart = ref<CartItem[]>([])

const filteredProducts = computed(() => {
  if (!categoryStore.currentProducts) return []

  let result = categoryStore.currentProducts

  if (searchQuery.value) {
    result = result.filter((p) => p.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
  }

  return result.filter((p) => p.isAvailable)
})

const cartTotal = computed(() => {
  return cart.value.reduce((sum, item) => {
    return sum + parseFloat(item.product.price) * item.quantity
  }, 0)
})

const cartItemsCount = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.quantity, 0)
})

// Observar cuando se muestra el modal
watch(
  () => props.show,
  async (newVal) => {
    if (newVal) {
      await loadCategories()
      resetView()
      activeTab.value = 'menu'
    }
  },
)

async function loadCategories() {
  try {
    await categoryStore.fetchCategories()
  } catch (error) {
    console.error('Error al cargar categorías:', error)
  }
}

async function selectCategory(category: Category) {
  selectedCategory.value = category
  try {
    await categoryStore.fetchProductsByCategory(category.id)
    currentView.value = 'products'
    searchQuery.value = ''
  } catch (error) {
    console.error('Error al cargar productos:', error)
    alert('Error al cargar los productos de esta categoría')
  }
}

function backToCategories() {
  currentView.value = 'categories'
  selectedCategory.value = null
  searchQuery.value = ''
  categoryStore.clearProducts()
}

function addToCart(product: Product) {
  const existingItem = cart.value.find((item) => item.productId === product.id)
  if (existingItem) {
    existingItem.quantity++
  } else {
    cart.value.push({
      productId: product.id,
      product,
      quantity: 1,
      notes: '',
    })
  }
  // Feedback visual - cambiar a carrito en móvil
  if (window.innerWidth <= 768) {
    activeTab.value = 'cart'
  }
}

function removeFromCart(productId: string) {
  cart.value = cart.value.filter((item) => item.productId !== productId)
}

function updateQuantity(productId: string, quantity: number) {
  const item = cart.value.find((item) => item.productId === productId)
  if (item) {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      item.quantity = quantity
    }
  }
}

function handleSubmit() {
  if (cart.value.length === 0) {
    alert('Agrega al menos un producto a la orden')
    return
  }

  const items = cart.value.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    notes: item.notes || undefined,
  }))

  emit('submit', items, orderNotes.value || undefined)
  resetForm()
}

function resetForm() {
  cart.value = []
  orderNotes.value = ''
  searchQuery.value = ''
  resetView()
}

function resetView() {
  currentView.value = 'categories'
  selectedCategory.value = null
  categoryStore.clearProducts()
}

function handleClose() {
  resetForm()
  emit('close')
}
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="handleClose">
      <div class="modal-container">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-left">
            <button
              v-if="currentView === 'products'"
              @click="backToCategories"
              class="back-btn"
              title="Volver a categorías"
            >
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div class="header-icon">
              <span class="icon-emoji">{{ isForTakeout ? '🥡' : '🍽️' }}</span>
            </div>
            <div class="header-text">
              <h2>
                {{ isForTakeout ? 'Orden Para Llevar' : `Mesa ${table?.tableNumber}` }}
              </h2>
              <p class="subtitle">
                {{
                  currentView === 'categories' ? 'Selecciona una categoría' : selectedCategory?.name
                }}
              </p>
            </div>
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

        <!-- Tabs móvil -->
        <div class="mobile-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'menu' }"
            @click="activeTab = 'menu'"
          >
            <span class="tab-icon">📋</span>
            <span>Menú</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'cart' }"
            @click="activeTab = 'cart'"
          >
            <span class="tab-icon">🛒</span>
            <span>Orden</span>
            <span v-if="cartItemsCount > 0" class="cart-badge">{{ cartItemsCount }}</span>
          </button>
        </div>

        <div class="modal-body">
          <!-- Vista de Categorías -->
          <div
            v-if="currentView === 'categories'"
            class="content-grid"
            :class="{ 'mobile-view': activeTab }"
          >
            <div class="categories-section" :class="{ 'mobile-hidden': activeTab === 'cart' }">
              <div class="section-header">
                <h3>Categorías</h3>
                <span class="section-badge">{{ categoryStore.categories.length }}</span>
              </div>

              <div v-if="categoryStore.loading" class="loading-state">
                <div class="spinner"></div>
                <p>Cargando categorías...</p>
              </div>

              <div v-else-if="categoryStore.categories.length === 0" class="empty-state">
                <span class="empty-icon">🍽️</span>
                <p>No hay categorías disponibles</p>
              </div>

              <div v-else class="categories-grid">
                <div
                  v-for="category in categoryStore.categories"
                  :key="category.id"
                  class="category-card"
                  @click="selectCategory(category)"
                >
                  <div class="category-image-container">
                    <img
                      v-if="category.imageUrl"
                      :src="category.imageUrl"
                      :alt="category.name"
                      class="category-image"
                    />
                    <div v-else class="category-image-placeholder">
                      <span class="placeholder-icon">📋</span>
                    </div>
                  </div>
                  <div class="category-info">
                    <h4>{{ category.name }}</h4>
                    <p v-if="category.description" class="category-description">
                      {{ category.description }}
                    </p>
                  </div>
                  <div class="category-arrow">
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Carrito (versión compacta) -->
            <div class="cart-section compact" :class="{ 'mobile-hidden': activeTab === 'menu' }">
              <div class="section-header">
                <h3>Orden Actual</h3>
                <span v-if="cartItemsCount > 0" class="cart-badge-large">
                  {{ cartItemsCount }} {{ cartItemsCount === 1 ? 'ítem' : 'ítems' }}
                </span>
              </div>

              <div v-if="cart.length === 0" class="cart-empty">
                <span class="empty-icon">🛒</span>
                <p>El carrito está vacío</p>
                <p class="empty-hint">Selecciona una categoría para comenzar</p>
              </div>

              <div v-else class="cart-preview">
                <div class="cart-summary">
                  <div v-for="item in cart" :key="item.productId" class="cart-summary-item">
                    <div class="summary-item-info">
                      <span class="item-quantity">{{ item.quantity }}x</span>
                      <span class="item-name">{{ item.product.name }}</span>
                    </div>
                    <span class="item-price">
                      ${{ (parseFloat(item.product.price) * item.quantity).toFixed(2) }}
                    </span>
                  </div>
                </div>

                <div class="cart-total">
                  <span class="total-label">Total:</span>
                  <span class="total-amount">${{ cartTotal.toFixed(2) }}</span>
                </div>

                <button @click="activeTab = 'cart'" class="btn-view-cart">
                  Ver detalle de orden
                  <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Vista de Productos -->
          <div
            v-if="currentView === 'products'"
            class="content-grid"
            :class="{ 'mobile-view': activeTab }"
          >
            <div class="products-section" :class="{ 'mobile-hidden': activeTab === 'cart' }">
              <div class="section-header">
                <h3>{{ selectedCategory?.name }}</h3>
                <span class="section-badge">{{ filteredProducts.length }} productos</span>
              </div>

              <!-- Filtro de búsqueda -->
              <div class="search-box">
                <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Buscar producto..."
                  class="search-input"
                />
              </div>

              <div v-if="categoryStore.loading" class="loading-state">
                <div class="spinner"></div>
                <p>Cargando productos...</p>
              </div>

              <div v-else-if="filteredProducts.length === 0" class="empty-state">
                <span class="empty-icon">🍲</span>
                <p>No hay productos disponibles</p>
              </div>

              <div v-else class="products-grid">
                <div
                  v-for="product in filteredProducts"
                  :key="product.id"
                  class="product-card"
                  @click="addToCart(product)"
                >
                  <div class="product-image-container">
                    <img
                      v-if="product.imageUrl"
                      :src="product.imageUrl"
                      :alt="product.name"
                      class="product-image"
                    />
                    <div v-else class="product-image-placeholder">
                      <span class="placeholder-icon">🍲</span>
                    </div>
                  </div>
                  <div class="product-info">
                    <h4>{{ product.name }}</h4>
                    <p v-if="product.description" class="product-description">
                      {{ product.description }}
                    </p>
                    <p class="product-price">${{ parseFloat(product.price).toFixed(2) }}</p>
                  </div>
                  <button class="add-btn" title="Agregar al carrito">
                    <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Carrito (versión completa) -->
            <div class="cart-section full" :class="{ 'mobile-hidden': activeTab === 'menu' }">
              <div class="section-header">
                <h3>Orden Actual</h3>
                <span v-if="cartItemsCount > 0" class="cart-badge-large">
                  {{ cartItemsCount }} {{ cartItemsCount === 1 ? 'ítem' : 'ítems' }}
                </span>
              </div>

              <div v-if="cart.length === 0" class="cart-empty">
                <span class="empty-icon">🛒</span>
                <p>El carrito está vacío</p>
                <p class="empty-hint">Selecciona productos para agregar</p>
              </div>

              <div v-else class="cart-items">
                <div v-for="item in cart" :key="item.productId" class="cart-item">
                  <div class="cart-item-header">
                    <div class="cart-item-info">
                      <h4>{{ item.product.name }}</h4>
                      <p class="cart-item-price">
                        ${{ parseFloat(item.product.price).toFixed(2) }} c/u
                      </p>
                    </div>
                    <button
                      @click.stop="removeFromCart(item.productId)"
                      class="remove-btn"
                      title="Eliminar"
                    >
                      <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <div class="cart-item-controls">
                    <div class="quantity-controls">
                      <button
                        @click.stop="updateQuantity(item.productId, item.quantity - 1)"
                        class="qty-btn"
                        :disabled="item.quantity <= 1"
                      >
                        −
                      </button>
                      <span class="quantity">{{ item.quantity }}</span>
                      <button
                        @click.stop="updateQuantity(item.productId, item.quantity + 1)"
                        class="qty-btn"
                      >
                        +
                      </button>
                    </div>
                    <span class="item-subtotal">
                      ${{ (parseFloat(item.product.price) * item.quantity).toFixed(2) }}
                    </span>
                  </div>

                  <textarea
                    v-model="item.notes"
                    placeholder="Notas especiales (ej. sin cebolla, bien cocido...)"
                    class="item-notes"
                    rows="2"
                    @click.stop
                  />
                </div>

                <div class="order-notes">
                  <label class="notes-label">
                    <span class="label-icon">📝</span>
                    Notas de la orden
                  </label>
                  <textarea
                    v-model="orderNotes"
                    placeholder="Notas generales para toda la orden..."
                    class="notes-textarea"
                    rows="2"
                    @click.stop
                  />
                </div>

                <div class="cart-total">
                  <span class="total-label">Total:</span>
                  <span class="total-amount">${{ cartTotal.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="handleClose" class="btn btn-cancel">
            <span class="btn-icon">✕</span>
            <span class="btn-text">Cancelar</span>
          </button>
          <button @click="handleSubmit" class="btn btn-primary" :disabled="cart.length === 0">
            <span class="btn-icon">✓</span>
            <span class="btn-text">Crear Orden</span>
            <span v-if="cartItemsCount > 0" class="btn-badge">{{ cartItemsCount }}</span>
          </button>
        </div>
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
  max-width: 1400px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
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
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 2px solid #e4f4fc;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.back-btn {
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

.back-btn:hover {
  background: #609abb;
  color: white;
  transform: translateX(-3px);
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

.header-text h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #051b3a;
  letter-spacing: -0.3px;
}

.subtitle {
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

/* Mobile Tabs */
.mobile-tabs {
  display: none;
  padding: 1rem 1.5rem;
  gap: 0.5rem;
  background: #e4f4fc;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: none;
  border-radius: 12px;
  background: white;
  color: #5d7a90;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn.active {
  background: #609abb;
  color: white;
}

.tab-icon {
  font-size: 1.1rem;
}

.cart-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Body */
.modal-body {
  flex: 1;
  overflow: auto;
  padding: 1.5rem;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  height: calc(90vh - 300px);
  min-height: 500px;
}

/* Section Headers */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #051b3a;
  margin: 0;
}

.section-badge {
  background: #e4f4fc;
  color: #609abb;
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
}

.cart-badge-large {
  background: #609abb;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
}

/* Categories Section */
.categories-section {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.category-card {
  background: white;
  border: 2px solid #e4f4fc;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  display: flex;
  position: relative;
}

.category-card:hover {
  transform: translateY(-4px);
  border-color: #609abb;
  box-shadow: 0 8px 20px rgba(96, 154, 187, 0.15);
}

.category-image-container {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  overflow: hidden;
}

.category-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-image-placeholder {
  width: 100%;
  height: 100%;
  background: #e4f4fc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  font-size: 1.5rem;
  color: #609abb;
}

.category-info {
  flex: 1;
  padding: 0.75rem;
}

.category-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #051b3a;
  margin: 0 0 0.25rem 0;
}

.category-description {
  font-size: 0.8rem;
  color: #5d7a90;
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.category-arrow {
  display: flex;
  align-items: center;
  padding-right: 0.75rem;
  color: #b4cbd8;
}

/* Products Section */
.products-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #b4cbd8;
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: #e4f4fc;
  color: #051b3a;
}

.search-input:focus {
  outline: none;
  border-color: #609abb;
  background: white;
  box-shadow: 0 0 0 4px rgba(96, 154, 187, 0.1);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.product-card {
  background: white;
  border: 2px solid #e4f4fc;
  border-radius: 16px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.product-card:hover {
  transform: translateY(-4px);
  border-color: #609abb;
  box-shadow: 0 8px 20px rgba(96, 154, 187, 0.15);
}

.product-image-container {
  width: 100%;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-image-placeholder {
  width: 100%;
  height: 100%;
  background: #e4f4fc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-info h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #051b3a;
  margin: 0 0 0.25rem 0;
}

.product-description {
  font-size: 0.75rem;
  color: #5d7a90;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-size: 1rem;
  font-weight: 700;
  color: #10b981;
  margin: 0;
}

.add-btn {
  position: absolute;
  bottom: 0.75rem;
  right: 0.75rem;
  width: 28px;
  height: 28px;
  background: #609abb;
  color: white;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0;
  transform: scale(0.8);
}

.product-card:hover .add-btn {
  opacity: 1;
  transform: scale(1);
}

.add-btn:hover {
  background: #5d7a90;
  transform: scale(1.1) !important;
}

.add-btn .icon {
  width: 14px;
  height: 14px;
}

/* Cart Section */
.cart-section {
  background: #e4f4fc;
  border-radius: 20px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cart-section.compact,
.cart-section.full {
  height: 100%;
}

.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  background: white;
  border-radius: 16px;
  height: 100%;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: #e4f4fc;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-hint {
  font-size: 0.8rem;
  color: #b4cbd8;
  margin-top: 0.5rem;
}

/* Cart Preview */
.cart-preview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-summary {
  background: white;
  border-radius: 16px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cart-summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  padding: 0.25rem 0;
  border-bottom: 1px dashed #e4f4fc;
}

.cart-summary-item:last-child {
  border-bottom: none;
}

.summary-item-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-quantity {
  font-weight: 700;
  color: #609abb;
  min-width: 30px;
}

.item-name {
  color: #051b3a;
}

.item-price {
  font-weight: 600;
  color: #10b981;
}

.btn-view-cart {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: white;
  border: 2px solid #609abb;
  border-radius: 12px;
  color: #609abb;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-view-cart:hover {
  background: #609abb;
  color: white;
}

.btn-view-cart .icon {
  width: 16px;
  height: 16px;
}

/* Cart Items (Full) */
.cart-items {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-right: 0.25rem;
}

.cart-item {
  background: white;
  border-radius: 16px;
  padding: 1rem;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.cart-item:hover {
  border-color: #609abb;
}

.cart-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.cart-item-info h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #051b3a;
  margin: 0 0 0.25rem 0;
}

.cart-item-price {
  font-size: 0.85rem;
  color: #5d7a90;
  margin: 0;
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  color: #dc2626;
  transform: scale(1.1);
}

.cart-item-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #e4f4fc;
  border-radius: 30px;
  padding: 0.25rem;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: white;
  color: #609abb;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover:not(:disabled) {
  background: #609abb;
  color: white;
  transform: scale(1.1);
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity {
  min-width: 30px;
  text-align: center;
  font-weight: 600;
  color: #051b3a;
}

.item-subtotal {
  font-weight: 700;
  color: #10b981;
}

.item-notes {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #e4f4fc;
  border-radius: 10px;
  font-size: 0.8rem;
  resize: vertical;
  transition: all 0.3s ease;
}

.item-notes:focus {
  outline: none;
  border-color: #609abb;
}

.order-notes {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px dashed #b4cbd8;
}

.notes-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #051b3a;
  margin-bottom: 0.5rem;
}

.label-icon {
  font-size: 1rem;
}

.notes-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  font-size: 0.9rem;
  resize: vertical;
  transition: all 0.3s ease;
}

.notes-textarea:focus {
  outline: none;
  border-color: #609abb;
}

.cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #609abb;
  font-weight: 700;
}

.total-label {
  font-size: 1rem;
  color: #051b3a;
}

.total-amount {
  font-size: 1.5rem;
  color: #10b981;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
  border-radius: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e4f4fc;
  border-top-color: #609abb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  text-align: center;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: #e4f4fc;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Footer */
.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 2px solid #e4f4fc;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.btn-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon {
  font-size: 1.1rem;
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
  transform: scale(0.95) translateY(20px);
}

/* Responsive */
@media (max-width: 768px) {
  .mobile-tabs {
    display: flex;
  }

  .content-grid {
    grid-template-columns: 1fr;
    height: calc(90vh - 380px);
  }

  .content-grid.mobile-view {
    display: block;
  }

  .mobile-hidden {
    display: none;
  }

  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .cart-section {
    height: 100%;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .btn-badge {
    position: relative;
    top: 0;
    right: 0;
    margin-left: 0.5rem;
  }
}

@media (max-width: 480px) {
  .modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-left {
    width: 100%;
  }

  .close-btn {
    align-self: flex-end;
  }

  .categories-grid {
    grid-template-columns: 1fr;
  }

  .products-grid {
    grid-template-columns: 1fr;
  }

  .cart-item-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
