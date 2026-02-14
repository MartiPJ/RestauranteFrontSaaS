<template>
  <!-- Sidebar -->
  <aside
    :class="[
      'fixed left-0 top-0 h-screen bg-gradient-to-b from-[#609abb] to-[#5d7a90] text-white transition-all duration-300 ease-in-out z-50 flex flex-col shadow-2xl',
      open.ui.isMinimized ? 'w-20' : 'w-64',
    ]"
  >
    <!-- Header con Logo y Toggle -->
    <div class="flex items-center justify-between p-4 border-b border-white/20 min-h-[80px]">
      <div class="flex items-center gap-3">
        <!-- Logo cuando está expandido -->
        <div
          v-if="!open.ui.isMinimized"
          @click="navigateTo('/dashboard')"
          class="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-[#609abb] cursor-pointer hover:opacity-90 transition-opacity shadow-md"
        >
          <img :src="logoPlato" alt="Logo" class="w-6 h-6 object-contain" />
        </div>

        <span
          v-show="!open.ui.isMinimized"
          @click="navigateTo('/dashboard')"
          class="text-sm font-bold whitespace-nowrap cursor-pointer hover:opacity-90 transition-opacity"
        >
          MI RESTAURANTE
        </span>
      </div>
      <button
        @click="toggleSidebar"
        class="p-2 hover:bg-white/10 rounded-lg transition-colors"
        :class="{ 'mx-auto': open.ui.isMinimized }"
        aria-label="Toggle sidebar"
        type="button"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 overflow-y-auto py-4" role="navigation" aria-label="Main Navigation">
      <!-- Enlace a Dashboard -->
      <div class="px-4 mb-3">
        <button @click="itemClick('/dashboard')" class="w-full" type="button">
          <div
            class="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors flex-nowrap whitespace-nowrap rounded-lg"
            :class="[
              open.ui.isMinimized ? 'justify-center' : '',
              isActive('/dashboard') ? 'bg-[#051b3a] border-r-4 border-[#e4f4fc]' : '',
            ]"
          >
            <svg
              class="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              ></path>
            </svg>
            <span
              v-if="!open.ui.isMinimized"
              class="whitespace-nowrap text-sm truncate flex-1 min-w-0 font-medium"
              >Dashboard</span
            >
            <span v-else class="sr-only">Dashboard</span>
          </div>
        </button>
      </div>

      <!-- Renderizamos secciones con v-for -->
      <div v-for="section in menu" :key="section.id" class="px-4 mb-3">
        <!-- Botón sección con globo flotante -->
        <div class="relative group">
          <button
            :id="`btn-${section.id}`"
            class="w-full flex items-center justify-between gap-3 px-2 py-1 mb-2 hover:bg-white/5 rounded flex-nowrap whitespace-nowrap"
            @click="toggleSection(section.id)"
            :aria-expanded="open[section.id] as boolean"
            :aria-controls="`panel-${section.id}`"
            type="button"
          >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <span v-html="section.svg" class="flex-shrink-0"></span>
              <span
                v-show="!open.ui.isMinimized"
                class="text-xs font-semibold text-white/90 uppercase truncate"
                >{{ section.label }}</span
              >
            </div>

            <svg
              v-show="!open.ui.isMinimized"
              :class="open[section.id] ? 'rotate-90' : ''"
              class="w-4 h-4 transform transition-transform self-center flex-shrink-0 ml-2"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 6l6 6-6 6"
              />
            </svg>
          </button>

          <!-- Globo flotante para secciones en modo minimizado -->
          <div
            v-if="open.ui.isMinimized"
            class="absolute left-full ml-3 px-3 py-2 bg-white text-gray-800 text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-gray-200 transform group-hover:scale-100 scale-95"
          >
            {{ section.label }}
            <!-- Punta del globo -->
            <div
              class="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-white"
            ></div>
          </div>
        </div>

        <!-- Panel de sección -->
        <transition name="accordion" appear>
          <div
            v-show="open[section.id]"
            :id="`panel-${section.id}`"
            role="region"
            :aria-labelledby="`btn-${section.id}`"
            class="space-y-1"
          >
            <template v-if="section.items">
              <div v-for="item in section.items" :key="item.id" class="relative group">
                <button @click="itemClick(item.path)" class="w-full" type="button">
                  <div
                    class="w-full flex items-center gap-3 py-3 hover:bg-white/10 transition-colors flex-nowrap whitespace-nowrap rounded-lg"
                    :class="[
                      open.ui.isMinimized ? 'justify-center px-4' : 'px-4 pl-10',
                      isActive(item.path) ? 'bg-[#051b3a] border-r-4 border-[#e4f4fc]' : '',
                    ]"
                  >
                    <span v-if="item.svg" v-html="item.svg" class="flex-shrink-0"></span>
                    <span
                      v-if="!open.ui.isMinimized"
                      class="whitespace-nowrap text-sm truncate flex-1 min-w-0"
                      >{{ item.label }}</span
                    >
                    <span v-else class="sr-only">{{ item.label }}</span>
                  </div>
                </button>

                <!-- Globo flotante para items en modo minimizado -->
                <div
                  v-if="open.ui.isMinimized"
                  class="absolute left-full ml-3 px-3 py-2 bg-white text-gray-800 text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-gray-200 transform group-hover:scale-100 scale-95"
                >
                  {{ item.label }}
                  <!-- Punta del globo -->
                  <div
                    class="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-white"
                  ></div>
                </div>
              </div>
            </template>
          </div>
        </transition>
      </div>
    </nav>

    <!-- Footer con Cerrar Sesión -->
    <div class="border-t border-white/20 p-4">
      <!-- Cerrar Sesión con globo flotante -->
      <div class="relative group">
        <button
          @click="handleLogout"
          :class="[
            'w-full flex items-center gap-3 px-5 py-4 bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-md',
            open.ui.isMinimized ? 'justify-center' : '',
          ]"
          type="button"
        >
          <svg class="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span v-show="!open.ui.isMinimized" class="whitespace-nowrap text-base font-medium"
            >Cerrar Sesión</span
          >
        </button>

        <!-- Globo flotante para Cerrar Sesión en modo minimizado -->
        <div
          v-if="open.ui.isMinimized"
          class="absolute left-full ml-3 px-3 py-2 bg-white text-gray-800 text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-gray-200 transform group-hover:scale-100 scale-95"
        >
          Cerrar Sesión
          <!-- Punta del globo -->
          <div
            class="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-white"
          ></div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { menu } from '@/data/menu'
