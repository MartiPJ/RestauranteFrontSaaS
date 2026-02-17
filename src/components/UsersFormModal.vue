<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-backdrop" @click.self="handleClose">
        <div class="modal-container" :class="{ 'modal--loading': isSubmitting }">
          <!-- Header -->
          <div class="modal-header">
            <div class="modal-header__icon">
              <span class="header-emoji">{{ mode === 'create' ? '👤➕' : '✏️👤' }}</span>
            </div>
            <div class="modal-header__text">
              <h2>{{ mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario' }}</h2>
              <p class="header-subtitle">
                {{
                  mode === 'create'
                    ? 'Completa los datos para registrar un nuevo usuario'
                    : 'Modifica los datos del usuario'
                }}
              </p>
            </div>
            <button
              class="modal-close"
              @click="handleClose"
              :disabled="isSubmitting"
              title="Cerrar"
            >
              <span class="close-icon">✕</span>
            </button>
          </div>

          <!-- Form -->
          <form class="modal-form" @submit.prevent="handleSubmit" novalidate>
            <div class="form-grid">
              <!-- Name -->
              <div class="form-field" :class="{ 'form-field--error': errors.name }">
                <label class="form-label">
                  <span class="label-icon">👤</span>
                  Nombre completo
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  class="form-input"
                  placeholder="Ej. Juan García"
                  :disabled="isSubmitting"
                  @blur="validateField('name')"
                />
                <span v-if="errors.name" class="form-error">
                  <span class="error-icon">⚠️</span>
                  {{ errors.name }}
                </span>
              </div>

              <!-- Email -->
              <div class="form-field" :class="{ 'form-field--error': errors.email }">
                <label class="form-label">
                  <span class="label-icon">📧</span>
                  Correo electrónico
                </label>
                <input
                  v-model="form.email"
                  type="email"
                  class="form-input"
                  placeholder="usuario@restaurante.com"
                  :disabled="isSubmitting"
                  @blur="validateField('email')"
                />
                <span v-if="errors.email" class="form-error">
                  <span class="error-icon">⚠️</span>
                  {{ errors.email }}
                </span>
              </div>

              <!-- Password (only on create) -->
              <div
                v-if="mode === 'create'"
                class="form-field"
                :class="{ 'form-field--error': errors.password }"
              >
                <label class="form-label">
                  <span class="label-icon">🔑</span>
                  Contraseña
                </label>
                <div class="input-password-wrapper">
                  <input
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    class="form-input form-input--password"
                    placeholder="Mínimo 6 caracteres"
                    :disabled="isSubmitting"
                    @blur="validateField('password')"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    @click="showPassword = !showPassword"
                    :disabled="isSubmitting"
                    :title="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                  >
                    <span class="toggle-icon">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</span>
                  </button>
                </div>
                <span v-if="errors.password" class="form-error">
                  <span class="error-icon">⚠️</span>
                  {{ errors.password }}
                </span>
              </div>

              <!-- Roles -->
              <div
                class="form-field form-field--full"
                :class="{ 'form-field--error': errors.roles }"
              >
                <label class="form-label">
                  <span class="label-icon">🎭</span>
                  Roles asignados
                </label>
                <div class="roles-grid">
                  <button
                    v-for="role in allRoles"
                    :key="role.value"
                    type="button"
                    class="role-chip"
                    :class="{ 'role-chip--active': form.roles.includes(role.value) }"
                    :disabled="isSubmitting"
                    @click="toggleRole(role.value)"
                  >
                    <span class="role-chip__dot" :style="{ background: role.color }"></span>
                    <span class="role-chip__label">{{ role.label }}</span>
                    <span v-if="form.roles.includes(role.value)" class="role-chip__check">✓</span>
                  </button>
                </div>
                <span v-if="errors.roles" class="form-error">
                  <span class="error-icon">⚠️</span>
                  {{ errors.roles }}
                </span>
              </div>
            </div>

            <!-- Global error -->
            <Transition name="slide-down">
              <div v-if="submitError" class="form-alert">
                <span class="alert-icon">⚠️</span>
                <span class="alert-message">{{ submitError }}</span>
              </div>
            </Transition>

            <!-- Actions -->
            <div class="modal-actions">
              <button
                type="button"
                class="btn btn--ghost"
                @click="handleClose"
                :disabled="isSubmitting"
              >
                <span class="btn-icon">✕</span>
                Cancelar
              </button>
              <button type="submit" class="btn btn--primary" :disabled="isSubmitting">
                <span v-if="isSubmitting" class="btn-spinner"></span>
                <span v-else class="btn-icon">{{ mode === 'create' ? '➕' : '✓' }}</span>
                {{
                  mode === 'create'
                    ? isSubmitting
                      ? 'Registrando...'
                      : 'Registrar Usuario'
                    : isSubmitting
                      ? 'Guardando...'
                      : 'Guardar Cambios'
                }}
              </button>
            </div>
          </form>

          <!-- Decoración inferior -->
          <div class="modal-footer-decoration"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ValidRoles, RoleLabels, RoleColors } from '@/types/user'
import type { FullUser, CreateUserPayload, UpdateUserPayload } from '@/types/user'

interface Props {
  isOpen: boolean
  mode: 'create' | 'edit'
  user?: FullUser | null
}

const props = withDefaults(defineProps<Props>(), {
  user: null,
})

const emit = defineEmits<{
  close: []
  submit: [payload: CreateUserPayload | UpdateUserPayload]
}>()

const isSubmitting = ref(false)
const showPassword = ref(false)
const submitError = ref<string | null>(null)

const form = reactive({
  name: '',
  email: '',
  password: '',
  roles: [] as ValidRoles[],
})

const errors = reactive({
  name: '',
  email: '',
  password: '',
  roles: '',
})

const allRoles = computed(() =>
  Object.values(ValidRoles).map((v) => ({
    value: v,
    label: RoleLabels[v],
    color: RoleColors[v],
  })),
)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      resetForm()
      submitError.value = null
    }
  },
)

