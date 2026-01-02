<template>
  <div id="app">
    <!-- escuchamos el evento sidebar-toggle y actualizamos sidebarMinimized -->
    <NavbarComponent v-if="shouldShowNavbar" @sidebar-toggle="onSidebarToggle" />

    <!-- contenedor principal: aplicamos margin-left según estado del sidebar -->
    <div :class="['pt-16 px-16 min-h-screen transition-all duration-300', mainContentMarginClass]">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const shouldShowNavbar = computed(() => {
  const noNavbarRoutes = ['/login', '/admin-login', '/register', '/forbidden']
  const isNotFoundRoute = route.name === 'NotFound'
  return !noNavbarRoutes.includes(route.path) && !isNotFoundRoute
})

// Estado local que almacena si el sidebar está minimizado (true) o expandido (false)
const sidebarMinimized = ref(false)

// Handler del evento emitido por NavbarComponent
const onSidebarToggle = (isMinimized: boolean) => {
  sidebarMinimized.value = isMinimized
}

// Computed que calcula la clase de margin-left para el contenedor principal
const mainContentMarginClass = computed(() => {
  if (!shouldShowNavbar.value) return 'ml-0' // sin navbar -> sin margen
  return sidebarMinimized.value ? 'ml-20' : 'ml-64' // minimizado -> 5rem, expandido -> 16rem
})
</script>

<style>
/* Si quieres, puedes ajustar el breakpoint o el comportamiento en pantallas pequeñas aquí.
   Ejemplo: para pantallas pequeñas podrías usar media queries y dejar el navbar encima (overlay). */
</style>
