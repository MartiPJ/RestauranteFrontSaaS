<!-- src/views/LoginView.vue -->
<script setup lang="ts">
import LoginForm from '@/components/LoginForm.vue'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import logoFromScratch from '@/assets/images/LogoScratchcopia2..png'

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
      background: linear-gradient(145deg, #051b3a 0%, #5d7a90 100%);
      padding: 1rem;
    "
  >
    <div style="width: 100%; max-width: 450px">
      <!-- Logo o nombre del restaurante -->
      <div style="text-align: center; margin-bottom: 2.5rem">
        <div
          style="
            width: 80px;
            height: 80px;
            background: linear-gradient(145deg, #609abb, #b4cbd8);
            border-radius: 50%;
            margin: 0 auto 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 25px rgba(5, 27, 58, 0.3);
          "
        >
          <img :src="logoFromScratch" alt="Logo" class="w-15 h-15 object-contain" />
        </div>
        <h1
          style="
            color: #ffffff;
            font-size: 2.2rem;
            margin-bottom: 0.5rem;
            font-weight: 600;
            letter-spacing: -0.5px;
            text-shadow: 0 2px 4px rgba(5, 27, 58, 0.3);
          "
        >
          RestauranteApp
        </h1>
        <p style="color: #e4f4fc; font-size: 1rem; font-weight: 400; opacity: 0.95">
          Sistema de gestión
        </p>
      </div>

      <!-- Formulario de login -->
      <LoginForm />

      <!-- Footer con información adicional -->
      <div style="text-align: center; margin-top: 2rem">
        <p style="color: #b4cbd8; font-size: 0.9rem">
          ¿Problemas para acceder? Contacta al administrador
        </p>
        <p style="color: #e4f4fc; font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.8">
          © 2026 From Scratch. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Transición suave para elementos interactivos */
* {
  transition: all 0.3s ease;
}

/* Estilos para mejorar la legibilidad */
h1,
p {
  margin: 0;
  padding: 0;
  line-height: 1.4;
}

/* Animación sutil para el logo */
@keyframes subtleFloat {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0px);
  }
}

div[style*='border-radius: 50%'] {
  animation: subtleFloat 3s ease-in-out infinite;
}
</style>
