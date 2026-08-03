<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8"
  >
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">
          Reset your password
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Choose a new password for your account.
        </p>
      </div>

      <Card variant="elevated" class="px-4 py-8 sm:px-10 space-y-4">
        <!-- No token -->
        <template v-if="!token">
          <div class="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/30 text-center">
            <p class="text-sm text-yellow-800 dark:text-yellow-300">
              Invalid or missing reset link. Please request a new one.
            </p>
          </div>
          <router-link
            to="/auth/forgot-password"
            class="block text-center text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Request a new reset link
          </router-link>
        </template>

        <!-- Success -->
        <template v-else-if="success">
          <div class="text-center space-y-4">
            <div class="flex justify-center">
              <svg class="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p class="text-base font-medium text-gray-900 dark:text-white">Password updated!</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Your password has been reset. You can now sign in with your new password.
            </p>
            <Button variant="primary" class="w-full" @click="router.push('/auth/sign-in')">
              Go to Sign In
            </Button>
          </div>
        </template>

        <!-- Form -->
        <template v-else>
          <div
            v-if="errorMessage"
            class="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400"
          >
            {{ errorMessage }}
          </div>

          <div class="space-y-4">
            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New password
              </label>
              <input
                v-model="password"
                type="password"
                autocomplete="new-password"
                placeholder="••••••••"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p v-if="fieldErrors.password" class="text-xs text-red-600 dark:text-red-400">{{ fieldErrors.password }}</p>
            </div>

            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm new password
              </label>
              <input
                v-model="repassword"
                type="password"
                autocomplete="new-password"
                placeholder="••••••••"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                @keydown.enter="submit"
              />
              <p v-if="fieldErrors.repassword" class="text-xs text-red-600 dark:text-red-400">{{ fieldErrors.repassword }}</p>
            </div>

            <Button
              variant="primary"
              class="w-full"
              :disabled="isLoading"
              @click="submit"
            >
              {{ isLoading ? 'Resetting…' : 'Reset password' }}
            </Button>

            <div class="text-center">
              <router-link
                to="/auth/sign-in"
                class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                ← Back to sign in
              </router-link>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Card, Button } from '@/shared/presentation/components/ui'
import { useAuth } from '../composables/useAuth'
import { ResetPasswordSchema } from '../../business'

const route = useRoute()
const router = useRouter()
const { resetPassword, isLoading } = useAuth()

const token = computed(() => route.query.token as string | undefined)
const password = ref('')
const repassword = ref('')
const success = ref(false)
const errorMessage = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

async function submit() {
  errorMessage.value = null
  fieldErrors.value = {}

  const parsed = ResetPasswordSchema.safeParse({
    token: token.value ?? '',
    password: password.value,
    repassword: repassword.value,
  })

  if (!parsed.success) {
    for (const err of parsed.error.errors) {
      const field = err.path[0] as string
      if (field && !fieldErrors.value[field]) {
        fieldErrors.value[field] = err.message
      }
    }
    return
  }

  const result = await resetPassword(token.value!, password.value, repassword.value)
  if (result.isSuccess) {
    success.value = true
  } else {
    errorMessage.value = result.error ?? 'Password reset failed. The link may have expired.'
  }
}
</script>
