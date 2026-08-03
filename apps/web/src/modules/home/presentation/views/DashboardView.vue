<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

    <!-- Welcome header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Welcome back{{ firstName ? ', ' + firstName : '' }}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Here's an overview of your account.
      </p>
    </div>

    <!-- Quick-access cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <RouterLink
        to="/profile"
        class="group p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all"
      >
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Profile
            </h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Update your name, email and preferences
            </p>
          </div>
          <svg class="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </RouterLink>

      <RouterLink
        to="/security"
        class="group p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all"
      >
        <div class="flex items-start gap-4">
          <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              Security
            </h2>
            <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Manage sessions, password and two-factor auth
            </p>
          </div>
          <svg class="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </RouterLink>
    </div>

    <!-- Account info summary -->
    <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
      <div class="px-5 py-4">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Account details</h2>
      </div>
      <div class="px-5 py-4 flex items-center justify-between">
        <span class="text-xs text-gray-500 dark:text-gray-400">Name</span>
        <span class="text-sm font-medium text-gray-900 dark:text-white">{{ authStore.user?.full_name ?? '—' }}</span>
      </div>
      <div class="px-5 py-4 flex items-center justify-between">
        <span class="text-xs text-gray-500 dark:text-gray-400">Email</span>
        <span class="text-sm font-medium text-gray-900 dark:text-white">{{ authStore.user?.email ?? '—' }}</span>
      </div>
      <div class="px-5 py-4 flex items-center justify-between">
        <span class="text-xs text-gray-500 dark:text-gray-400">Status</span>
        <span
          :class="authStore.user?.status === 'ACTIVE'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
        >
          {{ authStore.user?.status ?? '—' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/modules/authentication/integration/stores/authStore'

const authStore = useAuthStore()
const firstName = computed(() => authStore.user?.first_name ?? '')
</script>
