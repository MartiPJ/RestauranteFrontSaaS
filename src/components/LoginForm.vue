<!-- src/components/LoginForm.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

const isFormValid = computed(() => {
  return email.value.trim() !== '' && password.value.trim() !== ''
})

const handleSubmit = async () => {
  if (!isFormValid.value) return

  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    })

    // Redirigir al dashboard o página principal
    router.push('/dashboard')
  } catch (error) {
    // El error ya está manejado en el store
    console.error('Error en login:', error)
  }
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div
    style="
      max-width: 400px;
      margin: 0 auto;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    "
  >
    <h2 style="text-align: center; margin-bottom: 2rem; color: #333; font-size: 1.75rem">
      Iniciar Sesión
    </h2>

    <form @submit.prevent="handleSubmit">
      <!-- Email Input -->
      <div style="margin-bottom: 1.5rem">
        <label
          for="email"
          style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500"
        >
          Email
        </label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="tu@email.com"
          required
          style="
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
            transition: border-color 0.3s;
            box-sizing: border-box;
          "
          @focus="authStore.clearError()"
        />
      </div>

      <!-- Password Input -->
      <div style="margin-bottom: 1.5rem">
        <label
          for="password"
          style="display: block; margin-bottom: 0.5rem; color: #555; font-weight: 500"
        >
          Contraseña
        </label>
        <div style="position: relative">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            required
            style="
              width: 100%;
              padding: 0.75rem;
              padding-right: 2.5rem;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 1rem;
              transition: border-color 0.3s;
              box-sizing: border-box;
            "
            @focus="authStore.clearError()"
          />
          <button
            type="button"
            @click="togglePasswordVisibility"
            style="
              position: absolute;
              right: 0.75rem;
              top: 50%;
              transform: translateY(-50%);
              background: none;
              border: none;
              cursor: pointer;
              color: #666;
              padding: 0.25rem;
            "
          >
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="authStore.error"
        style="
          padding: 0.75rem;
          margin-bottom: 1rem;
          background-color: #fee;
          border: 1px solid #fcc;
          border-radius: 4px;
          color: #c33;
          font-size: 0.875rem;
        "
      >
        {{ authStore.error }}
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="!isFormValid || authStore.isLoading"
        style="
          width: 100%;
          padding: 0.875rem;
          background-color: #ff6b35;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
        "
        :style="{
          opacity: !isFormValid || authStore.isLoading ? 0.6 : 1,
          cursor: !isFormValid || authStore.isLoading ? 'not-allowed' : 'pointer',
        }"
        @mouseover="
          (e) => {
            if (isFormValid && !authStore.isLoading) {
              ;(e.target as HTMLElement).style.backgroundColor = '#e55a2b'
            }
          }
        "
        @mouseout="
          (e) => {
            ;(e.target as HTMLElement).style.backgroundColor = '#ff6b35'
          }
        "
      >
        {{ authStore.isLoading ? 'Iniciando...' : 'Iniciar Sesión' }}
      </button>

      <!-- Forgot Password Link -->
      <div style="margin-top: 1rem; text-align: center">
        <a
          href="#"
          style="color: #ff6b35; text-decoration: none; font-size: 0.875rem"
          @click.prevent="() => {}"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>
    </form>
  </div>
</template>
