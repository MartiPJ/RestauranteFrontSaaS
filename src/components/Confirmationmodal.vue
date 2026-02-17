<!-- src/components/ConfirmationModal.vue -->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'success'
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const confirmTextDefault = computed(() => props.confirmText || 'Confirmar')
const cancelTextDefault = computed(() => props.cancelText || 'Cancelar')

const config = computed(() => {
  const configs = {
    danger: {
      icon: '⚠️',
      iconBg: '#fee2e2',
      iconColor: '#ef4444',
      confirmBg: 'linear-gradient(145deg, #ef4444, #dc2626)',
      confirmHover: 'linear-gradient(145deg, #dc2626, #b91c1c)',
      shadow: '0 5px 15px rgba(239, 68, 68, 0.3)',
    },
    warning: {
      icon: '⚠️',
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      confirmBg: 'linear-gradient(145deg, #f59e0b, #d97706)',
      confirmHover: 'linear-gradient(145deg, #d97706, #b45309)',
      shadow: '0 5px 15px rgba(245, 158, 11, 0.3)',
    },
    info: {
      icon: 'ℹ️',
      iconBg: '#e4f4fc',
      iconColor: '#609abb',
      confirmBg: 'linear-gradient(145deg, #609abb, #5d7a90)',
      confirmHover: 'linear-gradient(145deg, #5d7a90, #051b3a)',
      shadow: '0 5px 15px rgba(96, 154, 187, 0.3)',
    },
    success: {
      icon: '✅',
      iconBg: '#d1fae5',
      iconColor: '#10b981',
      confirmBg: 'linear-gradient(145deg, #10b981, #059669)',
      confirmHover: 'linear-gradient(145deg, #059669, #047857)',
      shadow: '0 5px 15px rgba(16, 185, 129, 0.3)',
    },
  }
  return configs[props.type || 'info']
})
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="emit('cancel')">
      <div class="modal-container">
        <div class="modal-header">
          <div
            class="icon-container"
            :style="{ backgroundColor: config.iconBg, color: config.iconColor }"
          >
            <span class="icon-emoji">{{ config.icon }}</span>
          </div>
          <button @click="emit('cancel')" class="close-btn" title="Cerrar">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <h3>{{ title }}</h3>
          <p>{{ message }}</p>
        </div>

        <div class="modal-footer">
          <button @click="emit('cancel')" class="btn btn-cancel">
            <span class="btn-icon">✕</span>
            {{ cancelTextDefault }}
          </button>
          <button
            @click="emit('confirm')"
            class="btn btn-confirm"
            :style="{
              '--confirm-bg': config.confirmBg,
              '--confirm-hover': config.confirmHover,
              boxShadow: config.shadow,
            }"
          >
            <span class="btn-icon">{{
              type === 'danger' ? '🗑️' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : '✓'
            }}</span>
            {{ confirmTextDefault }}
          </button>
        </div>

        <!-- Decoración inferior -->
        <div class="modal-footer-decoration" :style="{ background: config.iconColor }"></div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(5, 27, 58, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 25px 50px -12px rgba(5, 27, 58, 0.25);
  overflow: hidden;
  animation: modalAppear 0.3s ease;
}

@keyframes modalAppear {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 1.5rem 1.5rem 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
}

.icon-container {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.1);
}

.icon-emoji {
  font-size: 2.5rem;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: #e4f4fc;
  color: #609abb;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: #609abb;
  color: white;
  transform: rotate(90deg);
}

.icon {
  width: 18px;
  height: 18px;
}

.modal-body {
  padding: 1.5rem;
  text-align: center;
}

.modal-body h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: #051b3a;
  margin: 0 0 0.5rem 0;
}

.modal-body p {
  font-size: 0.95rem;
  color: #5d7a90;
  margin: 0;
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-icon {
  font-size: 1rem;
}

.btn-cancel {
  background: #e4f4fc;
  color: #5d7a90;
  border: 2px solid #b4cbd8;
}

.btn-cancel:hover {
  background: #b4cbd8;
  color: #051b3a;
  transform: translateY(-2px);
}

.btn-cancel:active {
  transform: translateY(0);
}

.btn-confirm {
  color: white;
  transition: all 0.3s ease;
  background: var(--confirm-bg, linear-gradient(145deg, #609abb, #5d7a90));
}

.btn-confirm:hover {
  background: var(--confirm-hover, linear-gradient(145deg, #5d7a90, #051b3a));
  transform: translateY(-2px);
}

.btn-confirm:active {
  transform: translateY(0);
}

/* Decoración inferior */
.modal-footer-decoration {
  height: 4px;
  width: 100%;
  transition: background-color 0.3s ease;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9) translateY(20px);
}

/* Responsive */
@media (max-width: 480px) {
  .modal-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .icon-container {
    width: 60px;
    height: 60px;
  }

  .icon-emoji {
    font-size: 2rem;
  }

  .modal-body h3 {
    font-size: 1.2rem;
  }

  .modal-body p {
    font-size: 0.9rem;
  }
}

/* Soporte para modo oscuro */
@media (prefers-color-scheme: dark) {
  .modal-container {
    background: #1a2634;
  }

  .modal-body h3 {
    color: #e4f4fc;
  }

  .modal-body p {
    color: #b4cbd8;
  }

  .btn-cancel {
    background: #2a3644;
    color: #b4cbd8;
    border-color: #3a4654;
  }

  .btn-cancel:hover {
    background: #3a4654;
    color: #e4f4fc;
  }

  .close-btn {
    background: #2a3644;
    color: #b4cbd8;
  }

  .close-btn:hover {
    background: #609abb;
    color: white;
  }
}
</style>
