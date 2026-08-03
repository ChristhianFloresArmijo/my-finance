<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
    <!-- Top Navbar -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-30">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">

        <!-- Logo / App name -->
        <div class="flex items-center gap-6">
          <RouterLink
            to="/dashboard"
            class="text-base font-bold text-gray-900 dark:text-white tracking-tight"
          >
            {{ appName }}
          </RouterLink>

          <!-- Nav links -->
          <nav class="hidden sm:flex items-center gap-1">
            <RouterLink
              to="/dashboard"
              active-class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Dashboard
            </RouterLink>
            <RouterLink
              to="/profile"
              active-class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Profile
            </RouterLink>
            <RouterLink
              to="/security"
              active-class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Security
            </RouterLink>
          </nav>
        </div>

        <!-- Right side: theme toggle + user + sign out -->
        <div class="flex items-center gap-2">
          <!-- Theme toggle -->
          <button
            class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleTheme"
          >
            <svg v-if="isDark" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
            <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          <!-- User name -->
          <span class="hidden sm:block text-sm text-gray-700 dark:text-gray-300 font-medium">
            {{ authStore.user?.full_name }}
          </span>

          <!-- Sign out -->
          <button
            class="px-3 py-1.5 text-sm font-medium text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
            @click="signOut"
          >
            Sign out
          </button>
        </div>
      </div>

      <!-- Mobile nav -->
      <div class="sm:hidden border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex gap-1">
        <RouterLink
          to="/dashboard"
          active-class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
          class="flex-1 text-center px-2 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Dashboard
        </RouterLink>
        <RouterLink
          to="/profile"
          active-class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
          class="flex-1 text-center px-2 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Profile
        </RouterLink>
        <RouterLink
          to="/security"
          active-class="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
          class="flex-1 text-center px-2 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Security
        </RouterLink>
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/modules/authentication/integration/stores/authStore'
import { useAuth } from '@/modules/authentication/presentation/composables/useAuth'
import { useTheme } from '@/shared/presentation/composables/useTheme'
import { config } from '@/config'

const authStore = useAuthStore()
const { signOut: _signOut } = useAuth()
const { isDark, toggle: toggleTheme } = useTheme()
const appName = config.app.name

function signOut() {
  _signOut('/auth/sign-in')
}
</script>
