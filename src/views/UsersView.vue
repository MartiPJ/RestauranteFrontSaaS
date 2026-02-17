<template>
  <div class="users-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-header__left">
        <div class="page-header__icon">
          <span class="header-emoji">👥</span>
        </div>
        <div>
          <h1 class="page-title">Gestión de Usuarios</h1>
          <p class="page-subtitle">
            {{ usersStore.totalUsers }} usuario{{
              usersStore.totalUsers !== 1 ? 's' : ''
            }}
            registrado{{ usersStore.totalUsers !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>
      <button class="btn-create" @click="openCreate">
        <span class="btn-icon">➕</span>
        Nuevo Usuario
      </button>
    </div>

    <!-- Error Banner -->
    <Transition name="slide-down">
      <div v-if="usersStore.error" class="error-banner">
        <span class="error-icon">⚠️</span>
        <span class="error-message">{{ usersStore.error }}</span>
        <button class="error-banner__close" @click="usersStore.clearError()">
          <span class="close-icon">✕</span>
        </button>
      </div>
    </Transition>

    <!-- Search & Filters Bar -->
    <div class="toolbar">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre o correo..."
          class="search-input"
        />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
          <span class="clear-icon">✕</span>
        </button>
      </div>

      <div class="filter-roles">
        <button
          class="filter-chip"
          :class="{ 'filter-chip--active': !activeRoleFilter }"
          @click="activeRoleFilter = null"
        >
          <span class="filter-chip__dot all"></span>
          Todos
        </button>
        <button
          v-for="role in allRoles"
          :key="role.value"
          class="filter-chip"
          :class="{ 'filter-chip--active': activeRoleFilter === role.value }"
          @click="activeRoleFilter = role.value"
        >
          <span class="filter-chip__dot" :style="{ background: role.color }"></span>
          {{ role.label }}
        </button>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="usersStore.isLoading && !usersStore.users.length" class="users-grid">
      <div v-for="n in 6" :key="n" class="user-card user-card--skeleton">
        <div class="skeleton skeleton--avatar"></div>
        <div class="skeleton-info">
          <div class="skeleton skeleton--text skeleton--w60"></div>
          <div class="skeleton skeleton--text skeleton--w80"></div>
          <div class="skeleton skeleton--badge"></div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!filteredUsers.length && !usersStore.isLoading" class="empty-state">
      <div class="empty-state__illustration">
        <span class="empty-emoji">👥</span>
      </div>
      <h3 class="empty-state__title">
        {{ searchQuery || activeRoleFilter ? 'Sin resultados' : 'Sin usuarios registrados' }}
      </h3>
      <p class="empty-state__text">
        {{
          searchQuery || activeRoleFilter
            ? 'Prueba con otros términos de búsqueda o filtros'
            : 'Empieza registrando el primer usuario del sistema'
        }}
      </p>
      <button v-if="!searchQuery && !activeRoleFilter" class="btn-create" @click="openCreate">
        <span class="btn-icon">➕</span>
        Registrar Usuario
      </button>
    </div>

    <!-- Users Grid -->
    <div v-else class="users-grid">
      <TransitionGroup name="list">
        <div v-for="user in filteredUsers" :key="user.id" class="user-card">
          <!-- Card Header -->
          <div class="user-card__header">
            <div class="user-avatar" :class="`user-avatar--color${getAvatarColor(user.id)}`">
              {{ getInitials(user.name) }}
            </div>
            <div
              class="user-status"
              :class="user.isActive ? 'user-status--active' : 'user-status--inactive'"
            >
              <span class="user-status__dot"></span>
              {{ user.isActive ? 'Activo' : 'Inactivo' }}
            </div>
          </div>

          <!-- Card Body -->
          <div class="user-card__body">
            <h3 class="user-name">{{ user.name }}</h3>
            <p class="user-email">
              <span class="email-icon">📧</span>
              {{ user.email }}
            </p>

            <div class="user-roles">
              <span
                v-for="role in user.roles"
                :key="role"
                class="role-badge"
                :style="{
                  background: getRoleColor(role) + '22',
                  color: getRoleColor(role),
                  borderColor: getRoleColor(role) + '55',
                }"
              >
                {{ RoleLabels[role] || role }}
              </span>
            </div>
          </div>

          <!-- Card Footer -->
          <div class="user-card__footer">
            <div class="user-date">
              <span class="date-icon">📅</span>
              {{ formatDate(user.createdAt) }}
            </div>
            <div class="user-actions">
              <button
                class="action-btn action-btn--edit"
                title="Editar usuario"
                @click="openEdit(user)"
              >
                <span class="btn-icon">✏️</span>
              </button>
              <button
                class="action-btn action-btn--delete"
                title="Eliminar usuario"
                @click="openDelete(user)"
              >
                <span class="btn-icon">🗑️</span>
              </button>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- Pagination -->
    <div v-if="usersStore.totalPages > 1 && !usersStore.isLoading" class="pagination">
      <button
        class="pagination-btn"
        :disabled="usersStore.meta?.currentPage === 1"
        @click="changePage(usersStore.meta!.currentPage - 1)"
      >
        <span class="btn-icon">←</span>
      </button>

      <div class="pagination-pages">
        <button
          v-for="page in visiblePages"
          :key="page"
          class="pagination-page"
          :class="{
            'pagination-page--active': page === usersStore.meta?.currentPage,
            'pagination-page--ellipsis': page === '...',
          }"
          :disabled="page === '...'"
          @click="page !== '...' && changePage(Number(page))"
        >
          {{ page }}
        </button>
      </div>

      <button
        class="pagination-btn"
        :disabled="usersStore.meta?.currentPage === usersStore.totalPages"
        @click="changePage(usersStore.meta!.currentPage + 1)"
      >
        <span class="btn-icon">→</span>
      </button>
    </div>

    <!-- Modals -->
    <UserFormModal
      :is-open="formModal.isOpen"
      :mode="formModal.mode"
      :user="formModal.user"
      ref="formModalRef"
      @close="closeFormModal"
      @submit="handleFormSubmit"
    />

    <!-- Delete Confirmation Modal -->
    <ConfirmationModal
      :show="deleteModal.isOpen"
      title="¿Eliminar usuario?"
      :message="`¿Estás seguro de que deseas eliminar al usuario ${deleteModal.user?.name || ''}? Esta acción no se puede deshacer.`"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      type="danger"
      @confirm="handleDeleteConfirm"
      @cancel="closeDeleteModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useUsersStore } from '@/stores/userStore'
