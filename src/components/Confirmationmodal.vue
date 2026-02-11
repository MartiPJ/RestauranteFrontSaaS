<!-- src/components/ConfirmationModal.vue -->
<script setup lang="ts">
const props = defineProps<{
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const confirmTextDefault = props.confirmText || 'Confirmar'
const cancelTextDefault = props.cancelText || 'Cancelar'
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click.self="emit('cancel')">
      <div class="modal-container">
        <div class="modal-header">
          <div :class="['icon-container', type || 'warning']">
            <svg
              v-if="type === 'danger'"
              class="icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <svg v-else class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <div class="modal-body">
          <h3>{{ title }}</h3>
          <p>{{ message }}</p>
        </div>

        <div class="modal-footer">
          <button @click="emit('cancel')" class="btn btn-cancel">
            {{ cancelTextDefault }}
          </button>
          <button @click="emit('confirm')" :class="['btn', 'btn-confirm', type || 'warning']">
            {{ confirmTextDefault }}
          </button>
        </div>
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 24px 24px 0 24px;
  display: flex;
  justify-content: center;
}

.icon-container {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-container.danger {
  background-color: #fee2e2;
  color: #ef4444;
}

.icon-container.warning {
  background-color: #fef3c7;
  color: #f59e0b;
}

.icon-container.info {
  background-color: #dbeafe;
  color: #3b82f6;
}

.icon {
  width: 36px;
  height: 36px;
}

.modal-body {
  padding: 24px;
  text-align: center;
}

.modal-body h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 12px 0;
}

.modal-body p {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px 24px;
}

.btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background-color: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background-color: #e5e7eb;
}

.btn-confirm {
  color: white;
}

.btn-confirm.danger {
  background-color: #ef4444;
}

.btn-confirm.danger:hover {
  background-color: #dc2626;
}

.btn-confirm.warning {
  background-color: #f59e0b;
}

.btn-confirm.warning:hover {
  background-color: #d97706;
}

.btn-confirm.info {
  background-color: #3b82f6;
}

.btn-confirm.info:hover {
  background-color: #2563eb;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.9);
}
</style>
