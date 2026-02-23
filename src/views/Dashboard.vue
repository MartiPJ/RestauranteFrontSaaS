<!-- src/views/Dashboard.vue -->
<template>
  <div class="dashboard-container">
    <!-- Header con diseño mejorado -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="header-icon">
          <img :src="logoFromScratch" alt="Logo" class="w-10 h-10 object-contain" />
        </div>
        <div class="header-text">
          <h1>Panel de Control</h1>
          <p class="subtitle">RestauranteApp - Sistema de Gestión</p>
        </div>
      </div>

      <!-- Info del usuario actual -->
      <div class="user-info">
        <span class="user-avatar">👤</span>
        <span class="user-name"
          >Bienvenido: {{ authStore.user?.name || 'Usuario' }} - Rol:
          {{ authStore.user?.roles?.join(', ') || 'Sin roles' }}</span
        >
      </div>
    </header>

    <!-- Grid de navegación principal -->
    <nav class="dashboard-nav">
      <button
        v-for="section in sections"
        :key="section.id"
        @click="navigateTo(section.route)"
        class="nav-button"
        :class="section.colorClass"
      >
        <img :src="section.icon" class="w-20 h-20 object-contain" alt="Icono de sección" />
        <span class="label">{{ section.label }}</span>
        <span class="description">{{ section.description }}</span>
      </button>
    </nav>

    <!-- Resumen rápido, aqui proximamente se realizara las graficas correspondientes
    para el administrador para ver las ventas, clientes, ordenes atendidas etc.-->
    <!-- <div class="quick-stats">
      <div class="stat-card">
        <span class="stat-icon">📊</span>
        <div class="stat-info">
          <span class="stat-value">156</span>
          <span class="stat-label">Órdenes hoy</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">👥</span>
        <div class="stat-info">
          <span class="stat-value">45</span>
          <span class="stat-label">Clientes activos</span>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">💰</span>
        <div class="stat-info">
          <span class="stat-value">$2,450</span>
          <span class="stat-label">Ventas hoy</span>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import logoFromScratch from '@/assets/images/LogoScratchcopia2..png'
import TableImage from '@/assets/images/dinner-svgrepo-com.png'
import KitchenImage from '@/assets/images/kitchen-pack-cook-svgrepo-com.png'
import OrdersImage from '@/assets/images/waiter-svgrepo-com.png'
import InvoiceImage from '@/assets/images/credit-card-money-svgrepo-com.png'
import CategoriesImage from '@/assets/images/shopping-bag-supermarket-svgrepo-com.png'
import ProductsImage from '@/assets/images/champagne-svgrepo-com.png'
import UsersImage from '@/assets/images/reception-english-svgrepo-com.png'

const router = useRouter()
const authStore = useAuthStore()

interface DashboardSection {
  id: string
  label: string
  description: string
  icon: string
  route: string
  colorClass: string
  roles?: string[]
}

const allSections: DashboardSection[] = [
  {
    id: 'mesas',
    label: 'Mesas',
    description: 'Gestionar mesas y asignaciones',
    icon: TableImage,
    route: '/tables',
    colorClass: 'color-primary',
  },
  {
    id: 'ordenar',
    label: 'Ordenar',
    description: 'Tomar y gestionar pedidos',
    icon: OrdersImage,
    route: '/orders',
    colorClass: 'color-secondary',
  },
  {
    id: 'Categorias',
    label: 'Categorías',
    description: 'Administrar categorías',
    icon: CategoriesImage,
    route: '/Categories',
    colorClass: 'color-tertiary',
  },
  {
    id: 'Productos',
    label: 'Productos',
    description: 'Inventario y productos',
    icon: ProductsImage,
    route: '/Products',
    colorClass: 'color-primary',
  },
  {
    id: 'Kitchen',
    label: 'Cocina',
    description: 'Panel de cocina',
    icon: KitchenImage,
    route: '/Kitchen',
    colorClass: 'color-secondary',
  },
  {
    id: 'Invoice',
    label: 'Facturación',
    description: 'Pagos y facturas',
    icon: InvoiceImage,
    route: '/Invoices',
    colorClass: 'color-tertiary',
  },
  {
    id: 'Users',
    label: 'Usuarios',
    description: 'Gestionar usuarios del sistema',
    icon: UsersImage,
    route: '/Users',
    colorClass: 'color-tertiary',
    roles: ['admin', 'manager'],
  },
]

