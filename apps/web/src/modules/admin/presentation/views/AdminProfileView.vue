<template>
  <div class="py-8 px-6 max-w-2xl">
    <h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
    <p class="mb-8 text-sm text-gray-500 dark:text-gray-400">Manage your account settings and preferences.</p>

    <!-- Settings list -->
    <div class="divide-y divide-gray-200 dark:divide-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">

      <!-- Account -->
      <div class="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Account</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {{ authStore.user?.first_name }} {{ authStore.user?.last_name }} · {{ authStore.user?.email }}
          </p>
        </div>
        <button class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline" @click="open('account')">Edit</button>
      </div>

      <!-- Change Password -->
      <div class="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Password</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Update your password.</p>
        </div>
        <button class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline" @click="open('password')">Change</button>
      </div>

      <!-- Two-Factor Auth -->
      <div class="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <template v-if="statusLoading">Loading…</template>
            <template v-else-if="status">
              <span :class="status.totp_enabled ? 'text-green-600 dark:text-green-400' : ''">
                {{ status.totp_enabled ? 'Enabled' : 'Disabled' }}
              </span>
              <template v-if="status.totp_enabled"> · {{ status.recovery_codes_remaining }} recovery codes remaining</template>
            </template>
            <template v-else>Add an extra layer of security.</template>
          </p>
        </div>
        <button class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline" @click="open('2fa')">Manage</button>
      </div>

      <!-- Preferences -->
      <div class="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Preferences</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Theme, language, and display settings.</p>
        </div>
        <button class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline" @click="open('preferences')">Edit</button>
      </div>

      <!-- Sessions -->
      <div class="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
        <div>
          <p class="text-sm font-medium text-gray-900 dark:text-white">Active Sessions</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">View and revoke your active sessions.</p>
        </div>
        <button class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline" @click="open('sessions')">View</button>
      </div>
    </div>
  </div>

  <!-- Side-panel drawers -->
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition name="fade">
      <div v-if="activePanel" class="fixed inset-0 z-40 bg-black/30" @click="close" />
    </Transition>

    <!-- Panel -->
    <Transition name="slide">
      <div v-if="activePanel" class="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl">

        <!-- Panel header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white">{{ panelTitle }}</h2>
          <button class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800" @click="close">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Panel body -->
        <div class="flex-1 overflow-y-auto p-6">

          <!-- ── Account ── -->
          <template v-if="activePanel === 'account'">
            <DynamicForm
              :schema="UpdateProfileSchema"
              :initial-values="profileInitialValues"
              :actions="profileActions"
            />
            <p v-if="accountError" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ accountError }}</p>
          </template>

          <!-- ── Password ── -->
          <template v-else-if="activePanel === 'password'">
            <DynamicForm :schema="ChangePasswordSchema" :actions="passwordActions" />
            <p v-if="accountError" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ accountError }}</p>
          </template>

          <!-- ── Preferences ── -->
          <template v-else-if="activePanel === 'preferences'">
            <DynamicForm :schema="UpdatePreferencesSchema" :actions="preferencesActions" />
            <p v-if="accountError" class="mt-3 text-sm text-red-600 dark:text-red-400">{{ accountError }}</p>
          </template>

          <!-- ── Two-Factor Auth ── -->
          <template v-else-if="activePanel === '2fa'">
            <p v-if="statusLoading" class="text-sm text-gray-400">Loading status…</p>
            <p v-else-if="statusError" class="text-sm text-red-500">{{ statusError }}</p>

            <!-- 2FA ENABLED -->
            <template v-else-if="status?.totp_enabled">
              <div class="mb-6 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 text-sm">
                <p class="font-medium text-green-800 dark:text-green-300 mb-1">Two-factor authentication is enabled</p>
                <p class="text-green-700 dark:text-green-400">
                  Enabled {{ status.totp_enabled_at ? 'on ' + new Date(status.totp_enabled_at).toLocaleDateString() : '' }} ·
                  {{ status.recovery_codes_remaining }} recovery codes remaining
                </p>
              </div>

              <!-- Recovery codes display -->
              <div v-if="recoveryCodes" class="mb-6 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-800 p-4">
                <p class="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Save your new recovery codes</p>
                <p class="text-xs text-amber-700 dark:text-amber-400 mb-3">These codes will only be shown once.</p>
                <div class="grid grid-cols-2 gap-1 mb-3">
                  <code v-for="code in recoveryCodes" :key="code" class="block font-mono text-xs bg-white dark:bg-gray-900 rounded px-2 py-1 text-gray-700 dark:text-gray-200">{{ code }}</code>
                </div>
                <button class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline" @click="clearRecoveryCodes">Done</button>
              </div>

              <!-- Regenerate form -->
              <div v-if="show2faAction === 'regen'" class="mb-4 space-y-3">
                <p class="text-sm text-gray-600 dark:text-gray-400">Enter your 6-digit authenticator code to generate 8 new recovery codes.</p>
                <input
                  v-model="actionCode"
                  type="text" inputmode="numeric" maxlength="10" autocomplete="one-time-code" placeholder="000000"
                  class="w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono tracking-widest text-center text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p v-if="regenError" class="text-xs text-red-500">{{ regenError }}</p>
                <div class="flex gap-2">
                  <button
                    :disabled="regenLoading || actionCode.length < 6"
                    class="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    @click="handleRegen"
                  >{{ regenLoading ? 'Generating…' : 'Generate new codes' }}</button>
                  <button class="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800" @click="show2faAction = null; actionCode = ''">Cancel</button>
                </div>
              </div>

              <!-- Disable form -->
              <div v-else-if="show2faAction === 'disable'" class="mb-4 space-y-3">
                <p class="text-sm text-gray-600 dark:text-gray-400">Enter your authenticator code or a recovery code to disable 2FA.</p>
                <input
                  v-model="actionCode"
                  type="text" inputmode="numeric" maxlength="10" autocomplete="one-time-code" placeholder="000000"
                  class="w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono tracking-widest text-center text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p v-if="disableError" class="text-xs text-red-500">{{ disableError }}</p>
                <div class="flex gap-2">
                  <button
                    :disabled="disableLoading || actionCode.length < 6"
                    class="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    @click="handleDisable"
                  >{{ disableLoading ? 'Disabling…' : 'Disable 2FA' }}</button>
                  <button class="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800" @click="show2faAction = null; actionCode = ''">Cancel</button>
                </div>
              </div>

              <!-- Action buttons -->
              <div v-else-if="!recoveryCodes" class="flex gap-3 flex-wrap">
                <button class="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800" @click="show2faAction = 'regen'; actionCode = ''">Regenerate recovery codes</button>
                <button class="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700" @click="show2faAction = 'disable'; actionCode = ''">Disable 2FA</button>
              </div>
            </template>

            <!-- 2FA DISABLED -->
            <template v-else-if="status && !status.totp_enabled">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">Two-factor authentication adds an extra layer of security to your account.</p>

              <!-- Setup: show QR -->
              <template v-if="setupUri">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.</p>
                <canvas ref="qrCanvas" class="rounded-lg border border-gray-200 dark:border-gray-700 mb-4" />
                <p class="text-xs text-gray-400 mb-6">Can't scan? <span class="font-mono select-all text-gray-600 dark:text-gray-300">{{ totpSecret }}</span></p>
                <div class="space-y-3">
                  <input
                    v-model="enableCode"
                    type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000"
                    class="w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono tracking-widest text-center text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p v-if="enableError" class="text-xs text-red-500">{{ enableError }}</p>
                  <div class="flex gap-2">
                    <button
                      :disabled="enableLoading || enableCode.length < 6"
                      class="px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                      @click="handleEnable"
                    >{{ enableLoading ? 'Enabling…' : 'Enable 2FA' }}</button>
                    <button class="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800" @click="cancelSetup">Cancel</button>
                  </div>
                </div>

                <!-- Recovery codes after enable -->
                <div v-if="recoveryCodes" class="mt-6 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-800 p-4">
                  <p class="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Save your recovery codes</p>
                  <p class="text-xs text-amber-700 dark:text-amber-400 mb-3">These codes will only be shown once.</p>
                  <div class="grid grid-cols-2 gap-1 mb-3">
                    <code v-for="code in recoveryCodes" :key="code" class="block font-mono text-xs bg-white dark:bg-gray-900 rounded px-2 py-1 text-gray-700 dark:text-gray-200">{{ code }}</code>
                  </div>
                  <button class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline" @click="clearRecoveryCodes">Done</button>
                </div>
              </template>

              <!-- Setup: button to start -->
              <template v-else>
                <p v-if="setupError" class="text-sm text-red-500 mb-3">{{ setupError }}</p>
                <button
                  :disabled="setupLoading"
                  class="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  @click="startSetup"
                >{{ setupLoading ? 'Setting up…' : 'Enable two-factor authentication' }}</button>
              </template>
            </template>
          </template>

          <!-- ── Sessions ── -->
          <template v-else-if="activePanel === 'sessions'">
            <p v-if="sessionsLoading" class="text-sm text-gray-400">Loading sessions…</p>
            <p v-else-if="sessionsError" class="text-sm text-red-500">{{ sessionsError }}</p>
            <div v-else class="space-y-3">
              <div
                v-for="session in sessions"
                :key="session.id"
                class="flex items-start justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div class="text-sm">
                  <p class="font-mono text-xs text-gray-700 dark:text-gray-200">{{ session.id }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Created {{ new Date(session.created_at).toLocaleDateString() }} ·
                    Expires {{ new Date(session.expires_at).toLocaleDateString() }}
                  </p>
                </div>
                <button
                  class="text-xs text-red-600 dark:text-red-400 hover:underline ml-4 shrink-0"
                  @click="revokeSession(session.id)"
                >Revoke</button>
              </div>
              <p v-if="!sessions.length" class="text-sm text-gray-400 text-center py-4">No active sessions found.</p>
            </div>
          </template>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, inject } from 'vue'
