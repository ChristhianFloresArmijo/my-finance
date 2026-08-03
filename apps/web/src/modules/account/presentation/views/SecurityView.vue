<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Security</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Manage your active sessions and two-factor authentication.
      </p>
    </div>

    <!-- ── Sessions ──────────────────────────────────────────────────── -->
    <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div class="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Active sessions</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Devices currently signed in to your account.
          </p>
        </div>
        <button
          v-if="sessions.length > 1"
          :disabled="loading"
          class="text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40 transition-colors"
          @click="revokeAllSessions"
        >
          Revoke all
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="px-5 py-8 text-center">
        <div class="inline-block w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="px-5 py-4 text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </div>

      <!-- Empty -->
      <div v-else-if="sessions.length === 0" class="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
        No active sessions found.
      </div>

      <!-- Session list -->
      <ul v-else class="divide-y divide-gray-100 dark:divide-gray-700">
        <li
          v-for="session in sessions"
          :key="session.id"
          class="px-5 py-4 flex items-start justify-between gap-4"
        >
          <div class="flex items-start gap-3">
            <div class="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-900 dark:text-white">
                Session
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Started {{ formatDate(session.created_at) }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500">
                Expires {{ formatDate(session.expires_at) }}
              </p>
            </div>
          </div>
          <button
            :disabled="revokeLoadingId === session.id"
            class="flex-shrink-0 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-40 transition-colors mt-0.5"
            @click="revokeSession(session.id)"
          >
            {{ revokeLoadingId === session.id ? 'Revoking…' : 'Revoke' }}
          </button>
        </li>
      </ul>

      <div v-if="revokeError" class="px-5 py-3 text-xs text-red-600 dark:text-red-400 border-t border-gray-100 dark:border-gray-700">
        {{ revokeError }}
      </div>
    </section>

    <!-- ── Two-Factor Authentication ─────────────────────────────────── -->
    <section class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div class="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Two-factor authentication</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Add an extra layer of security with a TOTP authenticator app.
          </p>
        </div>
        <span
          v-if="!statusLoading && status"
          :class="status.totp_enabled
            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'"
          class="px-2.5 py-0.5 rounded-full text-xs font-medium"
        >
          {{ status.totp_enabled ? 'Enabled' : 'Disabled' }}
        </span>
      </div>

      <div class="px-5 py-5">
        <!-- Loading status -->
        <div v-if="statusLoading" class="flex items-center gap-2 text-sm text-gray-400">
          <div class="w-4 h-4 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
          Loading…
        </div>

        <!-- 2FA ENABLED -->
        <template v-else-if="status?.totp_enabled">
          <div class="grid grid-cols-2 gap-4 mb-5 text-sm">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Enabled on</p>
              <p class="font-medium text-gray-900 dark:text-white mt-0.5">
                {{ status.totp_enabled_at ? formatDate(status.totp_enabled_at) : '—' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Recovery codes remaining</p>
              <p class="font-medium text-gray-900 dark:text-white mt-0.5">
                {{ status.recovery_codes_remaining }}
              </p>
            </div>
          </div>

          <!-- New recovery codes after regeneration -->
          <div v-if="recoveryCodes" class="mb-5 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 p-4">
            <p class="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">
              Save your new recovery codes — they won't be shown again.
            </p>
            <div class="grid grid-cols-2 gap-1.5">
              <code
                v-for="code in recoveryCodes"
                :key="code"
                class="px-2 py-1 bg-white dark:bg-amber-900/30 rounded text-xs font-mono text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-700"
              >
                {{ code }}
              </code>
            </div>
            <button
              class="mt-3 text-xs text-amber-600 dark:text-amber-400 hover:underline"
              @click="clearRecoveryCodes"
            >
              I've saved them
            </button>
          </div>

          <!-- Regenerate flow -->
          <div v-if="showRegenForm && !recoveryCodes" class="mb-4">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Enter your current authenticator code to generate new recovery codes.
            </p>
            <div class="flex gap-2">
              <input
                v-model="regenCode"
                type="text"
                inputmode="numeric"
                maxlength="10"
                placeholder="000000"
                class="w-32 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                :disabled="regenLoading || regenCode.length < 6"
                class="px-3 py-1.5 text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg disabled:opacity-40 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
                @click="handleRegen"
              >
                {{ regenLoading ? 'Generating…' : 'Generate' }}
              </button>
              <button
                class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                @click="showRegenForm = false; regenCode = ''"
              >
                Cancel
              </button>
            </div>
            <p v-if="regenError" class="mt-2 text-xs text-red-600 dark:text-red-400">{{ regenError }}</p>
          </div>

          <!-- Disable flow -->
          <div v-if="showDisableForm && !recoveryCodes" class="mb-4">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Enter your authenticator code or a recovery code to disable 2FA.
            </p>
            <div class="flex gap-2">
              <input
                v-model="disableCode"
                type="text"
                inputmode="numeric"
                maxlength="10"
                placeholder="000000"
                class="w-32 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button
                :disabled="disableLoading || disableCode.length < 6"
                class="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg disabled:opacity-40 hover:bg-red-500 transition-colors"
                @click="handleDisable"
              >
                {{ disableLoading ? 'Disabling…' : 'Disable 2FA' }}
              </button>
              <button
                class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                @click="showDisableForm = false; disableCode = ''"
              >
                Cancel
              </button>
            </div>
            <p v-if="disableError" class="mt-2 text-xs text-red-600 dark:text-red-400">{{ disableError }}</p>
          </div>

          <!-- Action buttons -->
          <div v-if="!showDisableForm && !showRegenForm && !recoveryCodes" class="flex gap-2 flex-wrap">
            <button
              class="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="showRegenForm = true"
            >
              Regenerate recovery codes
            </button>
            <button
              class="px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              @click="showDisableForm = true"
            >
              Disable 2FA
            </button>
          </div>
        </template>

        <!-- 2FA DISABLED -->
        <template v-else-if="status && !status.totp_enabled">
          <!-- Setup step 1: show secret + QR -->
          <template v-if="setupUri">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Scan this code with your authenticator app, then enter the 6-digit code to confirm.
            </p>
            <div class="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Manual entry key</p>
              <code class="text-xs font-mono text-gray-800 dark:text-gray-200 break-all select-all">
                {{ secretFromUri }}
              </code>
            </div>
            <div class="flex gap-2 items-center mb-2">
              <input
                v-model="enableCode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="000000"
                class="w-32 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                :disabled="enableLoading || enableCode.length < 6"
                class="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg disabled:opacity-40 hover:bg-green-500 transition-colors"
                @click="handleEnable"
              >
                {{ enableLoading ? 'Enabling…' : 'Enable 2FA' }}
              </button>
            </div>
            <p v-if="enableError" class="text-xs text-red-600 dark:text-red-400">{{ enableError }}</p>
          </template>

          <!-- Recovery codes after enable -->
          <div v-if="recoveryCodes" class="rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 p-4">
            <p class="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">
              Save your recovery codes — they won't be shown again.
            </p>
            <div class="grid grid-cols-2 gap-1.5">
              <code
                v-for="code in recoveryCodes"
                :key="code"
                class="px-2 py-1 bg-white dark:bg-amber-900/30 rounded text-xs font-mono text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-700"
              >
                {{ code }}
              </code>
            </div>
            <button
              class="mt-3 text-xs text-amber-600 dark:text-amber-400 hover:underline"
              @click="clearRecoveryCodes; fetchStatus()"
            >
              I've saved them
            </button>
          </div>

          <!-- Enable button (before setup started) -->
          <template v-if="!setupUri && !recoveryCodes">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Two-factor authentication is not enabled. Enable it to add an extra layer of security.
            </p>
            <button
              :disabled="setupLoading"
              class="px-4 py-2 text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg disabled:opacity-40 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
              @click="startSetup"
            >
              {{ setupLoading ? 'Setting up…' : 'Enable 2FA' }}
            </button>
            <p v-if="setupError" class="mt-2 text-xs text-red-600 dark:text-red-400">{{ setupError }}</p>
          </template>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSessions } from '../composables/useSessions'
import { useTotp } from '@/modules/authentication/presentation/composables/useTotp'

// Sessions
const {
  sessions,
  loading,
  error,
  revokeLoadingId,
  revokeError,
  loadSessions,
  revokeSession,
  revokeAllSessions,
} = useSessions()

// 2FA
const {
  status,
  statusLoading,
  fetchStatus,
  setupUri,
  setupLoading,
  setupError,
  startSetup,
  enableLoading,
  enableError,
  enable,
  disableLoading,
  disableError,
  disable,
  regenLoading,
  regenError,
  regenerateCodes,
  recoveryCodes,
  clearRecoveryCodes,
} = useTotp()

// Local UI state
const enableCode = ref('')
const disableCode = ref('')
const regenCode = ref('')
const showDisableForm = ref(false)
const showRegenForm = ref(false)

// Extract secret from otpauth:// URI for manual entry
const secretFromUri = computed(() => {
  if (!setupUri.value) return ''
  try {
    const url = new URL(setupUri.value)
    return url.searchParams.get('secret') ?? ''
  } catch {
    return ''
  }
})

async function handleEnable() {
  await enable(enableCode.value)
  enableCode.value = ''
  if (!enableError.value) await fetchStatus()
}

async function handleDisable() {
  await disable(disableCode.value)
  disableCode.value = ''
  if (!disableError.value) {
    showDisableForm.value = false
    await fetchStatus()
  }
}

async function handleRegen() {
  await regenerateCodes(regenCode.value)
  regenCode.value = ''
  if (!regenError.value) {
    showRegenForm.value = false
    await fetchStatus()
  }
}

function formatDate(dateStr: string | Date) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  loadSessions()
  fetchStatus()
})
</script>
