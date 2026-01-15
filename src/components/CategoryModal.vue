<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Category } from '@/types/category'

interface Props {
  show: boolean
  category?: Category | null
  mode: 'create' | 'edit'
}

interface Emits {
  (e: 'close'): void
  (
    e: 'save',
    data: {
      name: string
      description: string
      displayOrder: number
      isActive: boolean
    },
  ): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = ref({
  name: '',
  description: '',
  displayOrder: 1,
  isActive: true,
})

const errors = ref({
  name: '',
  description: '',
  displayOrder: '',
})

const title = computed(() => (props.mode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'))

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (props.category && props.mode === 'edit') {
        form.value = {
          name: props.category.name,
          description: props.category.description,
          displayOrder: props.category.displayOrder,
          isActive: props.category.isActive,
        }
      } else {
        resetForm()
      }
      resetErrors()
    }
  },
)

function resetForm() {
  form.value = {
    name: '',
    description: '',
    displayOrder: 1,
    isActive: true,
  }
}

function resetErrors() {
  errors.value = {
    name: '',
    description: '',
    displayOrder: '',
  }
}

function validate(): boolean {
  resetErrors()
  let isValid = true

  if (!form.value.name.trim()) {
    errors.value.name = 'El nombre es requerido'
    isValid = false
  }

  if (!form.value.description.trim()) {
    errors.value.description = 'La descripción es requerida'
    isValid = false
  }

  if (form.value.displayOrder < 1) {
    errors.value.displayOrder = 'El orden debe ser mayor a 0'
    isValid = false
  }

  return isValid
}

function handleSave() {
  if (validate()) {
    emit('save', { ...form.value })
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div
    v-if="show"
    style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    "
    @click.self="handleClose"
  >
    <div
      style="
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 500px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      "
    >
      <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #1f2937">
        {{ title }}
      </h2>

      <form @submit.prevent="handleSave">
        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151"
            >Nombre *</label
          >
          <input
            v-model="form.name"
            type="text"
            placeholder="Ej: Platos Principales"
            style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            "
            :style="errors.name ? 'border-color: #ef4444;' : ''"
          />
          <span
            v-if="errors.name"
            style="display: block; margin-top: 4px; font-size: 12px; color: #ef4444"
            >{{ errors.name }}</span
          >
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151"
            >Descripción *</label
          >
          <textarea
            v-model="form.description"
            placeholder="Describe la categoría..."
            rows="3"
            style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 14px;
              font-family: inherit;
              resize: vertical;
              box-sizing: border-box;
            "
            :style="errors.description ? 'border-color: #ef4444;' : ''"
          ></textarea>
          <span
            v-if="errors.description"
            style="display: block; margin-top: 4px; font-size: 12px; color: #ef4444"
            >{{ errors.description }}</span
          >
        </div>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151"
            >Orden de visualización *</label
          >
          <input
            v-model.number="form.displayOrder"
            type="number"
            min="1"
            style="
              width: 100%;
              padding: 10px 12px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 14px;
              box-sizing: border-box;
            "
            :style="errors.displayOrder ? 'border-color: #ef4444;' : ''"
          />
          <span
            v-if="errors.displayOrder"
            style="display: block; margin-top: 4px; font-size: 12px; color: #ef4444"
            >{{ errors.displayOrder }}</span
          >
        </div>

        <div style="margin-bottom: 24px">
          <label style="display: flex; align-items: center; cursor: pointer; user-select: none">
            <input
              v-model="form.isActive"
              type="checkbox"
              style="width: 18px; height: 18px; margin-right: 8px; cursor: pointer"
            />
            <span style="font-weight: 500; color: #374151">Categoría activa</span>
          </label>
        </div>

        <div style="display: flex; gap: 12px; justify-content: flex-end">
          <button
            type="button"
            @click="handleClose"
            style="
              padding: 10px 20px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              background: white;
              color: #374151;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
            "
            onmouseover="this.style.backgroundColor='#f3f4f6'"
            onmouseout="this.style.backgroundColor='white'"
          >
            Cancelar
          </button>
          <button
            type="submit"
            style="
              padding: 10px 20px;
              border: none;
              border-radius: 6px;
              background: #2563eb;
              color: white;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
            "
            onmouseover="this.style.backgroundColor='#1d4ed8'"
            onmouseout="this.style.backgroundColor='#2563eb'"
          >
            {{ mode === 'create' ? 'Crear' : 'Guardar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