watch(
  () => props.user,
  (user) => {
    if (user && props.mode === 'edit') {
      form.name = user.name
      form.email = user.email
      form.password = ''
      form.roles = [...user.roles]
    }
  },
  { immediate: true },
)

function resetForm() {
  if (props.mode === 'edit' && props.user) {
    form.name = props.user.name
    form.email = props.user.email
    form.password = ''
    form.roles = [...props.user.roles]
  } else {
    form.name = ''
    form.email = ''
    form.password = ''
    form.roles = []
  }
  errors.name = ''
  errors.email = ''
  errors.password = ''
  errors.roles = ''
  showPassword.value = false
}

function toggleRole(role: ValidRoles) {
  const idx = form.roles.indexOf(role)
  if (idx === -1) {
    form.roles.push(role)
  } else {
    form.roles.splice(idx, 1)
  }
  if (errors.roles) errors.roles = ''
}

function validateField(field: keyof typeof errors) {
  switch (field) {
    case 'name':
      errors.name = form.name.trim().length < 2 ? 'El nombre debe tener al menos 2 caracteres' : ''
      break
    case 'email':
      errors.email = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
        ? 'Ingresa un correo válido'
        : ''
      break
    case 'password':
      if (props.mode === 'create') {
        errors.password =
          form.password.length < 6 ? 'La contraseña debe tener al menos 6 caracteres' : ''
      }
      break
    case 'roles':
      errors.roles = form.roles.length === 0 ? 'Selecciona al menos un rol' : ''
      break
  }
}

function validateAll(): boolean {
  validateField('name')
  validateField('email')
  if (props.mode === 'create') validateField('password')
  validateField('roles')
  return !errors.name && !errors.email && !errors.password && !errors.roles
}

async function handleSubmit() {
  submitError.value = null
  if (!validateAll()) return

  isSubmitting.value = true
  try {
    let payload: CreateUserPayload | UpdateUserPayload
    if (props.mode === 'create') {
      payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        roles: form.roles,
      } as CreateUserPayload
    } else {
      payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        roles: form.roles,
      } as UpdateUserPayload
    }
    emit('submit', payload)
  } catch (error: any) {
    submitError.value = error.message || 'Error al procesar la solicitud'
  } finally {
    isSubmitting.value = false
  }
}

function handleClose() {
  if (!isSubmitting.value) {
    emit('close')
  }
}

