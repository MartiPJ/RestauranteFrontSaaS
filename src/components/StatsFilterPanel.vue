<!-- src/components/StatsFiltersPanel.vue -->
<!--
  StatsFiltersPanel — Panel colapsable de estadísticas y filtros

  Props:
    stats: StatCard[]       — Tarjetas de estadísticas
    filters: FilterOption[] — Botones de filtro (opcional)
    modelValue: string      — Filtro activo actual (v-model)
    searchQuery: string     — Texto de búsqueda (v-model:searchQuery)
    searchPlaceholder: str  — Placeholder del input de búsqueda
    showSearch: boolean     — Mostrar/ocultar la caja de búsqueda (default: true)
    showFilters: boolean    — Mostrar/ocultar los botones de filtro (default: true)

  Emits:
    update:modelValue       — Cuando cambia el filtro activo
    update:searchQuery      — Cuando cambia el texto de búsqueda

  Tipos:
    StatCard  { icon, value, label, colorKey }
    FilterOption { value, label, colorKey, dot? }

  colorKey disponibles para stat-card y filter-btn:
    'default' | 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'orange'

  Uso básico (TablesView):

    <StatsFiltersPanel
      :stats="statsData"
      :filters="filterOptions"
      v-model="filterStatus"
      v-model:searchQuery="searchQuery"
      search-placeholder="Buscar por número de mesa..."
    />
-->

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { StatCard, FilterOption } from '../types/statsFilter'

// ─── Props ──────────────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    stats?: StatCard[]
    filters?: FilterOption[]
    modelValue?: string
    searchQuery?: string
    searchPlaceholder?: string
    showSearch?: boolean
    showFilters?: boolean
  }>(),
  {
    stats: () => [],
    filters: () => [],
    modelValue: 'all',
    searchQuery: '',
    searchPlaceholder: 'Buscar...',
    showSearch: true,
    showFilters: true,
  },
)

// ─── Emits ──────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:searchQuery': [value: string]
}>()

// ─── Slots ──────────────────────────────────────────────────────────────────

defineSlots<{
  between(): any
  extra(): any
}>()

// ─── Estado de colapso ──────────────────────────────────────────────────────

/**
 * Determina si el panel está expandido.
 * En desktop (≥ 1024px) inicia abierto; en mobile/tablet inicia cerrado.
 */
const isMobile = () => window.innerWidth < 1024

const isExpanded = ref(!isMobile())

function togglePanel() {
  isExpanded.value = !isExpanded.value
}

// Cuando se redimensiona la ventana, reseteamos el estado inicial apropiado
// sólo si el usuario no ha interactuado manualmente (tracked por userToggled).
const userToggled = ref(false)

function handleResize() {
  if (!userToggled.value) {
    isExpanded.value = !isMobile()
  }
}

function handleToggle() {
  userToggled.value = true
  togglePanel()
}

onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

// ─── Helpers ────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  default: '#609abb',
  green: '#10b981',
  red: '#ef4444',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  orange: '#f97316',
}

function colorVar(key?: string): string {
  const normalizedKey = (key?.trim() || 'default') as keyof typeof COLOR_MAP
  const value = COLOR_MAP[normalizedKey]
  return value !== undefined ? value : (COLOR_MAP['default'] as string)
}
</script>