import { ValidRoles, RoleLabels, RoleColors } from '@/types/user'
import type { FullUser, CreateUserPayload, UpdateUserPayload } from '@/types/user'
import UserFormModal from '@/components/UsersFormModal.vue'
import ConfirmationModal from '@/components/Confirmationmodal.vue'

const usersStore = useUsersStore()
const formModalRef = ref<InstanceType<typeof UserFormModal> | null>(null)

const searchQuery = ref('')
const activeRoleFilter = ref<ValidRoles | null>(null)

const formModal = reactive({
  isOpen: false,
  mode: 'create' as 'create' | 'edit',
  user: null as FullUser | null,
})

const deleteModal = reactive({
  isOpen: false,
  user: null as FullUser | null,
})

onMounted(() => {
  usersStore.fetchUsers(1)
})

const allRoles = computed(() =>
  Object.values(ValidRoles).map((v) => ({
    value: v,
    label: RoleLabels[v],
    color: RoleColors[v],
  })),
)

const filteredUsers = computed(() => {
  let users = usersStore.users

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    users = users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }

  if (activeRoleFilter.value) {
    users = users.filter((u) => u.roles.includes(activeRoleFilter.value!))
  }

  return users
})

const visiblePages = computed(() => {
  const current = usersStore.meta?.currentPage ?? 1
  const total = usersStore.totalPages
  const pages: (number | string)[] = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }

  return pages
})

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function getAvatarColor(id: string): number {
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return (sum % 4) + 1
}

