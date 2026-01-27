<!-- src/views/Dashboard.vue -->
<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>Dashboard - Restaurante</h1>
      <p class="subtitle">Sistema de Gestión</p>
    </header>

    <nav class="dashboard-nav">
      <button
        v-for="section in sections"
        :key="section.id"
        @click="navigateTo(section.route)"
        class="nav-button"
      >
        <span class="icon">{{ section.icon }}</span>
        <span class="label">{{ section.label }}</span>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

interface DashboardSection {
  id: string
  label: string
  icon: string
  route: string
}

const sections: DashboardSection[] = [
  {
    id: 'mesas',
    label: 'Mesas',
    icon: '🪑',
    route: '/tables',
  },
  {
    id: 'ordenar',
    label: 'Ordenar',
    icon: '📋',
    route: '/orders',
  },
  {
    id: 'Categorias',
    label: 'Categorías',
    icon: '🍽️',
    route: '/Categories',
  },
  {
    id: 'Productos',
    label: 'Productos',
    icon: '📦',
    route: '/Products',
  },
  {
    id: 'factura',
    label: 'Factura',
    icon: '🧾',
    route: '/factura',
  },
]

const navigateTo = (route: string) => {
  router.push(route)
}
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.dashboard-header {
  text-align: center;
  color: white;
  margin-bottom: 3rem;
}

.dashboard-header h1 {
  font-size: 2.5rem;
  margin: 0;
  font-weight: 700;
}

.subtitle {
  font-size: 1.1rem;
  margin-top: 0.5rem;
  opacity: 0.9;
}

.dashboard-nav {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}

.nav-button {
  background: white;
  border: none;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.nav-button:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.nav-button:active {
  transform: translateY(-2px);
}

.icon {
  font-size: 3rem;
}

.label {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

@media (max-width: 768px) {
  .dashboard-nav {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    padding: 1rem;
  }

  .nav-button {
    padding: 1.5rem 1rem;
  }

  .icon {
    font-size: 2.5rem;
  }

  .label {
    font-size: 1rem;
  }
}
</style>
