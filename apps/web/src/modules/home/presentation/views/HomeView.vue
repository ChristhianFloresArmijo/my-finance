<template>
  <div class="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
    <!-- Navbar -->
    <header class="border-b border-gray-100 dark:border-gray-800">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
        <span class="text-base font-bold text-gray-900 dark:text-white tracking-tight">
          {{ appName }}
        </span>
        <div class="flex items-center gap-3">
          <button
            class="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
          <RouterLink
            to="/auth/sign-in"
            class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Sign in
          </RouterLink>
          <RouterLink
            to="/auth/sign-up"
            class="px-4 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
          >
            Get started
          </RouterLink>
        </div>
      </div>
    </header>

    <!-- Hero -->
    <section class="flex-1 flex items-center justify-center py-24 px-4">
      <div class="max-w-2xl text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-400 mb-6">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          Production-ready DDD template
        </div>
        <h1 class="text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">
          Build with confidence<br>
          <span class="text-gray-400 dark:text-gray-500">from day one</span>
        </h1>
        <p class="text-lg text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
          A Vue 3 + NestJS full-stack template with Domain-Driven Design, RBAC, 2FA,
          and a ready-made admin panel — so you can focus on your product, not the plumbing.
        </p>
        <div class="flex items-center justify-center gap-3 flex-wrap">
          <RouterLink
            to="/auth/sign-up"
            class="px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
          >
            Create an account
          </RouterLink>
          <RouterLink
            to="/auth/sign-in"
            class="px-6 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Sign in
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="border-t border-gray-100 dark:border-gray-800 py-16 px-4">
      <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="p-5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
        >
          <div class="text-2xl mb-3">{{ feature.icon }}</div>
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">{{ feature.title }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{{ feature.description }}</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-gray-100 dark:border-gray-800 py-6 px-4 text-center">
      <p class="text-xs text-gray-400 dark:text-gray-600">
        {{ appName }} · v{{ version }}
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useTheme } from '@/shared/presentation/composables/useTheme'
import { config } from '@/config'

const { isDark, toggle: toggleTheme } = useTheme()
const appName = config.app.name
const version = config.app.version

const features = [
  {
    icon: '🏗️',
    title: 'Domain-Driven Design',
    description: 'Layered architecture — business, capabilities, integration, presentation — in both frontend and backend.',
  },
  {
    icon: '🔐',
    title: 'Auth out of the box',
    description: 'JWT sessions, TOTP two-factor authentication, recovery codes, RBAC roles and permissions.',
  },
  {
    icon: '⚡',
    title: 'Modern stack',
    description: 'Vue 3, TypeScript, Tailwind v4, Pinia, Vite on the frontend. NestJS, Prisma, PostgreSQL on the backend.',
  },
]
</script>
