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
  <div class="login-form-container">
    <div class="login-form-header">
      <h2>Bienvenido</h2>
      <p class="subtitle">Inicia sesión para acceder al sistema</p>
    </div>

    <form @submit.prevent="handleSubmit" class="login-form">
      <!-- Email Input -->
      <div class="form-group">
        <label for="email">
          <span class="label-icon">📧</span>
          Correo Electrónico
        </label>
        <div class="input-wrapper">
          <span class="input-icon">@</span>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="tu@email.com"
            required
            class="form-input"
            :class="{ error: authStore.error }"
            @focus="authStore.clearError()"
          />
        </div>
      </div>

      <!-- Password Input -->
      <div class="form-group">
        <label for="password">
          <span class="label-icon">🔑</span>
          Contraseña
        </label>
        <div class="input-wrapper">
          <span class="input-icon">🔒</span>
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            required
            class="form-input"
            :class="{ error: authStore.error }"
            @focus="authStore.clearError()"
          />
          <button
            type="button"
            @click="togglePasswordVisibility"
            class="password-toggle"
            :title="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
          >
            <span class="toggle-icon">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</span>
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <Transition name="shake">
        <div v-if="authStore.error" class="error-message">
          <span class="error-icon">⚠️</span>
          <span class="error-text">{{ authStore.error }}</span>
        </div>
      </Transition>

      <!-- Submit Button -->
      <button type="submit" class="submit-btn" :disabled="!isFormValid || authStore.isLoading">
        <span v-if="!authStore.isLoading" class="btn-content">
          <span>Iniciar Sesión</span>
        </span>
        <span v-else class="btn-content loading">
          <span class="spinner"></span>
          <span>Iniciando...</span>
        </span>
      </button>

      <!-- Forgot Password Link -->
      <div class="forgot-password">
        <a href="#" @click.prevent="() => {}"> ¿Olvidaste tu contraseña? </a>
      </div>
    </form>
  </div>
</template>

<style scoped>
.login-form-container {
  max-width: 400px;
  margin: 0 auto;
  padding: 2.5rem;
  background: white;
  border-radius: 24px;
  box-shadow: 0 15px 35px rgba(5, 27, 58, 0.2);
  border: 1px solid rgba(96, 154, 187, 0.1);
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.header-icon {
  width: 70px;
  height: 70px;
  background: linear-gradient(145deg, #609abb, #e4f4fc);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 10px 20px rgba(96, 154, 187, 0.2);
}

.icon-emoji {
  font-size: 2rem;
}

.login-form-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #051b3a;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  color: #5d7a90;
  font-size: 0.95rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #051b3a;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.label-icon {
  font-size: 1rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #b4cbd8;
  font-size: 1.1rem;
  z-index: 1;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.8rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #e4f4fc;
  color: #051b3a;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: #b4cbd8;
  font-size: 0.95rem;
}

.form-input:focus {
  outline: none;
  border-color: #609abb;
  background: white;
  box-shadow: 0 0 0 4px rgba(96, 154, 187, 0.1);
}

.form-input.error {
  border-color: #ef4444;
  background: #fee2e2;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #b4cbd8;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 1;
}

.password-toggle:hover {
  color: #609abb;
  transform: scale(1.1);
}

.toggle-icon {
  font-size: 1.2rem;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #fee2e2;
  border: 2px solid #ef4444;
  border-radius: 12px;
  color: #ef4444;
  font-size: 0.9rem;
  font-weight: 500;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}

.error-icon {
  font-size: 1.1rem;
}

.error-text {
  flex: 1;
}

.shake-enter-active {
  animation: shake 0.5s ease;
}

/* Submit Button */
.submit-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(145deg, #609abb, #5d7a90);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
  margin-top: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(145deg, #5d7a90, #051b3a);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.3);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-icon {
  font-size: 1.1rem;
}

/* Loading Spinner */
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Forgot Password Link */
.forgot-password {
  text-align: center;
  margin-top: 0.5rem;
}

.forgot-password a {
  color: #609abb;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  border-bottom: 1px dashed transparent;
}

.forgot-password a:hover {
  color: #051b3a;
  border-bottom-color: #051b3a;
}

/* Demo Credentials */
.demo-credentials {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #e4f4fc;
  border-radius: 12px;
  text-align: center;
  border: 1px dashed #609abb;
}

.demo-label {
  margin: 0 0 0.25rem 0;
  font-size: 0.8rem;
  color: #5d7a90;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.demo-text {
  margin: 0;
  font-size: 0.9rem;
  color: #051b3a;
  font-weight: 600;
  font-family: monospace;
}

/* Responsive */
@media (max-width: 480px) {
  .login-form-container {
    padding: 1.5rem;
  }

  .login-form-header h2 {
    font-size: 1.5rem;
  }

  .header-icon {
    width: 60px;
    height: 60px;
  }

  .icon-emoji {
    font-size: 1.5rem;
  }

  .form-input {
    padding: 0.75rem 1rem 0.75rem 2.5rem;
  }

  .demo-text {
    font-size: 0.8rem;
  }
}

/* Modo oscuro */
@media (prefers-color-scheme: dark) {
  .login-form-container {
    background: #1a2634;
  }

  .login-form-header h2 {
    color: #e4f4fc;
  }

  .subtitle {
    color: #b4cbd8;
  }

  .form-group label {
    color: #e4f4fc;
  }

  .form-input {
    background: #2a3644;
    border-color: #2a3644;
    color: #e4f4fc;
  }

  .form-input:focus {
    background: #1a2634;
  }

  .demo-credentials {
    background: #2a3644;
    border-color: #609abb;
  }

  .demo-text {
    color: #e4f4fc;
  }
}
</style>