<template>
  <div class="sfp-wrapper">
    <!-- ── Cabecera del panel con botón toggle ──────────────────────── -->
    <div class="sfp-toggle-bar" @click="handleToggle" role="button" :aria-expanded="isExpanded">
      <div class="sfp-toggle-left">
        <span class="sfp-toggle-icon">{{ isExpanded ? '📊' : '🔍' }}</span>
        <span class="sfp-toggle-label">
          {{ isExpanded ? 'Estadísticas y filtros' : 'Mostrar estadísticas y filtros' }}
        </span>

        <!-- Resumen compacto cuando está colapsado -->
        <div v-if="!isExpanded && stats.length" class="sfp-collapsed-summary">
          <span
            v-for="stat in stats.slice(0, 3)"
            :key="stat.label"
            class="sfp-mini-stat"
            :style="{ '--sfp-mini-color': colorVar(stat.colorKey) }"
          >
            {{ stat.icon }} <strong>{{ stat.value }}</strong>
            <span class="sfp-mini-label">{{ stat.label }}</span>
          </span>
          <span v-if="stats.length > 3" class="sfp-mini-more">+{{ stats.length - 3 }} más</span>
        </div>
      </div>

      <button class="sfp-chevron-btn" :class="{ expanded: isExpanded }" tabindex="-1">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>

    <!-- ── Contenido colapsable ─────────────────────────────────────── -->
    <Transition name="sfp-slide">
      <div v-show="isExpanded" class="sfp-body">
        <!-- Tarjetas de estadísticas -->
        <div v-if="stats.length" class="sfp-stats-grid">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="sfp-stat-card"
            :style="{ '--sfp-accent': colorVar(stat.colorKey) }"
          >
            <div class="sfp-stat-icon">{{ stat.icon }}</div>
            <div class="sfp-stat-content">
              <div class="sfp-stat-value">{{ stat.value }}</div>
              <div class="sfp-stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>

        <!-- Slot para contenido extra entre stats y filtros -->
        <slot name="between" />

        <!-- Sección de búsqueda y filtros -->
        <div v-if="showSearch || (showFilters && filters.length)" class="sfp-filters-bar">
          <!-- Búsqueda -->
          <div v-if="showSearch" class="sfp-search-box">
            <svg class="sfp-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              :value="searchQuery"
              @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
              type="text"
              :placeholder="searchPlaceholder"
              class="sfp-search-input"
            />
            <button
              v-if="searchQuery"
              class="sfp-search-clear"
              @click.stop="emit('update:searchQuery', '')"
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          </div>

          <!-- Botones de filtro -->
          <div v-if="showFilters && filters.length" class="sfp-filter-buttons">
            <button
              v-for="filter in filters"
              :key="filter.value"
              class="sfp-filter-btn"
              :class="{ active: modelValue === filter.value }"
              :style="{
                '--sfp-filter-color': colorVar(filter.colorKey),
              }"
              @click="emit('update:modelValue', filter.value)"
            >
              <span
                v-if="filter.dot !== false"
                class="sfp-filter-dot"
                :style="{ background: colorVar(filter.colorKey) }"
              ></span>
              {{ filter.label }}
            </button>
          </div>
        </div>

        <!-- Slot para contenido extra al final del panel -->
        <slot name="extra" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ── Wrapper ──────────────────────────────────────────────────────────────── */
.sfp-wrapper {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  border: 1px solid rgba(96, 154, 187, 0.12);
  margin-bottom: 1.5rem;
  transition: box-shadow 0.3s ease;
}

.sfp-wrapper:hover {
  box-shadow: 0 8px 24px rgba(5, 27, 58, 0.08);
}

/* ── Barra de toggle ──────────────────────────────────────────────────────── */
.sfp-toggle-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
  gap: 1rem;
}

.sfp-toggle-bar:hover {
  background: #f8fcff;
}

.sfp-toggle-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.sfp-toggle-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.sfp-toggle-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #5d7a90;
  white-space: nowrap;
}

/* Resumen compacto (visible cuando colapsado) */
.sfp-collapsed-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.sfp-mini-stat {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  color: #5d7a90;
  background: #e4f4fc;
  padding: 0.2rem 0.7rem;
  border-radius: 30px;
  border-left: 3px solid var(--sfp-mini-color, #609abb);
}

.sfp-mini-stat strong {
  color: #051b3a;
  font-weight: 700;
}

.sfp-mini-label {
  color: #5d7a90;
  font-size: 0.75rem;
}

.sfp-mini-more {
  font-size: 0.78rem;
  color: #609abb;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  background: rgba(96, 154, 187, 0.1);
  border-radius: 30px;
}

/* Botón chevron */
.sfp-chevron-btn {
  background: #e4f4fc;
  border: none;
  border-radius: 10px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #609abb;
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.sfp-chevron-btn svg {
  transition: transform 0.3s ease;
}

.sfp-chevron-btn.expanded svg {
  transform: rotate(180deg);
}

.sfp-chevron-btn:hover {
  background: #609abb;
  color: white;
}

/* ── Cuerpo colapsable ────────────────────────────────────────────────────── */
.sfp-body {
  padding: 0 1.5rem 1.5rem;
  border-top: 1px solid #e4f4fc;
}

/* ── Grid de estadísticas ─────────────────────────────────────────────────── */
.sfp-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 1rem;
  padding-top: 1.25rem;
  margin-bottom: 1.25rem;
}

.sfp-stat-card {
  background: #f8fcff;
  padding: 1.1rem 1.25rem;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  border: 1px solid rgba(96, 154, 187, 0.1);
  border-left: 4px solid var(--sfp-accent, #609abb);
  transition: all 0.25s ease;
}

.sfp-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(5, 27, 58, 0.08);
  background: white;
}

.sfp-stat-icon {
  font-size: 1.5rem;
  background: white;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(5, 27, 58, 0.06);
}

.sfp-stat-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #051b3a;
  line-height: 1.2;
  letter-spacing: -0.3px;
}

