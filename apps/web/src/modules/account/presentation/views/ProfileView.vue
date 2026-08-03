<template>
  <div class="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
    <div class="mx-auto max-w-3xl px-4">
      <h1 class="mb-8 text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>

      <Tabs v-model="activeTab" :tabs="tabList">
        <template #profile>
          <Card>
            <h2 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
              Profile Information
            </h2>
            <DynamicForm
              :schema="UpdateProfileSchema"
              :initial-values="profileInitialValues"
              :actions="profileActions"
            />
            <p v-if="error" class="mt-4 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
          </Card>
        </template>

        <template #security>
          <!-- Change Password -->
          <Card class="mb-4">
            <h2 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
              Change Password
            </h2>
            <DynamicForm :schema="ChangePasswordSchema" :actions="securityActions" />
            <p v-if="error" class="mt-4 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
          </Card>

          <!-- Two-Factor Authentication -->
          <Card>
            <div class="flex items-center justify-between mb-6">
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Two-Factor Authentication
                </h2>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Add an extra layer of security to your account.
                </p>
              </div>
              <span
                v-if="!statusLoading && status"
                :class="status.totp_enabled
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
                class="px-2.5 py-0.5 rounded-full text-xs font-medium"
              >
                {{ status.totp_enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </div>

            <p v-if="statusLoading" class="text-sm text-gray-400">Loading status…</p>
            <p v-else-if="statusError" class="text-sm text-red-500">{{ statusError }}</p>

            <!-- ── 2FA ENABLED VIEW ── -->
            <template v-else-if="status?.totp_enabled">
              <div class="space-y-1 mb-6 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  Enabled since:
                  <span class="text-gray-700 dark:text-gray-200">
                    {{ status.totp_enabled_at ? new Date(status.totp_enabled_at).toLocaleDateString() : '—' }}
                  </span>
                </p>
                <p>
                  Recovery codes remaining:
                  <span class="text-gray-700 dark:text-gray-200">{{ status.recovery_codes_remaining }}</span>
                </p>
              </div>

              <!-- Recovery codes display (after regen) -->
              <div v-if="recoveryCodes" class="mb-6 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-800 p-4">
                <p class="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  Save your new recovery codes
                </p>
                <p class="text-xs text-amber-700 dark:text-amber-400 mb-3">
                  These codes will only be shown once. Store them somewhere safe.
                </p>
                <div class="grid grid-cols-2 gap-1">
                  <code
                    v-for="code in recoveryCodes"
                    :key="code"
                    class="block font-mono text-xs bg-white dark:bg-gray-900 rounded px-2 py-1 text-gray-700 dark:text-gray-200"
                  >{{ code }}</code>
                </div>
                <Button variant="secondary" size="sm" class="mt-3" @click="clearRecoveryCodes">
                  Done
                </Button>
              </div>

              <!-- Regenerate codes form -->
              <div v-if="showRegenForm" class="mb-4 space-y-3">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Enter your authenticator code to generate 8 new recovery codes.
                </p>
                <input
                  v-model="regenCode"
                  type="text"
                  inputmode="numeric"
                  maxlength="10"
                  autocomplete="one-time-code"
                  placeholder="000000"
                  class="w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono tracking-widest text-center text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p v-if="regenError" class="text-xs text-red-500">{{ regenError }}</p>
                <div class="flex gap-2">
                  <Button variant="primary" size="sm" :disabled="regenLoading || regenCode.length < 6" @click="handleRegen">
                    {{ regenLoading ? 'Generating…' : 'Generate new codes' }}
                  </Button>
                  <Button variant="secondary" size="sm" @click="showRegenForm = false; regenCode = ''">
                    Cancel
                  </Button>
                </div>
              </div>

              <!-- Disable form -->
              <div v-if="showDisableForm" class="mb-4 space-y-3">
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Enter your authenticator code or a recovery code to disable 2FA.
                </p>
                <input
                  v-model="disableCode"
                  type="text"
                  inputmode="numeric"
                  maxlength="10"
                  autocomplete="one-time-code"
                  placeholder="000000"
                  class="w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono tracking-widest text-center text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p v-if="disableError" class="text-xs text-red-500">{{ disableError }}</p>
                <div class="flex gap-2">
                  <Button variant="danger" size="sm" :disabled="disableLoading || disableCode.length < 6" @click="handleDisable">
                    {{ disableLoading ? 'Disabling…' : 'Disable 2FA' }}
                  </Button>
                  <Button variant="secondary" size="sm" @click="showDisableForm = false; disableCode = ''">
                    Cancel
                  </Button>
                </div>
              </div>

              <!-- Action buttons (when no inline form open) -->
              <div v-if="!showDisableForm && !showRegenForm && !recoveryCodes" class="flex gap-3 flex-wrap">
                <Button variant="secondary" size="sm" @click="showRegenForm = true">
                  Regenerate recovery codes
                </Button>
                <Button variant="danger" size="sm" @click="showDisableForm = true">
                  Disable 2FA
                </Button>
              </div>
            </template>

            <!-- ── 2FA DISABLED VIEW ── -->
            <template v-else-if="status && !status.totp_enabled">
              <!-- Step 2: Show QR code + code entry -->
              <template v-if="setupUri">
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.), then enter the 6-digit code below to confirm.
                </p>
                <canvas ref="qrCanvas" class="rounded-lg border border-gray-200 dark:border-gray-700 mb-4" />
                <p class="text-xs text-gray-400 mb-6">
                  Can't scan?
                  <span class="font-mono select-all text-gray-600 dark:text-gray-300">{{ totpSecret }}</span>
                </p>

                <div class="space-y-3">
                  <input
                    v-model="enableCode"
                    type="text"
                    inputmode="numeric"
                    maxlength="6"
                    autocomplete="one-time-code"
                    placeholder="000000"
                    class="w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-mono tracking-widest text-center text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p v-if="enableError" class="text-xs text-red-500">{{ enableError }}</p>
                  <div class="flex gap-2">
                    <Button variant="primary" size="sm" :disabled="enableLoading || enableCode.length < 6" @click="handleEnable">
                      {{ enableLoading ? 'Enabling…' : 'Enable 2FA' }}
                    </Button>
                    <Button variant="secondary" size="sm" @click="cancelSetup">Cancel</Button>
                  </div>
                </div>
              </template>

              <!-- Step 1: Entry point -->
              <template v-else>
                <p v-if="setupError" class="text-sm text-red-500 mb-3">{{ setupError }}</p>
                <Button variant="primary" size="sm" :disabled="setupLoading" @click="handleStartSetup">
                  {{ setupLoading ? 'Setting up…' : 'Enable two-factor authentication' }}
                </Button>
              </template>

              <!-- Step 3: Recovery codes after enable -->
              <div v-if="recoveryCodes" class="mt-6 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:border-amber-800 p-4">
                <p class="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  Save your recovery codes
                </p>
                <p class="text-xs text-amber-700 dark:text-amber-400 mb-3">
                  These codes will only be shown once. Store them somewhere safe.
                </p>
                <div class="grid grid-cols-2 gap-1">
                  <code
                    v-for="code in recoveryCodes"
                    :key="code"
                    class="block font-mono text-xs bg-white dark:bg-gray-900 rounded px-2 py-1 text-gray-700 dark:text-gray-200"
                  >{{ code }}</code>
                </div>
                <Button variant="secondary" size="sm" class="mt-3" @click="clearRecoveryCodes">
                  Done
                </Button>
              </div>
            </template>
          </Card>
        </template>

        <template #preferences>
          <Card>
            <h2 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>
            <DynamicForm :schema="UpdatePreferencesSchema" :actions="preferencesActions" />
            <p v-if="error" class="mt-4 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
          </Card>
        </template>

        <template #danger>
          <Card variant="bordered" class="border-red-200 dark:border-red-900">
            <h2 class="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
            <p class="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button variant="danger" @click="showDeleteModal = true">Delete Account</Button>
          </Card>
        </template>
      </Tabs>

      <Dialog
        :open="showDeleteModal"
        title="Confirm Account Deletion"
        description="Enter your password to confirm deletion."
        @update:open="showDeleteModal = $event"
      >
        <FormPasswordInput
          v-model="deletePassword"
          name="delete-password"
          placeholder="Your password"
        />

        <template #footer>
          <Button variant="secondary" @click="showDeleteModal = false">Cancel</Button>
          <Button variant="danger" @click="handleDeleteAccount">Delete Account</Button>
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import QRCode from 'qrcode'
import { DynamicForm, FormPasswordInput, type FormAction } from '@/shared/presentation/components/forms'
import { Button, Card, Tabs, Dialog } from '@/shared/presentation/components/ui'
import {
  UpdateProfileSchema,
  ChangePasswordSchema,
  UpdatePreferencesSchema,
  type UpdateProfileDto,
  type ChangePasswordDto,
  type UpdatePreferencesDto,
} from '../../business'
import { useAccount } from '../composables/useAccount'
import { useTotp } from '@/modules/authentication/presentation/composables/useTotp'

const { error, authStore, updateProfile, changePassword, updatePreferences, deleteAccount } =
  useAccount()

const {
  status,
  statusLoading,
  statusError,
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

const activeTab = ref('profile')
const showDeleteModal = ref(false)
const deletePassword = ref('')

// 2FA UI state
const showDisableForm = ref(false)
const showRegenForm = ref(false)
const enableCode = ref('')
const disableCode = ref('')
const regenCode = ref('')
const qrCanvas = ref<HTMLCanvasElement | null>(null)

const tabList = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'danger', label: 'Danger Zone' },
]

