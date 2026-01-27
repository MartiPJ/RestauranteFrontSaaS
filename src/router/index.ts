// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import Dashboard from '@/views/Dashboard.vue'
import Table from '@/views/Table.vue'
import CategoryView from '@/views/CategoryView.vue'
import ProductView from '@/views/ProductView.vue'

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
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth

  // Verificar autenticación si hay token
  if (authStore.token && !authStore.isAuthenticated) {
    await authStore.checkAuth()
  }

  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirigir a login si la ruta requiere autenticación
    next({ name: 'login' })
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    // Redirigir a dashboard si ya está autenticado
    //next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
