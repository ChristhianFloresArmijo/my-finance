<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8"
  >
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">
          Email Verification
        </h2>
      </div>

      <Card variant="elevated" class="px-4 py-8 sm:px-10 text-center space-y-4">
        <!-- Verifying -->
        <template v-if="status === 'pending'">
          <p class="text-sm text-gray-500 dark:text-gray-400">Verifying your email address…</p>
        </template>

        <!-- Success -->
        <template v-else-if="status === 'success'">
          <div class="flex justify-center">
            <svg class="h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p class="text-base font-medium text-gray-900 dark:text-white">Email verified!</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Your email address has been confirmed. You can now sign in.
          </p>
          <Button variant="primary" class="w-full" @click="router.push('/auth/sign-in')">
            Go to Sign In
          </Button>
        </template>

        <!-- Error: no token -->
        <template v-else-if="status === 'no-token'">
          <div class="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/30">
            <p class="text-sm text-yellow-800 dark:text-yellow-300">
              No verification token found. Please use the link from your confirmation email.
            </p>
          </div>
          <Button variant="secondary" class="w-full" @click="router.push('/auth/sign-in')">
            Back to Sign In
          </Button>
        </template>

        <!-- Error: verification failed -->
        <template v-else-if="status === 'error'">
          <div class="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
            <p class="text-sm text-red-700 dark:text-red-400">{{ errorMessage }}</p>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            The link may have expired. Request a new verification email from your account settings.
          </p>
          <Button variant="secondary" class="w-full" @click="router.push('/auth/sign-in')">
            Back to Sign In
          </Button>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Card, Button } from '@/shared/presentation/components/ui'
import { useAuth } from '../composables/useAuth'

type Status = 'pending' | 'success' | 'no-token' | 'error'

const route = useRoute()
const router = useRouter()
const { verifyEmail } = useAuth()

const status = ref<Status>('pending')
const errorMessage = ref<string>('')

onMounted(async () => {
  const token = route.query.token as string | undefined
  if (!token) {
    status.value = 'no-token'
    return
  }

  const result = await verifyEmail(token)
  if (result.isSuccess) {
    status.value = 'success'
  } else {
    errorMessage.value = result.error ?? 'Verification failed'
    status.value = 'error'
  }
})
</script>