const profileInitialValues = computed(() => ({
  first_name: authStore.user?.first_name || '',
  last_name: authStore.user?.last_name || '',
  email: authStore.user?.email || '',
}))

// Extract the TOTP secret from the otpauth URI for manual entry
const totpSecret = computed(() => {
  if (!setupUri.value) return ''
  const match = setupUri.value.match(/[?&]secret=([^&]+)/)
  return match?.[1] ?? ''
})

// Render QR code to canvas whenever the URI is set
watch([setupUri, qrCanvas], async ([uri, canvas]) => {
  if (uri && canvas) {
    await nextTick()
    await QRCode.toCanvas(canvas, uri, { width: 200, margin: 2 })
  }
})

// Fetch 2FA status when the security tab becomes active
watch(activeTab, (tab) => {
  if (tab === 'security' && !status.value) {
    fetchStatus()
  }
})

const profileActions: FormAction[] = [
  {
    label: 'Save Changes',
    variant: 'primary',
    callback: async (values) => {
      await updateProfile(values as UpdateProfileDto)
    },
  },
]

const securityActions: FormAction[] = [
  {
    label: 'Update Password',
    variant: 'primary',
    callback: async (values) => {
      await changePassword(values as ChangePasswordDto)
    },
  },
]

const preferencesActions: FormAction[] = [
  {
    label: 'Save Preferences',
    variant: 'primary',
    callback: async (values) => {
      await updatePreferences(values as UpdatePreferencesDto)
    },
  },
]

const handleDeleteAccount = async () => {
  await deleteAccount(deletePassword.value)
  showDeleteModal.value = false
}

async function handleStartSetup() {
  await startSetup()
}

async function handleEnable() {
  const ok = await enable(enableCode.value)
  if (ok) enableCode.value = ''
}

async function handleDisable() {
  const ok = await disable(disableCode.value)
  if (ok) {
    showDisableForm.value = false
    disableCode.value = ''
  }
}

async function handleRegen() {
  const ok = await regenerateCodes(regenCode.value)
  if (ok) {
    showRegenForm.value = false
    regenCode.value = ''
  }
}

function cancelSetup() {
  // Clear the URI so the entry-point button shows again
  setupUri.value = null
  enableCode.value = ''
}
</script>
