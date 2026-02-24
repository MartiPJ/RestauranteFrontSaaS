// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import Dashboard from '@/views/Dashboard.vue'
import Table from '@/views/Table.vue'
import CategoryView from '@/views/CategoryView.vue'
import ProductView from '@/views/ProductView.vue'
import OrdersView from '@/views/OrdersView.vue'
import KitchenView from '@/views/KitchenView.vue'
import InvoiceView from '@/views/InvoiceView.vue'
import UsersView from '@/views/UsersView.vue'
import CashClosureView from '@/views/CashClosureView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard,
    meta: { requiresAuth: true },
  },
  {
    path: '/tables',
    name: 'tables',
    component: Table,
    meta: { requiresAuth: true },
  },
  {
    path: '/Categories',
    name: 'categories',
    component: CategoryView,
    meta: { requiresAuth: true },
  },
  {
    path: '/Products',
    name: 'products',
    component: ProductView,
    meta: { requiresAuth: true },
  },
  {
    path: '/Orders',
    name: 'orders',
    component: OrdersView,
    meta: { requiresAuth: true },
  },
  {
    path: '/Kitchen',
    name: 'kitchen',
    component: KitchenView,
    meta: { requiresAuth: true },
  },
  {
    path: '/Invoices',
    name: 'invoices',
    component: InvoiceView,
    meta: { requiresAuth: true },
  },
  {
    path: '/Users',
    name: 'users',
    component: UsersView,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'manager'] },
  },
  {
    path: '/cash-closure',
    name: 'cash-closure',
    component: CashClosureView,
    meta: { requiresAuth: true, allowedRoles: ['admin', 'manager'] },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth
  const allowedRoles = to.meta.allowedRoles as string[] | undefined

  // Verificar autenticación si hay token
  if (authStore.token && !authStore.isAuthenticated) {
    await authStore.checkAuth()
  }

  // 🚨 Si requiere login y no está autenticado
  if (requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login' })
  }

  // 🚨 Validar roles si existen
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some((role) => authStore.hasRole(role))

    if (!hasAccess) {
      return next({ name: 'dashboard' })
    }
  }

  // 🚨 Si ya está autenticado y quiere ir a login
  if (to.name === 'login' && authStore.isAuthenticated) {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
