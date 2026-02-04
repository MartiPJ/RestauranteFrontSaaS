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
            <button v-if="currentView === 'products'" @click="backToCategories" class="back-btn">
              <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h2>
                {{
                  isForTakeout
                    ? 'Nueva Orden Para Llevar'
                    : `Tomar Orden - Mesa ${table?.tableNumber}`
                }}
              </h2>
              <p class="subtitle">
                {{
                  currentView === 'categories' ? 'Selecciona una categoría' : selectedCategory?.name
                }}
              </p>
            </div>
          </div>
          <button @click="handleClose" class="close-btn">
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

        <div class="modal-body">
          <!-- Vista de Categorías -->
          <div v-if="currentView === 'categories'" class="content-grid">
            <div class="categories-section">
              <div v-if="categoryStore.loading" class="loading">
                <div class="spinner"></div>
                <p>Cargando categorías...</p>
              </div>
              <div v-else-if="categoryStore.categories.length === 0" class="empty">
                No hay categorías disponibles
              </div>
              <div v-else class="categories-grid">
                <div
                  v-for="category in categoryStore.categories"
                  :key="category.id"
                  class="category-card"
                  @click="selectCategory(category)"
                >
                  <div v-if="category.imageUrl" class="category-image-wrapper">
                    <img :src="category.imageUrl" :alt="category.name" class="category-image" />
                  </div>
                  <div v-else class="category-image-placeholder">
                    <svg class="icon-large" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </div>
                  <div class="category-info">
                    <h3>{{ category.name }}</h3>
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

            <!-- Carrito (versión compacta en vista de categorías) -->
            <div class="cart-section compact">
              <h3>Orden ({{ cartItemsCount }})</h3>
              <div v-if="cart.length === 0" class="cart-empty">
                <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p>Selecciona una categoría para comenzar</p>
              </div>
              <div v-else>
                <div class="cart-summary">
                  <div v-for="item in cart" :key="item.productId" class="cart-summary-item">
                    <span>{{ item.quantity }}x {{ item.product.name }}</span>
                    <span class="item-price"
                      >${{ (parseFloat(item.product.price) * item.quantity).toFixed(2) }}</span
                    >
                  </div>
                </div>
                <div class="cart-total">
                  <span>Total:</span>
                  <span class="total-amount">${{ cartTotal.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Vista de Productos -->
          <div v-if="currentView === 'products'" class="content-grid">
            <!-- Filtro de búsqueda -->
            <div class="products-section">
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

              <div v-if="categoryStore.loading" class="loading">
                <div class="spinner"></div>
                <p>Cargando productos...</p>
              </div>
              <div v-else-if="filteredProducts.length === 0" class="empty">
                No hay productos disponibles
              </div>
              <div v-else class="products-grid">
                <div
                  v-for="product in filteredProducts"
                  :key="product.id"
                  class="product-card"
                  @click="addToCart(product)"
                >
                  <img
                    v-if="product.imageUrl"
                    :src="product.imageUrl"
                    :alt="product.name"
                    class="product-image"
                  />
                  <div v-else class="product-image-placeholder">
                    <svg class="icon-large" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div class="product-info">
                    <h4>{{ product.name }}</h4>
                    <p v-if="product.description" class="product-description">
                      {{ product.description }}
                    </p>
                    <p class="product-price">${{ parseFloat(product.price).toFixed(2) }}</p>
                  </div>
                  <button class="add-btn">
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
            <div class="cart-section">
              <h3>Orden ({{ cartItemsCount }})</h3>
              <div v-if="cart.length === 0" class="cart-empty">
                <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p>El carrito está vacío</p>
              </div>
              <div v-else class="cart-items">
                <div v-for="item in cart" :key="item.productId" class="cart-item">
                  <div class="cart-item-info">
                    <h4>{{ item.product.name }}</h4>
                    <p class="cart-item-price">
                      ${{ parseFloat(item.product.price).toFixed(2) }} c/u
                    </p>
                  </div>
                  <div class="cart-item-controls">
                    <div class="quantity-controls">
                      <button @click.stop="updateQuantity(item.productId, item.quantity - 1)">
                        -
                      </button>
                      <span>{{ item.quantity }}</span>
                      <button @click.stop="updateQuantity(item.productId, item.quantity + 1)">
                        +
                      </button>
                    </div>
                    <button @click.stop="removeFromCart(item.productId)" class="remove-btn">
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
                  <textarea
                    v-model="item.notes"
                    placeholder="Notas especiales para este producto..."
                    class="item-notes"
                    @click.stop
                  />
                </div>

                <div class="order-notes">
                  <label>Notas de la orden</label>
                  <textarea
                    v-model="orderNotes"
                    placeholder="Notas generales para toda la orden..."
                    class="notes-textarea"
                  />
                </div>

                <div class="cart-total">
                  <span>Total:</span>
                  <span class="total-amount">${{ cartTotal.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="handleClose" class="btn btn-cancel">Cancelar</button>
          <button @click="handleSubmit" class="btn btn-primary" :disabled="cart.length === 0">
            Crear Orden ({{ cartItemsCount }})
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
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  color: #6b7280;
  transition: all 0.2s;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  background-color: #f3f4f6;
  color: #1f2937;
}

.modal-header h2 {
  margin: 0 0 4px 0;
  font-size: 24px;
  color: #1f2937;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
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

.icon-large {
  width: 48px;
  height: 48px;
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  height: calc(90vh - 250px);
}

/* Categorías */
.categories-section {
  display: flex;
  flex-direction: column;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  overflow-y: auto;
  padding-right: 8px;
}

.category-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #3b82f6;
}

.category-image-wrapper {
  width: 100%;
  height: 160px;
  overflow: hidden;
}

.category-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-image-placeholder {
  width: 100%;
  height: 160px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.category-info {
  padding: 16px;
  flex: 1;
}

.category-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.category-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.category-arrow {
  padding: 0 16px 16px;
  display: flex;
  justify-content: flex-end;
  color: #3b82f6;
}

/* Productos */
.products-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  overflow-y: auto;
  padding-right: 8px;
}

.product-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.product-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 8px;
}

.product-image-placeholder {
  width: 100%;
  height: 120px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 6px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.product-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.product-description {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 8px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  font-size: 16px;
  font-weight: 700;
  color: #10b981;
  margin: 0;
}

.add-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background-color: #2563eb;
}

.add-btn .icon {
  width: 16px;
  height: 16px;
}

/* Carrito */
.cart-section {
  background: #f9fafb;
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.cart-section.compact {
  justify-content: flex-start;
}

.cart-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
}

.cart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #9ca3af;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 12px;
}

.cart-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.cart-summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 6px;
  font-size: 13px;
}

.item-price {
  font-weight: 600;
  color: #10b981;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e5e7eb;
}

.cart-item-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.cart-item-price {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.cart-item-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.quantity-controls button {
  width: 28px;
  height: 28px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.quantity-controls button:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.quantity-controls span {
  min-width: 30px;
  text-align: center;
  font-weight: 600;
}

.remove-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.remove-btn:hover {
  color: #dc2626;
}

.remove-btn .icon {
  width: 20px;
  height: 20px;
}

.item-notes {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  resize: vertical;
  min-height: 40px;
  box-sizing: border-box;
}

.item-notes:focus {
  outline: none;
  border-color: #3b82f6;
}

.order-notes {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.order-notes label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.notes-textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 13px;
  resize: vertical;
  min-height: 60px;
  box-sizing: border-box;
}

.notes-textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

.cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 2px solid #e5e7eb;
  font-size: 18px;
  font-weight: 600;
}

.total-amount {
  color: #10b981;
  font-size: 24px;
}

.loading,
.empty {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-cancel {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover:not(:disabled) {
  background-color: #e5e7eb;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
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

@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style>
