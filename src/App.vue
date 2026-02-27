<template>
  <div id="app" class="h-screen flex overflow-hidden">
    <NavbarComponent v-if="shouldShowNavbar" @sidebar-toggle="onSidebarToggle" />

    <main :class="['flex-1 transition-all duration-300 overflow-auto', mainContentMarginClass]">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import NavbarComponent from '@/components/NavbarComponent.vue'

const route = useRoute()

const shouldShowNavbar = computed(() => {
  return route.meta.requiresAuth === true
})

// Estado del sidebar
const sidebarMinimized = ref(false)

// Escuchar cambios del sidebar
const onSidebarToggle = (isMinimized: boolean) => {
  sidebarMinimized.value = isMinimized
}

// Computed que calcula la clase de margin-left para el contenedor principal
const mainContentMarginClass = computed(() => {
  if (!shouldShowNavbar.value) return 'ml-0'
  return sidebarMinimized.value ? 'ml-20' : 'ml-64'
})
</script>
