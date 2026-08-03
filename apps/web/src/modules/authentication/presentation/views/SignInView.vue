<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900 sm:px-6 lg:px-8"
  >
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">
          {{ step2fa ? 'Two-factor authentication' : 'Sign in to your account' }}
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          <template v-if="!step2fa">
            Or
            <router-link
              to="/auth/sign-up"
              class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              create a new account
            </router-link>
          </template>
          <template v-else>
            Enter the 6-digit code from your authenticator app.
          </template>
        </p>
      </div>

      <Card variant="elevated" class="px-4 py-8 sm:px-10">
        <div
          v-if="signInError"
          class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400"
        >
          {{ signInError }}
        </div>

        <!-- ── Step 1: Email + Password ── -->
        <template v-if="!step2fa">
          <DynamicForm
            :schema="SignInSchema"
            :initial-values="{}"
            :actions="formActions"
            @error="handleError"
          />

          <div class="mt-6">
            <Divider>Or continue with</Divider>

            <div class="mt-6 grid grid-cols-2 gap-3">
              <Button variant="secondary" class="w-full">
                <span class="sr-only">Sign in with Google</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm4.133 14.697l-1.1 1.1-3.033-3.033-3.033 3.033-1.1-1.1 3.033-3.033L5.867 8.63l1.1-1.1L10 10.564 13.033 7.53l1.1 1.1-3.033 3.034 3.033 3.033z"
                  />
                </svg>
              </Button>

              <Button variant="secondary" class="w-full">
                <span class="sr-only">Sign in with GitHub</span>
                <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </Button>
            </div>
          </div>

          <div class="mt-6 text-center space-y-2">
            <router-link
              to="/auth/forgot-password"
              class="block text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400"
            >
              Forgot your password?
            </router-link>
            <router-link
              to="/admin/login"
              class="block text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Admin portal →
            </router-link>
          </div>
        </template>

        <!-- ── Step 2: TOTP Code ── -->
        <template v-else>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Authentication code
              </label>
              <input
                ref="codeInput"
                v-model="totpCode"
                type="text"
                inputmode="numeric"
                maxlength="10"
                autocomplete="one-time-code"
                placeholder="000000"
                class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm font-mono tracking-widest text-center text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                @keydown.enter="submitTotp"
              />
              <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Or enter one of your recovery codes.
              </p>
            </div>

            <Button
              variant="primary"
              class="w-full"
              :disabled="isLoading || totpCode.length < 6"
              @click="submitTotp"
            >
              {{ isLoading ? 'Verifying…' : 'Verify' }}
            </Button>

            <button
              class="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-center"
              @click="cancelTotp"
            >
              ← Back to sign in
            </button>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { DynamicForm, type FormAction } from '@/shared/presentation/components/forms'
import { Button, Card, Divider } from '@/shared/presentation/components/ui'
import { SignInSchema, type SignInDto } from '../../business'
import { useAuth } from '../composables/useAuth'
import { useAuthorizationStore } from '@/modules/authorization/integration/stores/authorizationStore'

const router = useRouter()
const { signIn, signIn2fa, signOut, isLoading } = useAuth()
const authorizationStore = useAuthorizationStore()
const signInError = ref<string | null>(null)

// 2FA step state
const step2fa = ref(false)
const totpPendingToken = ref('')
const totpCode = ref('')
const codeInput = ref<HTMLInputElement | null>(null)

const formActions: FormAction[] = [
  {
    label: 'Sign In',
    variant: 'primary',
    loadingLabel: 'Signing in...',
    callback: async (values) => {
      signInError.value = null
      const result = await signIn(values as SignInDto)
      if (result.isSuccess) {
        if (result.value?.requires_2fa) {
          totpPendingToken.value = result.value.totp_pending_token
          step2fa.value = true
          totpCode.value = ''
          await nextTick()
          codeInput.value?.focus()
          // Do not throw — form submission is logically complete (waiting for step 2)
        } else {
          await redirect()
        }
      } else {
        signInError.value = result.error ?? 'Sign in failed'
        throw new Error(signInError.value)
      }
    },
  },
]

const handleError = (err: Error) => {
  signInError.value = err.message
}

async function submitTotp() {
  if (totpCode.value.length < 6) return
  signInError.value = null

  const result = await signIn2fa(totpPendingToken.value, totpCode.value)
  if (result.isSuccess) {
    await redirect()
  } else {
    signInError.value = result.error ?? '2FA verification failed'
    totpCode.value = ''
  }
}

function cancelTotp() {
  step2fa.value = false
  totpPendingToken.value = ''
  totpCode.value = ''
  signInError.value = null
}

async function redirect() {
  if (!authorizationStore.hasPermission('client:access')) {
    // User has no client portal access — revoke session silently and explain
    await signOut(null)
    signInError.value = 'This account is not authorized to access the client portal.'
    return
  }
  router.push('/dashboard')
}
</script>