defineExpose({
  setSubmitting: (v: boolean) => {
    isSubmitting.value = v
  },
  setError: (msg: string) => {
    submitError.value = msg
  },
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 27, 58, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-container {
  background: #fff;
  border-radius: 24px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(5, 27, 58, 0.25);
  transition: opacity 0.3s ease;
  border: 1px solid rgba(96, 154, 187, 0.1);
  animation: modalAppear 0.3s ease;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-container--loading {
  pointer-events: none;
  opacity: 0.8;
}

/* Scrollbar */
.modal-container::-webkit-scrollbar {
  width: 6px;
}
.modal-container::-webkit-scrollbar-track {
  background: #e4f4fc;
  border-radius: 3px;
}
.modal-container::-webkit-scrollbar-thumb {
  background: #b4cbd8;
  border-radius: 3px;
}
.modal-container::-webkit-scrollbar-thumb:hover {
  background: #609abb;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 1.5rem 0;
}

.modal-header__icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(145deg, #609abb, #e4f4fc);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-emoji {
  font-size: 1.5rem;
}

.modal-header__text {
  flex: 1;
}

.modal-header__text h2 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #051b3a;
  margin: 0 0 0.25rem;
  line-height: 1.2;
  letter-spacing: -0.3px;
}

.header-subtitle {
  font-size: 0.85rem;
  color: #5d7a90;
  margin: 0;
}

.modal-close {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  background: #e4f4fc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #609abb;
  transition: all 0.3s ease;
}

.modal-close:hover:not(:disabled) {
  background: #609abb;
  color: white;
  transform: rotate(90deg);
}

.modal-close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.close-icon {
  font-size: 1.2rem;
}

/* Form */
.modal-form {
  padding: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #051b3a;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.label-icon {
  font-size: 1rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #051b3a;
  background: #e4f4fc;
  transition: all 0.3s ease;
  outline: none;
  box-sizing: border-box;
  font-family: inherit;
}

.form-input:focus {
  border-color: #609abb;
  background: white;
  box-shadow: 0 0 0 4px rgba(96, 154, 187, 0.1);
}

.form-input:disabled {
  background: #f8fafc;
  color: #b4cbd8;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: #b4cbd8;
}

.form-field--error .form-input {
  border-color: #ef4444;
  background: #fee2e2;
}

.form-field--error .form-input:focus {
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.form-error {
  font-size: 0.75rem;
  color: #ef4444;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.error-icon {
  font-size: 0.8rem;
}

/* Password Input */
.input-password-wrapper {
  position: relative;
}

.form-input--password {
  padding-right: 3rem;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  cursor: pointer;
  color: #b4cbd8;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.password-toggle:hover:not(:disabled) {
  color: #609abb;
  transform: translateY(-50%) scale(1.1);
}

.toggle-icon {
  font-size: 1.2rem;
}

/* Roles Grid */
.roles-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.role-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 2px solid #e4f4fc;
  border-radius: 30px;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #5d7a90;
  transition: all 0.3s ease;
}

.role-chip:hover:not(:disabled) {
  border-color: #609abb;
  color: #609abb;
  background: #e4f4fc;
  transform: translateY(-2px);
}

.role-chip--active {
  border-color: #609abb;
  background: #e4f4fc;
  color: #051b3a;
  font-weight: 600;
}

.role-chip__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.role-chip__check {
  color: #609abb;
  font-size: 0.9rem;
  font-weight: 700;
}

.role-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Alert */
.form-alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fee2e2;
  border: 2px solid #ef4444;
  border-radius: 12px;
  color: #ef4444;
  font-size: 0.85rem;
  margin-top: 1rem;
}

.alert-icon {
  font-size: 1rem;
}

.alert-message {
  flex: 1;
}

/* Actions */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 2px solid #e4f4fc;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  white-space: nowrap;
}

.btn-icon {
  font-size: 1rem;
}

.btn--primary {
  background: linear-gradient(145deg, #609abb, #5d7a90);
  color: #fff;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.btn--primary:hover:not(:disabled) {
  background: linear-gradient(145deg, #5d7a90, #051b3a);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.3);
}

.btn--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn--ghost {
  background: #e4f4fc;
  color: #5d7a90;
  border: 2px solid #b4cbd8;
}

.btn--ghost:hover:not(:disabled) {
  background: #b4cbd8;
  color: #051b3a;
  transform: translateY(-2px);
}

.btn--ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Footer Decoration */
.modal-footer-decoration {
  height: 4px;
  background: linear-gradient(90deg, #609abb, #b4cbd8, #e4f4fc);
  width: 100%;
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95) translateY(20px);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 100px;
  opacity: 1;
}

/* Responsive */
@media (max-width: 480px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field--full {
    grid-column: 1;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .btn {
    justify-content: center;
    width: 100%;
  }

  .roles-grid {
    flex-direction: column;
  }

  .role-chip {
    width: 100%;
    justify-content: center;
  }
}

/* Modo oscuro */
@media (prefers-color-scheme: dark) {
  .modal-container {
    background: #1a2634;
  }

  .modal-header__text h2 {
    color: #e4f4fc;
  }

  .header-subtitle {
    color: #b4cbd8;
  }

  .form-label {
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

  .role-chip {
    background: #2a3644;
    border-color: #3a4654;
    color: #b4cbd8;
  }

  .role-chip--active {
    background: #1a2634;
    border-color: #609abb;
    color: #e4f4fc;
  }

  .btn--ghost {
    background: #2a3644;
    color: #b4cbd8;
    border-color: #3a4654;
  }

  .btn--ghost:hover:not(:disabled) {
    background: #3a4654;
    color: #e4f4fc;
  }
}
</style>