import QRCode from 'qrcode'
import { DynamicForm, type FormAction } from '@/shared/presentation/components/forms'
import {
  UpdateProfileSchema,
  ChangePasswordSchema,
  UpdatePreferencesSchema,
  type UpdateProfileDto,
  type ChangePasswordDto,
  type UpdatePreferencesDto,
} from '@/modules/account/business'
import { useAccount } from '@/modules/account/presentation/composables/useAccount'
import { useTotp } from '@/modules/authentication/presentation/composables/useTotp'
import { HTTP_CLIENT_KEY } from '@/shared/integration'
import { UserRepository } from '@/modules/authentication/integration'

type Panel = 'account' | 'password' | 'preferences' | '2fa' | 'sessions' | null

// ── Account / Profile ──────────────────────────────────────────────
const { error: accountError, authStore, updateProfile, changePassword, updatePreferences } = useAccount()

// ── TOTP ───────────────────────────────────────────────────────────
const {
  status, statusLoading, statusError, fetchStatus,
  setupUri, setupLoading, setupError, startSetup,
  enableLoading, enableError, enable,
  disableLoading, disableError, disable,
  regenLoading, regenError, regenerateCodes,
  recoveryCodes, clearRecoveryCodes,
} = useTotp()

// ── Sessions ───────────────────────────────────────────────────────
const sessionsLoading = ref(false)
const sessionsError = ref<string | null>(null)
const sessions = ref<Array<{ id: string; created_at: string; expires_at: string }>>([])

