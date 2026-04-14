<template>
  <!-- MODO MÓVIL — Botón hamburguesa flotante -->
  <template v-if="isMobile">
    <!-- Botón flotante -->
    <button
      v-if="!mobileMenuOpen"
      @click="mobileMenuOpen = true"
      class="fixed top-4 left-4 z-[60] w-11 h-11 bg-[#609abb] hover:bg-[#5d7a90] text-white rounded-xl shadow-lg flex items-center justify-center transition-colors"
      type="button"
      aria-label="Abrir menú"
    >
      <!-- Ícono hamburguesa / X -->
      <svg
        v-if="!mobileMenuOpen"
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
      <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>

    <!-- Backdrop -->
    <transition name="fade">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 bg-black/50 z-[55]"
        @click="mobileMenuOpen = false"
      />
    </transition>

    <!-- Drawer lateral -->
    <transition name="slide">
      <aside
        v-if="mobileMenuOpen"
        class="fixed left-0 top-0 h-screen w-72 bg-gradient-to-b from-[#609abb] to-[#5d7a90] text-white z-[58] flex flex-col shadow-2xl"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-4 border-b border-white/20 min-h-[80px]">
          <div class="flex items-center gap-3">
            <div
              @click="goToDashboard"
              class="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-[#609abb] cursor-pointer hover:opacity-90 transition-opacity shadow-md"
            >
              <img :src="logoPlato" alt="Logo" class="w-6 h-6 object-contain" />
            </div>
            <span
              @click="goToDashboard"
              class="text-sm font-bold whitespace-nowrap cursor-pointer hover:opacity-90 transition-opacity"
            >
              FromScratch POS
            </span>
          </div>
          <button
            @click="mobileMenuOpen = false"
            class="p-2 hover:bg-white/10 rounded-lg transition-colors"
            type="button"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Nav (reutilizamos la misma lógica) -->
        <nav class="flex-1 overflow-y-auto py-5" role="navigation">
          <div class="px-4 mb-3">
            <button @click="mobileItemClick('/dashboard')" class="w-full" type="button">
              <div
                class="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors rounded-lg"
                :class="isActive('/dashboard') ? 'bg-[#051b3a] border-r-4 border-[#e4f4fc]' : ''"
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
                  />
                </svg>
                <span class="text-sm font-medium">Dashboard</span>
              </div>
            </button>
          </div>

          <div v-for="section in filteredMenu" :key="section.id" class="px-4 mb-3">
            <button
              class="w-full flex items-center justify-between gap-3 px-2 py-1 mb-2 hover:bg-white/5 rounded"
              @click="toggleSection(section.id)"
              type="button"
            >
              <div class="flex items-center gap-3">
                <span v-if="isInlineSvg(section.svg)" v-html="section.svg" class="flex-shrink-0" />
                <img
                  v-else-if="section.svg"
                  :src="section.svg"
                  class="w-5 h-5 flex-shrink-0 object-contain"
                  :alt="section.label"
                />
                <span class="text-xs font-semibold text-white/90 uppercase">{{
                  section.label
                }}</span>
              </div>
              <svg
                :class="open[section.id] ? 'rotate-90' : ''"
                class="w-4 h-4 transform transition-transform"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 6l6 6-6 6"
                />
              </svg>
            </button>

            <transition name="accordion" appear>
              <div v-show="open[section.id]" class="space-y-1">
                <template v-if="section.items">
                  <button
                    v-for="item in section.items"
                    :key="item.id"
                    @click="mobileItemClick(item.path)"
                    class="w-full"
                    type="button"
                  >
                    <div
                      class="w-full flex items-center gap-3 px-4 pl-10 py-3 hover:bg-white/10 transition-colors rounded-lg"
                      :class="isActive(item.path) ? 'bg-[#051b3a] border-r-4 border-[#e4f4fc]' : ''"
                    >
                      <span
                        v-if="item.svg && isInlineSvg(item.svg)"
                        v-html="item.svg"
                        class="flex-shrink-0"
                      />
                      <img
                        v-else-if="item.svg"
                        :src="item.svg"
                        class="w-6 h-6 flex-shrink-0 object-contain"
                        :alt="item.label"
                      />
                      <span class="text-sm truncate">{{ item.label }}</span>
                    </div>
                  </button>
                </template>
              </div>
            </transition>
          </div>
        </nav>

        <!-- Footer logout -->
        <div class="border-t border-white/20 p-4">
          <button
            @click="handleLogout"
            class="w-full flex items-center gap-3 px-5 py-4 bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-md"
            type="button"
          >
            <svg
              class="w-6 h-6 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span class="text-base font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </transition>
  </template>

  <!-- ═══════════════════════════════════════════
       MODO DESKTOP — Sidebar original sin cambios
  ════════════════════════════════════════════ -->
  <aside
    v-else
    :class="[
      'fixed left-0 top-0 h-screen bg-gradient-to-b from-[#609abb] to-[#5d7a90] text-white transition-all duration-300 ease-in-out z-50 flex flex-col shadow-2xl',
      open.ui.isMinimized ? 'w-23' : 'w-64',
    ]"
  >
    <!-- Header con Logo y Toggle -->
    <div class="flex items-center justify-between p-4 border-b border-white/20 min-h-[80px]">
      <div class="flex items-center gap-3">
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
          FromScratch POS
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
    <nav class="flex-1 overflow-y-auto py-5" role="navigation" aria-label="Main Navigation">
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
              />
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

      <div v-for="section in filteredMenu" :key="section.id" class="px-4 mb-3">
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
              <span v-if="isInlineSvg(section.svg)" v-html="section.svg" class="flex-shrink-0" />
              <img
                v-else-if="section.svg"
                :src="section.svg"
                class="w-5 h-5 flex-shrink-0 object-contain"
                :alt="section.label"
              />
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

          <!-- Tooltip minimizado -->
          <div
            v-if="open.ui.isMinimized"
            class="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-white text-gray-800 text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-gray-200"
          >
            {{ section.label }}
            <div
              class="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-white"
            />
          </div>
        </div>

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
                    <span
                      v-if="item.svg && isInlineSvg(item.svg)"
                      v-html="item.svg"
                      class="flex-shrink-0"
                    />
                    <img
                      v-else-if="item.svg"
                      :src="item.svg"
                      :class="[
                        'flex-shrink-0 object-contain transition-all',
                        open.ui.isMinimized ? 'w-8 h-8' : 'w-10 h-10',
                      ]"
                      :alt="item.label"
                    />
                    <span
                      v-if="!open.ui.isMinimized"
                      class="whitespace-nowrap text-sm truncate flex-1 min-w-0"
                      >{{ item.label }}</span
                    >
                    <span v-else class="sr-only">{{ item.label }}</span>
                  </div>
                </button>

                <div
                  v-if="open.ui.isMinimized"
                  class="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-white text-gray-800 text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-gray-200"
                >
                  {{ item.label }}
                  <div
                    class="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-white"
                  />
                </div>
              </div>
            </template>
          </div>
        </transition>
      </div>
    </nav>

    <!-- Footer Logout -->
    <div class="border-t border-white/20 p-4">
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
        <div
          v-if="open.ui.isMinimized"
          class="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 bg-white text-gray-800 text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-gray-200"
        >
          Cerrar Sesión
          <div
            class="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-white"
          />
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { menu } from '@/data/menu'
import logoPlato from '@/assets/images/LogoScratchcopia2..png'

