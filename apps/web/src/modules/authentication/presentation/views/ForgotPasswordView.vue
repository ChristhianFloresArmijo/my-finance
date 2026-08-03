<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8"
  >
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">
          Forgot your password?
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enter your email and we'll send you a reset link.
        </p>
      </div>

      <Card variant="elevated" class="px-4 py-8 sm:px-10 space-y-4">
        <!-- Success state -->
        <template v-if="sent">
          <div class="text-center space-y-4">
            <div class="flex justify-center">
              <svg class="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="text-base font-medium text-gray-900 dark:text-white">Check your inbox</p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              If that email address is registered, you'll receive a password reset link shortly.
            </p>
            <router-link
              to="/auth/sign-in"
              class="block text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              ← Back to sign in
            </router-link>
          </div>
        </template>

        <!-- Form state -->
        <template v-else>
          <div
            v-if="errorMessage"
            class="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400"
          >
            {{ errorMessage }}
          </div>

          <div class="space-y-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </label>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="you@example.com"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              @keydown.enter="submit"
            />
            <p v-if="validationError" class="text-xs text-red-600 dark:text-red-400">{{ validationError }}</p>
          </div>

          <Button
            variant="primary"
            class="w-full"
            :disabled="isLoading"
            @click="submit"
          >
            {{ isLoading ? 'Sending…' : 'Send reset link' }}
          </Button>

          <div class="text-center">
            <router-link
              to="/auth/sign-in"
              class="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              ← Back to sign in
            </router-link>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Card, Button } from '@/shared/presentation/components/ui'
import { useAuth } from '../composables/useAuth'
import { ForgotPasswordSchema } from '../../business'

const { forgotPassword, isLoading } = useAuth()

const email = ref('')
const sent = ref(false)
const errorMessage = ref<string | null>(null)
const validationError = ref<string | null>(null)

async function submit() {
  validationError.value = null
  errorMessage.value = null

  const parsed = ForgotPasswordSchema.safeParse({ email: email.value })
  if (!parsed.success) {
    validationError.value = parsed.error.errors[0]?.message ?? 'Invalid email'
    return
  }

  const result = await forgotPassword(email.value)
  if (result.isSuccess) {
    // Always show success — backend never reveals whether email exists
    sent.value = true
  } else {
    // Network-level failure only
    errorMessage.value = result.error ?? 'Something went wrong. Please try again.'
  }
}
</script>
