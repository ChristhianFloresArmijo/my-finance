<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-950 px-4">
    <div class="w-full max-w-sm space-y-8">

      <!-- Logo / header -->
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 mb-4">
          <svg v-if="!step2fa" class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <svg v-else class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white">{{ step2fa ? 'Two-factor auth' : 'Admin Portal' }}</h1>
        <p class="mt-1 text-sm text-gray-400">
          {{ step2fa
            ? 'Enter the 6-digit code from your authenticator app'
            : 'Sign in with your admin credentials' }}
        </p>
      </div>

      <!-- Form card -->
      <div class="bg-gray-900 border border-gray-800 rounded-2xl px-8 py-8 shadow-xl space-y-5">
        <div
          v-if="loginError"
          class="rounded-lg bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-400"
        >
          {{ loginError }}
        </div>

        <!-- ── Step 1: Email + Password ── -->
        <template v-if="!step2fa">
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                v-model="form.email"
                type="email"
                autocomplete="email"
                placeholder="admin@example.com"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                @keydown.enter="submit"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                v-model="form.password"
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                @keydown.enter="submit"
              />
            </div>
          </div>

          <button
            :disabled="isLoading || !form.email || !form.password"
            class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            @click="submit"
          >
            {{ isLoading ? 'Signing in…' : 'Sign in' }}
          </button>
        </template>

        <!-- ── Step 2: TOTP Code ── -->
        <template v-else>
          <div>
            <label class="block text-xs font-medium text-gray-400 mb-1.5">Authentication code</label>
            <input
              ref="codeInput"
              v-model="totpCode"
              type="text"
              inputmode="numeric"
              maxlength="10"
              autocomplete="one-time-code"
              placeholder="000000"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              @keydown.enter="submitTotp"
            />
            <p class="mt-1.5 text-xs text-gray-500">
              Or enter one of your recovery codes.
            </p>
          </div>

          <button
            :disabled="isLoading || totpCode.length < 6"
            class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            @click="submitTotp"
          >
            {{ isLoading ? 'Verifying…' : 'Verify' }}
          </button>

          <button
            class="w-full text-xs text-gray-500 hover:text-gray-400 text-center"
            @click="cancelTotp"
          >
            ← Back to sign in
          </button>
        </template>
      </div>

      <p v-if="!step2fa" class="text-center text-xs text-gray-600">
        Not an admin?
        <RouterLink to="/auth/sign-in" class="text-indigo-400 hover:underline">Go to client login</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuth } from '@/modules/authentication/presentation/composables/useAuth'
import { useAuthorizationStore } from '@/modules/authorization/integration/stores/authorizationStore'

const router = useRouter()
const { signIn, signIn2fa, signOut, isLoading } = useAuth()
const authorizationStore = useAuthorizationStore()

const form = ref({ email: '', password: '' })
const loginError = ref<string | null>(null)

// 2FA step state
const step2fa = ref(false)
const totpPendingToken = ref('')
const totpCode = ref('')
const codeInput = ref<HTMLInputElement | null>(null)

async function submit() {
  if (!form.value.email || !form.value.password) return
  loginError.value = null

  const result = await signIn({ email: form.value.email, password: form.value.password })

  if (result.isSuccess) {
    if (result.value?.requires_2fa) {
      // Show the 2FA step
      totpPendingToken.value = result.value.totp_pending_token
      step2fa.value = true
      totpCode.value = ''
      await nextTick()
      codeInput.value?.focus()
    } else {
      // Normal sign-in complete — check permission and redirect
      await redirectToAdmin()
    }
  } else {
    loginError.value = result.error ?? 'Sign in failed'
  }
}

async function submitTotp() {
  if (totpCode.value.length < 6) return
  loginError.value = null

  const result = await signIn2fa(totpPendingToken.value, totpCode.value)

  if (result.isSuccess) {
    await redirectToAdmin()
  } else {
    loginError.value = result.error ?? '2FA verification failed'
    totpCode.value = ''
  }
}

function cancelTotp() {
  step2fa.value = false
  totpPendingToken.value = ''
  totpCode.value = ''
  loginError.value = null
}

async function redirectToAdmin() {
  if (authorizationStore.hasPermission('admin:access')) {
    router.push('/admin')
  } else {
    loginError.value = 'Access denied. This account does not have admin portal access.'
    await signOut(null)
  }
}
</script>