const emit = defineEmits<{ (e: 'sidebar-toggle', isMinimized: boolean): void }>()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const currentPath = ref('')

// ── Detección de móvil ──────────────────────────────────────────
const isMobile = ref(window.innerWidth < 768)
const mobileMenuOpen = ref(false)

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
  // Al pasar a desktop, cerrar el drawer móvil
  if (!isMobile.value) mobileMenuOpen.value = false
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
// ───────────────────────────────────────────────────────────────

const goToDashboard = () => {
  navigateTo('/dashboard')
  mobileMenuOpen.value = false
}

const filteredMenu = computed(() => {
  const userRoles = authStore.userRoles || []
  return menu
    .map((section) => {
      if (!section.items) return section
      const items = section.items.filter((item) => {
        if (!item.allowedRoles || item.allowedRoles.length === 0) return true
        if (userRoles.length === 0) return false
        return item.allowedRoles.some((allowedRole) =>
          userRoles.some((userRole) => userRole.toLowerCase() === allowedRole.toLowerCase()),
        )
      })
      return { ...section, items }
    })
    .filter((s) => !(s.items && s.items.length === 0))
})

const isInlineSvg = (icon: string | undefined): boolean => {
  if (!icon) return false
  return (
    icon.includes('<svg') &&
    !icon.includes('.png') &&
    !icon.includes('.jpg') &&
    !icon.includes('.svg') &&
    !icon.startsWith('/')
  )
}

