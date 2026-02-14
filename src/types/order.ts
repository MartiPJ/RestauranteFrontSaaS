// src/types/order.ts

export enum OrderStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  READY = 'ready',
  DELIVERED = 'delivered',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export enum OrderItemStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  SERVED = 'served',
  CANCELLED = 'cancelled',
}

export interface OrderProduct {
  id: string
  quantity: number
  unitPrice: string
  subtotal: string
  notes?: string | null
  status: OrderItemStatus
  orderId: string
  productId: string
  product: {
    id: string
    name: string
    description?: string
    imageUrl?: string
    price: string
    isAvailable: boolean
    categoryId: string
    createdAt: string
    updatedAt: string
  }
  createdAt: string
  updatedAt: string
}

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  subtotal: string
  tax: string
  total: string
  notes?: string | null
  closedAt?: string | null
  table?: {
    id: string
    tableNumber: string
  } | null
  tableId?: string | null
  user: {
    id: string
    name: string
    email?: string
    roles?: string[]
    tokenVersion?: number
    isActive?: boolean
    createdAt?: string
    updatedAt?: string
  }
  orderProducts?: OrderProduct[]
  createdAt: string
  updatedAt: string
}

// Para compatibilidad, podemos crear un getter
export interface OrderWithItems extends Order {
  items: OrderProduct[] // Computed property para fácil acceso
}

export interface OrderResponse {
  id: string
  orderNumber: string
  status: string
  subtotal: string
  tax: string
  total: string
  notes?: string | null
  orderProducts?: OrderProduct[]
  createdAt: string
  updatedAt: string
  closedAt?: string | null
  table?: any
  user?: any
}

export interface CreateOrderDTO {
  tableId?: string | null
  notes?: string
  items: {
    productId: string
    quantity: number
    notes?: string
  }[]
}

export interface UpdateOrderDTO {
  notes?: string
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus
}

export interface AddOrderItemsDTO {
  items: {
    productId: string
    quantity: number
    notes?: string
  }[]
}

export interface UpdateOrderItemDTO {
  quantity?: number
  notes?: string
  status?: OrderItemStatus
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    itemsPerPage: number
    totalItems: number
    currentPage: number
    totalPages: number
    sortBy: string[][]
  }
  links: {
    current: string
    first?: string
    previous?: string
    next?: string
    last?: string
  }
}