function getRoleColor(role: string): string {
  return RoleColors[role as ValidRoles] || '#5d7a90'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function openCreate() {
  formModal.mode = 'create'
  formModal.user = null
  formModal.isOpen = true
}

function openEdit(user: FullUser) {
  formModal.mode = 'edit'
  formModal.user = user
  formModal.isOpen = true
}

function openDelete(user: FullUser) {
  deleteModal.user = user
  deleteModal.isOpen = true
}

function closeFormModal() {
  formModal.isOpen = false
  formModal.user = null
}

function closeDeleteModal() {
  deleteModal.isOpen = false
  deleteModal.user = null
}

async function handleFormSubmit(payload: CreateUserPayload | UpdateUserPayload) {
  formModalRef.value?.setSubmitting(true)
  formModalRef.value?.setError('')
  try {
    if (formModal.mode === 'create') {
      await usersStore.createUser(payload as CreateUserPayload)
    } else if (formModal.user) {
      await usersStore.updateUser(formModal.user.id, payload as UpdateUserPayload)
    }
    closeFormModal()
  } catch (error: any) {
    formModalRef.value?.setError(error.message || 'Error al procesar la solicitud')
  } finally {
    formModalRef.value?.setSubmitting(false)
  }
}

async function handleDeleteConfirm() {
  if (!deleteModal.user) return

  try {
    await usersStore.deleteUser(deleteModal.user.id)
    closeDeleteModal()
  } catch {
    // Error is shown in store
  }
}

async function changePage(page: number) {
  await usersStore.fetchUsers(page)
}
</script>

<style scoped>
.users-page {
  padding: 2rem;
  min-height: 100vh;
  background: #e4f4fc;
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.75rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header__left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-header__icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(145deg, #609abb, #e4f4fc);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(96, 154, 187, 0.3);
}

.header-emoji {
  font-size: 2rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #051b3a;
  margin: 0 0 0.1rem;
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.page-subtitle {
  font-size: 0.9rem;
  color: #5d7a90;
  margin: 0;
}

/* ── Create Button ── */
.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(145deg, #609abb, #5d7a90);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
  white-space: nowrap;
}

.btn-create:hover {
  background: linear-gradient(145deg, #5d7a90, #051b3a);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(5, 27, 58, 0.3);
}

.btn-icon {
  font-size: 1.1rem;
}

/* ── Error Banner ── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #fee2e2;
  border: 2px solid #ef4444;
  border-radius: 12px;
  color: #ef4444;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  font-size: 1.2rem;
}

.error-message {
  flex: 1;
}

.error-banner__close {
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  opacity: 0.7;
  transition: all 0.3s ease;
}

.error-banner__close:hover {
  opacity: 1;
  transform: rotate(90deg);
}

.close-icon {
  font-size: 1.2rem;
}

/* ── Toolbar ── */
.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  border: 1px solid rgba(96, 154, 187, 0.1);
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  color: #b4cbd8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 2.8rem;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  font-size: 0.95rem;
  color: #051b3a;
  background: #e4f4fc;
  outline: none;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #609abb;
  background: white;
  box-shadow: 0 0 0 4px rgba(96, 154, 187, 0.1);
}

.search-input::placeholder {
  color: #b4cbd8;
}

.search-clear {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #b4cbd8;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.search-clear:hover {
  color: #609abb;
  transform: translateY(-50%) scale(1.1);
}

.clear-icon {
  font-size: 1rem;
}

.filter-roles {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: 2px solid #e4f4fc;
  border-radius: 30px;
  background: white;
  font-size: 0.85rem;
  font-weight: 500;
  color: #5d7a90;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-chip:hover {
  border-color: #609abb;
  color: #609abb;
  transform: translateY(-2px);
}

.filter-chip--active {
  border-color: #609abb;
  background: #e4f4fc;
  color: #051b3a;
  font-weight: 600;
}

.filter-chip__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.filter-chip__dot.all {
  background: #609abb;
}

/* ── Users Grid ── */
.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

/* ── User Card ── */
.user-card {
  background: white;
  border: 2px solid #e4f4fc;
  border-radius: 20px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
}

.user-card:hover {
  border-color: #609abb;
  box-shadow: 0 8px 25px rgba(96, 154, 187, 0.15);
  transform: translateY(-4px);
}

.user-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

/* Avatar colors */
.user-avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: #fff;
  flex-shrink: 0;
}

.user-avatar--color1 {
  background: linear-gradient(145deg, #609abb, #051b3a);
}
.user-avatar--color2 {
  background: linear-gradient(145deg, #5d7a90, #609abb);
}
.user-avatar--color3 {
  background: linear-gradient(145deg, #051b3a, #5d7a90);
}
.user-avatar--color4 {
  background: linear-gradient(145deg, #b4cbd8, #609abb);
}

.user-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.75rem;
  border-radius: 30px;
  font-size: 0.75rem;
  font-weight: 600;
}

.user-status--active {
  background: #d1fae5;
  color: #10b981;
  border: 1px solid #a7f3d0;
}

.user-status--inactive {
  background: #fee2e2;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.user-status__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.user-card__body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #051b3a;
  margin: 0;
  line-height: 1.2;
}

.user-email {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: #5d7a90;
  margin: 0;
  word-break: break-all;
}

.email-icon {
  font-size: 0.9rem;
  color: #b4cbd8;
}

.user-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.25rem;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 30px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid;
  letter-spacing: 0.3px;
}

.user-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 2px solid #e4f4fc;
}

.user-date {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #b4cbd8;
}

.date-icon {
  font-size: 0.9rem;
}

.user-actions {
  display: flex;
  gap: 0.35rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: 2px solid;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.action-btn .btn-icon {
  font-size: 1rem;
}

.action-btn--edit {
  color: #609abb;
  border-color: #e4f4fc;
}

.action-btn--edit:hover {
  background: #609abb;
  border-color: #609abb;
  color: white;
  transform: translateY(-2px);
}

.action-btn--delete {
  color: #ef4444;
  border-color: #fee2e2;
}

.action-btn--delete:hover {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
  transform: translateY(-2px);
}

/* ── Skeleton ── */
.user-card--skeleton {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem;
  pointer-events: none;
}

.skeleton-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton {
  border-radius: 8px;
  background: linear-gradient(90deg, #e4f4fc 25%, #f0f9ff 50%, #e4f4fc 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton--avatar {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  flex-shrink: 0;
}

.skeleton--text {
  height: 14px;
}

.skeleton--w60 {
  width: 60%;
}
.skeleton--w80 {
  width: 80%;
}

.skeleton--badge {
  width: 80px;
  height: 24px;
  border-radius: 30px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ── Empty State ── */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 24px;
  box-shadow: 0 5px 15px rgba(5, 27, 58, 0.05);
  border: 1px solid rgba(96, 154, 187, 0.1);
}

.empty-state__illustration {
  margin-bottom: 0.5rem;
}

.empty-emoji {
  font-size: 3rem;
  background: #e4f4fc;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.empty-state__title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #051b3a;
  margin: 0;
}

.empty-state__text {
  font-size: 0.95rem;
  color: #5d7a90;
  margin: 0 0 1rem;
}

/* ── Pagination ── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}

.pagination-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #609abb;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #609abb;
  background: #609abb;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-pages {
  display: flex;
  gap: 0.3rem;
}

.pagination-page {
  min-width: 40px;
  height: 40px;
  border: 2px solid #e4f4fc;
  border-radius: 12px;
  background: white;
  font-size: 0.9rem;
  font-weight: 500;
  color: #5d7a90;
  cursor: pointer;
  padding: 0 0.5rem;
  transition: all 0.3s ease;
}

.pagination-page:hover:not(:disabled):not(.pagination-page--ellipsis) {
  border-color: #609abb;
  color: #609abb;
  background: #e4f4fc;
  transform: translateY(-2px);
}

.pagination-page--active {
  background: linear-gradient(145deg, #609abb, #5d7a90);
  border-color: transparent;
  color: white;
  font-weight: 700;
  box-shadow: 0 5px 15px rgba(96, 154, 187, 0.3);
}

.pagination-page--ellipsis {
  border-color: transparent;
  background: transparent;
  cursor: default;
  color: #b4cbd8;
}

/* ── Transitions ── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 80px;
  opacity: 1;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(8px);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .users-page {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.4rem;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
    padding: 1rem;
  }

  .search-wrapper {
    max-width: 100%;
  }

  .users-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn-create {
    width: 100%;
    justify-content: center;
  }

  .filter-roles {
    justify-content: center;
  }

  .user-card__footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .user-actions {
    width: 100%;
  }

  .action-btn {
    flex: 1;
  }
}
</style>