const adaptedClient = inject(HTTP_CLIENT_KEY)!
const userRepository = new UserRepository(adaptedClient)

async function loadSessions() {
  sessionsLoading.value = true
  sessionsError.value = null
  const result = await userRepository.listSessions()
  sessionsLoading.value = false
  if (result.isSuccess) {
    sessions.value = result.value as typeof sessions.value
  } else {
    sessionsError.value = result.error
  }
}

async function revokeSession(id: string) {
  const result = await userRepository.revokeSession(id)
  if (result.isSuccess) {
    sessions.value = sessions.value.filter(s => s.id !== id)
  }
}

// ── Panel state ────────────────────────────────────────────────────
const activePanel = ref<Panel>(null)
const show2faAction = ref<'regen' | 'disable' | null>(null)
const actionCode = ref('')
const enableCode = ref('')
const qrCanvas = ref<HTMLCanvasElement | null>(null)

const panelTitle = computed(() => {
  const titles: Record<string, string> = {
    account: 'Edit Account',
    password: 'Change Password',
    preferences: 'Preferences',
    '2fa': 'Two-Factor Authentication',
    sessions: 'Active Sessions',
  }
  return activePanel.value ? titles[activePanel.value] ?? '' : ''
})

function open(panel: NonNullable<Panel>) {
  activePanel.value = panel
  // Side effects on open
  if (panel === '2fa' && !status.value) fetchStatus()
  if (panel === 'sessions') loadSessions()
  // Reset sub-state
  show2faAction.value = null
  actionCode.value = ''
  enableCode.value = ''
}

function close() {
  activePanel.value = null
}

// ── QR code rendering ──────────────────────────────────────────────
const totpSecret = computed(() => {
  if (!setupUri.value) return ''
  return setupUri.value.match(/[?&]secret=([^&]+)/)?.[1] ?? ''
})

watch([setupUri, qrCanvas], async ([uri, canvas]) => {
  if (uri && canvas) {
    await nextTick()
    await QRCode.toCanvas(canvas, uri, { width: 200, margin: 2 })
  }
})

// ── Prefetch TOTP status on mount ──────────────────────────────────
onMounted(() => fetchStatus())

// ── Profile form ───────────────────────────────────────────────────
const profileInitialValues = computed(() => ({
  first_name: authStore.user?.first_name ?? '',
  last_name: authStore.user?.last_name ?? '',
  email: authStore.user?.email ?? '',
}))

const profileActions: FormAction[] = [
  {
    label: 'Save Changes',
    variant: 'primary',
    callback: async (values) => {
      const result = await updateProfile(values as UpdateProfileDto)
      if (result.isSuccess) close()
    },
  },
]

const passwordActions: FormAction[] = [
  {
    label: 'Update Password',
    variant: 'primary',
    callback: async (values) => {
      const result = await changePassword(values as ChangePasswordDto)
      if (result.isSuccess) close()
    },
  },
]

const preferencesActions: FormAction[] = [
  {
    label: 'Save Preferences',
    variant: 'primary',
    callback: async (values) => {
      const result = await updatePreferences(values as UpdatePreferencesDto)
      if (result.isSuccess) close()
    },
  },
]

// ── 2FA actions ────────────────────────────────────────────────────
async function handleEnable() {
  const ok = await enable(enableCode.value)
  if (ok) enableCode.value = ''
}

async function handleDisable() {
  const ok = await disable(actionCode.value)
  if (ok) { show2faAction.value = null; actionCode.value = '' }
}

async function handleRegen() {
  const ok = await regenerateCodes(actionCode.value)
  if (ok) { show2faAction.value = null; actionCode.value = '' }
}

function cancelSetup() {
  setupUri.value = null
  enableCode.value = ''
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

.slide-enter-active,
.slide-leave-active { transition: transform 0.25s ease; }
.slide-enter-from,
.slide-leave-to { transform: translateX(100%); }
</style>
