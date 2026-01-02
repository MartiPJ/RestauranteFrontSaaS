<!-- src/views/LoginView.vue -->
<script setup lang="ts">
import LoginForm from '@/components/LoginForm.vue'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

// Redirigir si ya está autenticado
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
})
</script>

<template>
  <div
    style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    "
  >
    <div style="width: 100%; max-width: 500px">
      <!-- Logo o nombre del restaurante -->
      <div style="text-align: center; margin-bottom: 2rem">
        <h1
          style="
            color: white;
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
          "
        >
          🍽️ RestauranteApp
        </h1>
        <p style="color: rgba(255, 255, 255, 0.9); font-size: 1rem">Sistema de gestión</p>
      </div>

      <!-- Formulario de login -->
      <LoginForm />
    </div>
  </div>
</template>
