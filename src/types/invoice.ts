// src/types/invoice.ts
export interface Invoice {
  id: string
  orderNumber: string
  orderDate: string
  subtotal: string
  tax: string
  total: string
  notes?: string | null
  userName: string
  userRole: string
  tableNumber?: string | null
  products: InvoiceProduct[]
}

export interface InvoiceProduct {
  id: string
  name: string
  quantity: number
  unitPrice: string
  subtotal: string
  notes?: string | null
}