.sfp-stat-label {
  font-size: 0.78rem;
  color: #5d7a90;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-top: 0.1rem;
}

/* ── Barra de filtros y búsqueda ──────────────────────────────────────────── */
.sfp-filters-bar {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
  align-items: center;
}

/* Search box */
.sfp-search-box {
  position: relative;
  flex: 1;
  min-width: 220px;
}

.sfp-search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  width: 17px;
  height: 17px;
  color: #b4cbd8;
  pointer-events: none;
}

.sfp-search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 2.75rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  font-size: 0.92rem;
  transition: all 0.3s ease;
  background: #e4f4fc;
  color: #051b3a;
  box-sizing: border-box;
}

.sfp-search-input::placeholder {
  color: #b4cbd8;
}

.sfp-search-input:focus {
  outline: none;
  border-color: #609abb;
  background: white;
  box-shadow: 0 0 0 4px rgba(96, 154, 187, 0.1);
}

.sfp-search-clear {
  position: absolute;
  right: 11px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #b4cbd8;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px 7px;
  border-radius: 50%;
  transition: all 0.2s ease;
  line-height: 1;
}

.sfp-search-clear:hover {
  color: #609abb;
  background: rgba(96, 154, 187, 0.1);
}

/* Filter buttons */
.sfp-filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.sfp-filter-btn {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.1rem;
  border: 2px solid #e4f4fc;
  background: white;
  border-radius: 30px;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  color: #5d7a90;
  white-space: nowrap;
}

.sfp-filter-btn:hover {
  border-color: var(--sfp-filter-color, #609abb);
  background: #e4f4fc;
  color: #051b3a;
}

.sfp-filter-btn.active {
  background: var(--sfp-filter-color, #609abb);
  color: white;
  border-color: var(--sfp-filter-color, #609abb);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--sfp-filter-color, #609abb) 35%, transparent);
}

.sfp-filter-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.sfp-filter-btn.active .sfp-filter-dot {
  background: rgba(255, 255, 255, 0.8) !important;
}

/* ── Transición de colapso ───────────────────────────────────────────────── */
.sfp-slide-enter-active,
.sfp-slide-leave-active {
  transition:
    max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.3s ease;
  overflow: hidden;
  max-height: 800px;
}

.sfp-slide-enter-from,
.sfp-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .sfp-toggle-bar {
    padding: 0.875rem 1.1rem;
  }

  .sfp-body {
    padding: 0 1.1rem 1.1rem;
  }

  .sfp-stats-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  .sfp-stat-card {
    padding: 0.875rem 1rem;
  }

  .sfp-stat-value {
    font-size: 1.3rem;
  }

  .sfp-filters-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.875rem;
  }

  .sfp-search-box {
    min-width: unset;
    width: 100%;
  }

  .sfp-filter-buttons {
    width: 100%;
    justify-content: flex-start;
  }

  .sfp-filter-btn {
    flex: 1;
    justify-content: center;
    min-width: 80px;
  }
}

@media (max-width: 480px) {
  .sfp-stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .sfp-mini-stat {
    display: none;
  }

  .sfp-mini-stat:first-child {
    display: flex;
  }
}
</style>
