// src/data/menu.ts

export interface MenuItem {
  id: string
  label: string
  path: string
  svg: string
}

export interface MenuSection {
  id: string
  label: string
  svg: string
  items?: MenuItem[]
}
import TableImage from '@/assets/images/dinner-svgrepo-com.png'
import KitchenImage from '@/assets/images/kitchen-pack-cook-svgrepo-com.png'
import OrdersImage from '@/assets/images/waiter-svgrepo-com.png'
import InvoiceImage from '@/assets/images/credit-card-money-svgrepo-com.png'
import CategoriesImage from '@/assets/images/shopping-bag-supermarket-svgrepo-com.png'
import ProductsImage from '@/assets/images/champagne-svgrepo-com.png'

export const menu: MenuSection[] = [
  {
    id: 'operations',
    label: 'Operaciones',
    svg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>`,
    items: [
      {
        id: 'orders',
        label: 'Órdenes',
        path: '/Orders',
        svg: OrdersImage,
      },
      {
        id: 'kitchen',
        label: 'Cocina',
        path: '/Kitchen',
        svg: KitchenImage,
      },
      {
        id: 'tables',
        label: 'Mesas',
        path: '/tables',
        svg: TableImage,
      },
      {
        id: 'invoices',
        label: 'Facturas',
        path: '/Invoices',
        svg: InvoiceImage,
      },
    ],
  },
  {
    id: 'catalog',
    label: 'Catálogo',
    svg: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
        d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>`,
    items: [
      {
        id: 'categories',
        label: 'Categorías',
        path: '/Categories',
        svg: CategoriesImage,
      },
      {
        id: 'products',
        label: 'Productos',
        path: '/Products',
        svg: ProductsImage,
      },
    ],
  },
]