const isActive = (path: string | undefined) => {
  if (!path) return false
  return currentPath.value === path || currentPath.value.startsWith(path + '/')
}

interface OpenState {
  ui: { isMinimized: boolean }
  [key: string]: boolean | { isMinimized: boolean }
}

const open = reactive<OpenState>({
  ui: { isMinimized: window.innerWidth < 768 },
  operations: false,
  catalog: false,
})

const prevSubs = ref<Record<string, boolean> | null>(null)

onMounted(() => {
  if (route.path === '/dashboard') closeAllSections()

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

  currentPath.value = route.path
  emit('sidebar-toggle', isMobile.value ? false : open.ui.isMinimized)

  if (open.ui.isMinimized) closeAllTemporary()
})

const closeAllSections = () => {
  open.operations = false
  open.catalog = false
}
const closeAllTemporary = () => {
  open.operations = false
  open.catalog = false
}

const toggleSidebar = () => {
  open.ui.isMinimized = !open.ui.isMinimized
  if (open.ui.isMinimized) {
    prevSubs.value = { operations: open.operations as boolean, catalog: open.catalog as boolean }
    closeAllTemporary()
  } else {
    if (prevSubs.value) {
      open.operations = !!prevSubs.value.operations
      open.catalog = !!prevSubs.value.catalog
      prevSubs.value = null
    }
  }
  emit('sidebar-toggle', open.ui.isMinimized)
}

const toggleSection = (sectionId: string) => {
  const mainSections = ['operations', 'catalog']
  if (!open[sectionId]) {
    mainSections.forEach((k) => (open[k] = k === sectionId))
  } else {
    open[sectionId] = false
  }
}

const navigateTo = (path?: string) => {
  if (!path) {
    alert('Ruta inválida')
    return
  }
  router.push(path).catch((err) => console.warn('Error navegando', err))
}

// Click en desktop: navega y auto-minimiza
const itemClick = (path?: string) => {
  if (!path) {
    alert('Funcionalidad próximamente disponible')
    return
  }
  navigateTo(path)
  if (!open.ui.isMinimized) toggleSidebar()
}

// Click en móvil: navega y cierra el drawer
const mobileItemClick = (path?: string) => {
  if (!path) {
    alert('Funcionalidad próximamente disponible')
    return
  }
  navigateTo(path)
  mobileMenuOpen.value = false
}

watch(
  () => route.path,
  (newPath) => {
    currentPath.value = newPath
    if (newPath === '/dashboard') closeAllSections()
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

// Cuando cambia isMobile, emitir el estado correcto a App.vue
watch(isMobile, (mobile) => {
  // En móvil no hay sidebar fijo, App.vue no debe añadir margin
  emit('sidebar-toggle', mobile ? false : open.ui.isMinimized)
})

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

button svg.transform {
  transition: transform 200ms ease;
}

aside svg {
  color: white;
}

nav::-webkit-scrollbar {
  display: none;
}
nav {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Animación del drawer móvil */
.slide-enter-active,
.slide-leave-active {
  transition: transform 280ms cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

/* Animación del backdrop */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 250ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
