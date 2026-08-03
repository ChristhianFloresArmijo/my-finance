<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8"
  >
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">Create your account</h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Already have an account?
          <router-link
            to="/auth/sign-in"
            class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
          >
            Sign in
          </router-link>
        </p>
      </div>

      <Card variant="elevated" class="px-4 py-8 sm:px-10">
        <DynamicForm
          :schema="SignUpSchema"
          :actions="formActions"
          @error="handleError"
        />

        <p class="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          By creating an account, you agree to our
          <a href="/terms" class="text-primary-600 hover:text-primary-500 dark:text-primary-400">
            Terms of Service
          </a>
          and
          <a href="/privacy" class="text-primary-600 hover:text-primary-500 dark:text-primary-400">
            Privacy Policy
          </a>
        </p>
      </Card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { DynamicForm, type FormAction } from '@/shared/presentation/components/forms'
import { Card } from '@/shared/presentation/components/ui'
import { SignUpSchema, type SignUpDto } from '../../business'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { signUp } = useAuth()

const formActions: FormAction[] = [
  {
    label: 'Create Account',
    variant: 'primary',
    loadingLabel: 'Creating account...',
    callback: async (values) => {
      const result = await signUp(values as SignUpDto)
      if (result.isSuccess) {
        router.push('/')
      }
    },
  },
]

const handleError = (error: Error) => {
  console.error('Form error:', error)
}
</script>
