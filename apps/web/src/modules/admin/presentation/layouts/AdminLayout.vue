<template>
  <div class="flex h-screen bg-gray-100 dark:bg-gray-900">
    <!-- Sidebar -->
    <aside class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
      <div class="p-4 font-bold text-xl text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">Admin Panel</div>
      <nav class="flex-1 p-4 space-y-1">
        <RouterLink
          to="/admin"
          :exact-active-class="'bg-primary-50 text-primary-600'"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          Dashboard
        </RouterLink>
        <RouterLink
          v-if="authorizationStore.hasPermission('admin:users')"
          to="/admin/users"
          active-class="bg-primary-50 text-primary-600"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          Users
        </RouterLink>
        <RouterLink
          v-if="authorizationStore.hasPermission('admin:roles')"
          to="/admin/roles"
          active-class="bg-primary-50 text-primary-600"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          Roles
        </RouterLink>
        <RouterLink
          v-if="authorizationStore.hasPermission('admin:permissions')"
          to="/admin/permissions"
          active-class="bg-primary-50 text-primary-600"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          Permissions
        </RouterLink>
        <RouterLink
          v-if="authorizationStore.hasPermission('admin:audit')"
          to="/admin/audit"
          active-class="bg-primary-50 text-primary-600"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          Audit Log
        </RouterLink>
        <RouterLink
          to="/admin/profile"
          active-class="bg-primary-50 text-primary-600"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
        >
          My Profile
        </RouterLink>
      </nav>
      <!-- Theme toggle + user info + sign-out at bottom -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <!-- Dark/light toggle -->
        <button
          class="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @click="toggleTheme"
        >
          <!-- Sun icon (shown in dark mode to switch to light) -->
          <svg v-if="isDark" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
          <!-- Moon icon (shown in light mode to switch to dark) -->
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          {{ isDark ? 'Light mode' : 'Dark mode' }}
        </button>
        <!-- User info -->
        <div>
          <p class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{{ authStore.user?.full_name }}</p>
          <button @click="signOut" class="text-xs text-red-500 mt-1 hover:underline">Sign out</button>
        </div>
      </div>
    </aside>
    <!-- Main content -->
    <main class="flex-1 overflow-auto">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/modules/authentication/integration/stores/authStore'
import { useAuthorizationStore } from '@/modules/authorization/integration'
import { useAuth } from '@/modules/authentication/presentation/composables/useAuth'
import { useTheme } from '@/shared/presentation/composables/useTheme'

const authStore = useAuthStore()
const authorizationStore = useAuthorizationStore()
const { signOut: _signOut } = useAuth()
const { isDark, toggle: toggleTheme } = useTheme()

function signOut() {
  _signOut('/admin/login')
}
</script>
