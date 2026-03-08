<template>
  <!-- LOADER -->
  <div v-if="loading" class="loading-screen">
    <img :src="logo" class="logo" />

    <div class="spinner"></div>

    <p class="loading-text">Iniciando sistema...</p>
  </div>

  <!-- APP -->
  <div v-else id="app" class="h-screen flex overflow-hidden">
    <NavbarComponent v-if="shouldShowNavbar" @sidebar-toggle="onSidebarToggle" />

    <main :class="['flex-1 transition-all duration-300 overflow-auto', mainContentMarginClass]">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import NavbarComponent from '@/components/NavbarComponent.vue'
import logo from '@/assets/images/LogoScratchcopia2..png'

const route = useRoute()

const loading = ref(true)
const API_URL = import.meta.env.VITE_API_URL

// Despertar backend (Railway)
async function wakeBackend() {
  const start = Date.now()

  let ready = false

  while (!ready) {
    try {
      const response = await fetch(`${API_URL}/api`)
      if (response.ok) {
        ready = true
      }
    } catch {
      await new Promise((res) => setTimeout(res, 3000))
    }
  }

  const minimumTime = 4000
  const elapsed = Date.now() - start

  if (elapsed < minimumTime) {
    await new Promise((res) => setTimeout(res, minimumTime - elapsed))
  }

  loading.value = false
}

onMounted(() => {
  wakeBackend()
})

const shouldShowNavbar = computed(() => {
  return route.meta.requiresAuth === true
})

// Estado del sidebar
const sidebarMinimized = ref(false)

// Escuchar cambios del sidebar
const onSidebarToggle = (isMinimized: boolean) => {
  sidebarMinimized.value = isMinimized
}

// Computed que calcula la clase de margin-left para el contenedor principal
const mainContentMarginClass = computed(() => {
  if (!shouldShowNavbar.value) return 'ml-0'
  return sidebarMinimized.value ? 'ml-20' : 'ml-64'
})
</script>

<style>
.loading-screen {
  height: 100vh;
  width: 100%;
  background: #111827;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 25px;
}

.logo {
  width: 140px;
  animation: float 2s ease-in-out infinite;
}

.loading-text {
  color: white;
  font-size: 18px;
  opacity: 0.8;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #374151;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-6px);
  }
  100% {
    transform: translateY(0px);
  }
}
</style>