const sections = computed(() => {
  // Usar el getter userRoles del store
  const userRoles = authStore.userRoles || []

  return allSections.filter((section) => {
    // Si la sección no tiene restricción de roles, mostrar
    if (!section.roles || section.roles.length === 0) return true

    // Si tiene restricción, verificar si el usuario tiene algún rol permitido
    return section.roles.some((role) =>
      userRoles.some((userRole) => userRole.toLowerCase() === role.toLowerCase()),
    )
  })
})

const navigateTo = (route: string) => {
  router.push(route)
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #e4f4fc;
  padding: 2rem;
}

/* Header mejorado */
.dashboard-header {
  background: white;
  border-radius: 20px;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 25px rgba(5, 27, 58, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  border-left: 6px solid #609abb;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(145deg, #609abb, #b4cbd8);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.header-text h1 {
  font-size: 2rem;
  color: #051b3a;
  margin: 0;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 1rem;
  color: #5d7a90;
  margin: 0.25rem 0 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #e4f4fc;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
}

.user-avatar {
  font-size: 1.5rem;
  background: #609abb;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.user-name {
  color: #051b3a;
  font-weight: 600;
  font-size: 1rem;
}

/* Grid de navegación */
.dashboard-nav {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 0.5rem;
}

/* Botones de navegación con variantes de color */
.nav-button {
  border: none;
  border-radius: 20px;
  padding: 2rem 1.5rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 20px rgba(5, 27, 58, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-button:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 30px rgba(5, 27, 58, 0.15);
}

.nav-button:active {
  transform: translateY(-4px) scale(1.01);
}

/* Variantes de color para los botones */
.color-primary {
  background: linear-gradient(145deg, #ffffff, #e4f4fc);
  border-bottom: 4px solid #609abb;
}

.color-primary:hover {
  background: linear-gradient(145deg, #609abb, #5d7a90);
  border-bottom-color: #051b3a;
}

.color-primary:hover .label,
.color-primary:hover .description {
  color: white;
}

.color-secondary {
  background: linear-gradient(145deg, #ffffff, #e4f4fc);
  border-bottom: 4px solid #5d7a90;
}

.color-secondary:hover {
  background: linear-gradient(145deg, #5d7a90, #609abb);
  border-bottom-color: #051b3a;
}

.color-secondary:hover .label,
.color-secondary:hover .description {
  color: white;
}

.color-tertiary {
  background: linear-gradient(145deg, #ffffff, #e4f4fc);
  border-bottom: 4px solid #b4cbd8;
}

.color-tertiary:hover {
  background: linear-gradient(145deg, #b4cbd8, #609abb);
  border-bottom-color: #051b3a;
}

.color-tertiary:hover .label,
.color-tertiary:hover .description {
  color: white;
}

.icon {
  font-size: 3rem;
  transition: transform 0.3s ease;
}

.nav-button:hover .icon {
  transform: scale(1.1);
}

.label {
  font-size: 1.4rem;
  font-weight: 700;
  color: #051b3a;
  transition: color 0.3s ease;
  letter-spacing: -0.3px;
}

.description {
  font-size: 0.9rem;
  color: #5d7a90;
  transition: color 0.3s ease;
  line-height: 1.4;
}

/* Estadísticas rápidas */
.quick-stats {
  max-width: 1400px;
  margin: 2.5rem auto 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 0 0.5rem;
}

.stat-card {
  background: white;
  border-radius: 15px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  border-left: 4px solid #609abb;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateX(5px);
}

.stat-icon {
  font-size: 2rem;
  background: #e4f4fc;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #051b3a;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.85rem;
  color: #5d7a90;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-content {
    width: 100%;
  }

  .user-info {
    width: 100%;
    justify-content: center;
  }

  .dashboard-nav {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1rem;
  }

  .nav-button {
    padding: 1.5rem 1rem;
  }

  .icon {
    font-size: 2.5rem;
  }

  .label {
    font-size: 1.2rem;
  }

  .description {
    font-size: 0.85rem;
  }

  .quick-stats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .header-text h1 {
    font-size: 1.5rem;
  }

  .header-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }

  .dashboard-nav {
    grid-template-columns: 1fr;
  }
}
</style>