import logoPlato from '@/assets/images/LogoScratchcopia2..png'

/** Emitimos el estado del sidebar para que App.vue lo ajuste */
const emit = defineEmits<{ (e: 'sidebar-toggle', isMinimized: boolean): void }>()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Estado reactivo para trackear la ruta actual
const currentPath = ref('')

// Función para verificar si un item está activo
const isActive = (path: string | undefined) => {
  if (!path) return false

  return currentPath.value === path || currentPath.value.startsWith(path + '/')
}

/**
 * Estructura reactiva 'open' para todo el estado del sidebar/acordeones.
 */
interface OpenState {
  ui: { isMinimized: boolean }
  [key: string]: boolean | { isMinimized: boolean }
}

const open = reactive<OpenState>({
  // Responsive: Iniciar minimizado si la pantalla es < 768px
  ui: { isMinimized: window.innerWidth < 768 },
  // Secciones principales (por defecto cerradas)
  operations: false,
  catalog: false,
})

// Snapshot temporal pre-minimizado
const prevSubs = ref<Record<string, boolean> | null>(null)

onMounted(() => {
  // si estamos en dashboard, cerrar todo
  if (route.path === '/dashboard') {
    closeAllSections()
  }

  // detectar ruta activa y abrir padre correspondiente
  if (
    route.path.startsWith('/Orders') ||
    route.path.startsWith('/Kitchen') ||
    route.path.startsWith('/Invoices') ||
    route.path.startsWith('/tables')
  ) {
    open.operations = true
  } else if (route.path.startsWith('/Categories') || route.path.startsWith('/Products')) {
    open.catalog = true
  }

  // Actualizar la ruta actual
  currentPath.value = route.path

  // Emitimos estado inicial del sidebar
  emit('sidebar-toggle', open.ui.isMinimized)

  // Si el estado inicial es minimizado, cerrar todo temporalmente
  if (open.ui.isMinimized) {
    closeAllTemporary()
  }
})

/** cerrar todo (sin persistir) */
const closeAllSections = () => {
  open.operations = false
  open.catalog = false
}

/** cerrar todos temporalmente (sin persistir) — usado al minimizar */
const closeAllTemporary = () => {
  open.operations = false
  open.catalog = false
}

/** Toggle sidebar (minimizar / desminimizar) */
const toggleSidebar = () => {
  open.ui.isMinimized = !open.ui.isMinimized

  if (open.ui.isMinimized) {
    // guardar snapshot pre-minimizado
    prevSubs.value = {
      operations: open.operations as boolean,
      catalog: open.catalog as boolean,
    }
    closeAllTemporary()
  } else {
    // al desminimizar restoramos snapshot si existe
    if (prevSubs.value) {
      open.operations = !!prevSubs.value.operations
      open.catalog = !!prevSubs.value.catalog
      prevSubs.value = null
    }
  }

  // Emitimos cada vez que cambia
  emit('sidebar-toggle', open.ui.isMinimized)
}

/** Toggle sección principal
 *  Al abrir una sección se cierran las demás.
 */
const toggleSection = (sectionId: string) => {
  const mainSections = ['operations', 'catalog']
  if (!open[sectionId]) {
    mainSections.forEach((k) => (open[k] = k === sectionId))
  } else {
    open[sectionId] = false
  }
}

/** Navegación segura con manejo de errores */
const navigateTo = (path?: string) => {
  if (!path) {
    alert('Ruta inválida')
    return
  }

  router.push(path).catch((err) => {
    console.warn('Error navegando', err)
  })
}

/** Cuando se hace click en un item - AUTO MINIMIZAR SIDEBAR */
const itemClick = (path?: string) => {
  if (!path) {
    alert('Funcionalidad próximamente disponible')
    return
  }

  navigateTo(path)

  // Auto-minimizar el sidebar al seleccionar una ruta
  if (!open.ui.isMinimized) {
    toggleSidebar()
  }
}

/** Watcher para actualizar la ruta actual cuando cambie */
watch(
  () => route.path,
  (newPath) => {
    currentPath.value = newPath

    // Si navegamos al dashboard, cerrar todos
    if (newPath === '/dashboard') {
      closeAllSections()
    }

    // Detectar ruta activa y abrir sección correspondiente automáticamente
    if (
      newPath.startsWith('/Orders') ||
      newPath.startsWith('/Kitchen') ||
      newPath.startsWith('/Invoices') ||
      newPath.startsWith('/tables')
    ) {
      open.operations = true
    } else if (newPath.startsWith('/Categories') || newPath.startsWith('/Products')) {
      open.catalog = true
    }
  },
  { immediate: true },
)

/** Logout */
const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    router.push('/login')
  }
}
</script>

<style scoped>
/* transición suave para acordeones */
.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 240ms ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  max-height: 800px;
}

/* transición suave para rotación del ícono */
button svg.transform {
  transition: transform 200ms ease;
}

/* Ocultar scrollbar en el nav */
nav::-webkit-scrollbar {
  display: none;
}

nav {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
