<template>
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
      <button
        class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        @click="openCreate"
      >
        + Create User
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="search"
        placeholder="Search by name or email…"
        class="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm w-64 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500"
        @input="onSearch"
      />
      <select
        v-model="statusFilter"
        class="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        @change="onSearch"
      >
        <option value="">All statuses</option>
        <option v-for="opt in enums.status" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <select
        v-model="roleFilter"
        class="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        @change="onSearch"
      >
        <option value="">All roles</option>
        <option v-for="r in allRoles" :key="r.id" :value="r.name">{{ r.display_name }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow">
      <div v-if="isLoading" class="p-8 text-center text-gray-400 text-sm">Loading…</div>
      <div v-else-if="error" class="p-8 text-center text-red-500 text-sm">{{ error }}</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm min-w-[640px]">
          <thead class="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Name</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Email</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Created</th>
              <th class="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in users"
              :key="user.id"
              class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td class="px-4 py-3 text-gray-900 dark:text-white font-medium">
                {{ user.first_name }} {{ user.last_name }}
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400">{{ user.email }}</td>
              <td class="px-4 py-3">
                <span :class="statusClass(user.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                  {{ user.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ formatDate(user.created_at) }}</td>
              <td class="px-4 py-3 text-right">
                <RowActionMenu :items="rowActions(user)" />
              </td>
            </tr>
            <tr v-if="!users.length">
              <td colspan="5" class="px-4 py-8 text-center text-gray-400 text-sm">No users found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div class="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
      <span>Showing {{ users.length }} of {{ total }}</span>
      <div class="flex gap-2">
        <button
          :disabled="offset === 0"
          class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          @click="prev"
        >Prev</button>
        <button
          :disabled="offset + limit >= total"
          class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          @click="next"
        >Next</button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════
         USER DETAIL DRAWER (slide-over)
         ════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <!-- backdrop -->
      <Transition name="fade">
        <div v-if="drawerOpen" class="fixed inset-0 z-40 bg-black/30" @click="drawerOpen = false" />
      </Transition>

      <!-- panel -->
      <Transition name="slide">
        <div v-if="drawerOpen" class="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl">

          <!-- Drawer header -->
          <div class="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div v-if="drawerUser">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ drawerUser.full_name }}</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ drawerUser.email }}</p>
              <p class="text-xs text-gray-400 mt-0.5 font-mono">{{ drawerUser.id }}</p>
            </div>
            <div v-else class="space-y-1">
              <div class="h-5 w-48 bg-gray-100 dark:bg-gray-700 animate-pulse rounded" />
              <div class="h-4 w-64 bg-gray-100 dark:bg-gray-700 animate-pulse rounded" />
            </div>
            <div class="flex items-center gap-2 ml-4 shrink-0">
              <template v-if="drawerUser">
                <button
                  v-if="drawerUser.status === 'ACTIVE'"
                  class="px-3 py-1.5 text-xs border border-yellow-400 text-yellow-700 dark:text-yellow-400 rounded hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                  @click="drawerToggleStatus"
                >Suspend</button>
                <button
                  v-else
                  class="px-3 py-1.5 text-xs border border-green-400 text-green-700 dark:text-green-400 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                  @click="drawerToggleStatus"
                >Activate</button>
              </template>
              <button
                class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                @click="drawerOpen = false"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Drawer tabs -->
          <div class="flex border-b border-gray-200 dark:border-gray-700 shrink-0 overflow-x-auto">
            <button
              v-for="t in DRAWER_TABS"
              :key="t.key"
              class="px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap"
              :class="drawerTab === t.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
              @click="drawerTab = t.key"
            >{{ t.label }}</button>
          </div>

          <!-- Drawer body -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="drawerLoading" class="p-8 text-center text-gray-400 text-sm">Loading…</div>

            <template v-else-if="drawerUser">

              <!-- ── Overview ── -->
              <div v-if="drawerTab === 'overview'" class="p-6 space-y-6">
                <dl class="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">First name</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ drawerUser.first_name }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Last name</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ drawerUser.last_name }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Email</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ drawerUser.email }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd class="mt-0.5">
                      <span :class="statusClass(drawerUser.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                        {{ drawerUser.status }}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Created</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ formatDate(drawerUser.created_at) }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ drawerUser.profile?.phone || '—' }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Country</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ drawerUser.profile?.country || '—' }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Timezone</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ drawerUser.preferences?.timezone || '—' }}</dd>
                  </div>
                </dl>

                <div>
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Roles ({{ drawerUser.roles.length }})</p>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="r in drawerUser.roles"
                      :key="r.id"
                      class="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full"
                    >{{ r.display_name }}</span>
                    <span v-if="!drawerUser.roles.length" class="text-xs text-gray-400 italic">No roles assigned</span>
                  </div>
                </div>

                <div>
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Effective Permissions ({{ drawerUser.permissions.length }})
                  </p>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="p in drawerUser.permissions"
                      :key="p.id"
                      class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-mono rounded"
                    >{{ p.resource }}:{{ p.action }}<span v-if="p.scope !== 'ALL'" class="text-gray-400"> ({{ p.scope }})</span></span>
                    <span v-if="!drawerUser.permissions.length" class="text-xs text-gray-400 italic">None</span>
                  </div>
                </div>
              </div>

              <!-- ── Edit (Identity + Profile + Preferences) ── -->
              <div v-if="drawerTab === 'edit'" class="p-6 space-y-8">

                <!-- Identity -->
                <section>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Identity</h3>
                  <p
                    v-if="drawerMsg.identity"
                    :class="drawerMsg.identity.type === 'error' ? 'text-red-600 bg-red-50 dark:bg-red-950' : 'text-green-700 bg-green-50 dark:bg-green-950'"
                    class="text-sm rounded px-3 py-2 mb-3"
                  >{{ drawerMsg.identity.text }}</p>
                  <div class="space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">First name</label>
                        <input v-model="identityForm.first_name" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Last name</label>
                        <input v-model="identityForm.last_name" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
                      <input v-model="identityForm.email" type="email" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <button
                    :disabled="saving.identity"
                    class="mt-3 px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40"
                    @click="saveIdentity"
                  >{{ saving.identity ? 'Saving…' : 'Save Identity' }}</button>
                </section>

                <hr class="border-gray-200 dark:border-gray-700" />

                <!-- Profile -->
                <section>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Profile</h3>
                  <p
                    v-if="drawerMsg.profile"
                    :class="drawerMsg.profile.type === 'error' ? 'text-red-600 bg-red-50 dark:bg-red-950' : 'text-green-700 bg-green-50 dark:bg-green-950'"
                    class="text-sm rounded px-3 py-2 mb-3"
                  >{{ drawerMsg.profile.text }}</p>
                  <div class="space-y-3">
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone</label>
                        <input v-model="profileForm.phone" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Country (2-letter)</label>
                        <input v-model="profileForm.country" maxlength="2" placeholder="US" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Address line 1</label>
                      <input v-model="profileForm.address_line_1" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Address line 2</label>
                      <input v-model="profileForm.address_line_2" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div class="grid grid-cols-3 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">City</label>
                        <input v-model="profileForm.city" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">State</label>
                        <input v-model="profileForm.state" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Postal code</label>
                        <input v-model="profileForm.postal_code" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                    </div>
                  </div>
                  <button
                    :disabled="saving.profile"
                    class="mt-3 px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40"
                    @click="saveProfile"
                  >{{ saving.profile ? 'Saving…' : 'Save Profile' }}</button>
                </section>

                <hr class="border-gray-200 dark:border-gray-700" />

                <!-- Preferences -->
                <section>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Preferences</h3>
                  <p
                    v-if="drawerMsg.prefs"
                    :class="drawerMsg.prefs.type === 'error' ? 'text-red-600 bg-red-50 dark:bg-red-950' : 'text-green-700 bg-green-50 dark:bg-green-950'"
                    class="text-sm rounded px-3 py-2 mb-3"
                  >{{ drawerMsg.prefs.text }}</p>
                  <div class="space-y-3">
                    <div class="grid grid-cols-3 gap-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Theme</label>
                        <select v-model="prefsForm.theme" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Language</label>
                        <input v-model="prefsForm.language" placeholder="en" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Timezone</label>
                        <input v-model="prefsForm.timezone" placeholder="UTC" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                    </div>
                    <div class="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input v-model="prefsForm.notify_email" type="checkbox" class="rounded" />
                        Email notifications
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input v-model="prefsForm.notify_push" type="checkbox" class="rounded" />
                        Push notifications
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input v-model="prefsForm.notify_sms" type="checkbox" class="rounded" />
                        SMS notifications
                      </label>
                    </div>
                  </div>
                  <button
                    :disabled="saving.prefs"
                    class="mt-3 px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40"
                    @click="savePrefs"
                  >{{ saving.prefs ? 'Saving…' : 'Save Preferences' }}</button>
                </section>
              </div>

              <!-- ── Security ── -->
              <div v-if="drawerTab === 'security'" class="p-6 space-y-8">

                <!-- 2FA status -->
                <section>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Two-Factor Authentication</h3>
                  <div v-if="drawerTotpStatus" class="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                    <!-- Status row -->
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span
                          :class="drawerTotpStatus.totp_enabled
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
                          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        >
                          <span
                            :class="drawerTotpStatus.totp_enabled ? 'bg-green-500' : 'bg-gray-400'"
                            class="w-1.5 h-1.5 rounded-full"
                          />
                          {{ drawerTotpStatus.totp_enabled ? 'Enabled' : 'Disabled' }}
                        </span>
                        <span v-if="drawerTotpStatus.totp_enabled && drawerTotpStatus.totp_enabled_at" class="text-xs text-gray-400">
                          since {{ formatDate(drawerTotpStatus.totp_enabled_at) }}
                        </span>
                      </div>
                      <div v-if="drawerTotpStatus.totp_enabled" class="text-xs text-gray-500 dark:text-gray-400">
                        {{ drawerTotpStatus.recovery_codes_remaining }} recovery code{{ drawerTotpStatus.recovery_codes_remaining !== 1 ? 's' : '' }} remaining
                      </div>
                    </div>

                    <!-- Force-disable -->
                    <div v-if="drawerTotpStatus.totp_enabled" class="border-t border-gray-100 dark:border-gray-700 pt-4">
                      <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                        Force-disabling 2FA will remove the user's authenticator secret and all recovery codes.
                        Use this if a user is locked out.
                      </p>
                      <p v-if="disable2faError" class="text-xs text-red-600 bg-red-50 dark:bg-red-950 rounded px-3 py-2 mb-3">
                        {{ disable2faError }}
                      </p>
                      <button
                        :disabled="disable2faLoading"
                        class="px-3 py-1.5 text-xs border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
                        @click="handleDisable2fa"
                      >{{ disable2faLoading ? 'Disabling…' : 'Force disable 2FA' }}</button>
                    </div>

                    <div v-else class="text-xs text-gray-400 italic">
                      This user has not enabled two-factor authentication.
                    </div>
                  </div>
                  <div v-else class="text-sm text-gray-400">Loading 2FA status…</div>
                </section>

                <!-- Change Password -->
                <section>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">Change Password</h3>
                  <p class="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded px-3 py-2 mb-4">
                    The backend requires the user's current password. A force-reset endpoint would bypass this.
                  </p>
                  <p
                    v-if="drawerMsg.pw"
                    :class="drawerMsg.pw.type === 'error' ? 'text-red-600 bg-red-50 dark:bg-red-950' : 'text-green-700 bg-green-50 dark:bg-green-950'"
                    class="text-sm rounded px-3 py-2 mb-4"
                  >{{ drawerMsg.pw.text }}</p>
                  <div class="space-y-3 max-w-sm">
                    <div>
                      <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Current password</label>
                      <input v-model="pwForm.current_password" type="password" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">New password</label>
                      <input v-model="pwForm.new_password" type="password" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Confirm new password</label>
                      <input v-model="pwForm.repassword" type="password" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <button
                    :disabled="saving.pw"
                    class="mt-4 px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40"
                    @click="savePw"
                  >{{ saving.pw ? 'Changing…' : 'Change Password' }}</button>
                </section>
              </div>

              <!-- ── Roles ── -->
              <div v-if="drawerTab === 'roles'" class="p-6">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Assigned Roles</h3>
                <p v-if="drawerMsg.roles" class="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded px-3 py-2 mb-3">
                  {{ drawerMsg.roles }}
                </p>
                <div class="space-y-2 mb-4">
                  <div
                    v-for="role in drawerUser.roles"
                    :key="role.id"
                    class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">{{ role.display_name }}</span>
                      <span class="ml-2 text-xs text-gray-400 font-mono">{{ role.name }}</span>
                    </div>
                    <button class="text-xs text-red-500 hover:underline" @click="removeRole(role.id)">Remove</button>
                  </div>
                  <p v-if="!drawerUser.roles.length" class="text-sm text-gray-400 italic">No roles assigned.</p>
                </div>
                <div class="flex gap-2">
                  <select v-model="drawerRoleToAdd" class="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">Select role to assign…</option>
                    <option v-for="r in availableRolesToAdd" :key="r.id" :value="r.id">
                      {{ r.display_name }} ({{ r.name }})
                    </option>
                  </select>
                  <button
                    :disabled="!drawerRoleToAdd || saving.roles"
                    class="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40"
                    @click="addRole"
                  >{{ saving.roles ? '…' : 'Assign' }}</button>
                </div>
              </div>

              <!-- ── Direct Permissions ── -->
              <div v-if="drawerTab === 'permissions'" class="p-6">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">Direct Permission Assignments</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Grants access independently of roles.
                </p>
                <p v-if="drawerMsg.perms" class="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded px-3 py-2 mb-3">
                  {{ drawerMsg.perms }}
                </p>
                <div class="space-y-2 mb-4">
                  <div
                    v-for="dp in directPermDetails"
                    :key="dp.id"
                    class="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs font-mono text-gray-900 dark:text-white">
                        {{ dp.permission?.resource }}:{{ dp.permission?.action }}
                      </span>
                      <span class="px-1.5 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                        {{ dp.permission?.scope }}
                      </span>
                    </div>
                    <button class="text-xs text-red-500 hover:underline shrink-0" @click="removeDirectPerm(dp.permission_id)">
                      Revoke
                    </button>
                  </div>
                  <p v-if="!directPermDetails.length" class="text-sm text-gray-400 italic">No direct permissions assigned.</p>
                </div>
                <div class="flex gap-2">
                  <select v-model="drawerPermToAdd" class="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">Select permission to grant…</option>
                    <option v-for="p in availablePermsToAdd" :key="p.id" :value="p.id">
                      {{ p.resource }}:{{ p.action }} ({{ p.scope }})
                    </option>
                  </select>
                  <button
                    :disabled="!drawerPermToAdd || saving.perms"
                    class="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40"
                    @click="addDirectPerm"
                  >{{ saving.perms ? '…' : 'Grant' }}</button>
                </div>
              </div>

              <!-- ── Sessions ── -->
              <div v-if="drawerTab === 'sessions'" class="p-6">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Active Sessions</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Each entry is a live refresh token. Revoking forces the user to log in again on that device.</p>
                  </div>
                  <button
                    v-if="drawerSessions.length"
                    :disabled="saving.sessions"
                    class="shrink-0 px-3 py-1.5 text-xs text-red-600 border border-red-300 dark:border-red-700 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
                    @click="revokeAllSessions"
                  >Revoke All</button>
                </div>
                <p v-if="drawerMsg.sessions" class="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded px-3 py-2 mb-3">
                  {{ drawerMsg.sessions }}
                </p>
                <div class="space-y-2">
                  <div
                    v-for="s in drawerSessions"
                    :key="s.id"
                    class="flex items-center justify-between px-3 py-3 bg-gray-50 dark:bg-gray-800/60 rounded-lg border border-gray-100 dark:border-gray-700"
                  >
                    <div class="min-w-0 mr-3">
                      <p class="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">{{ s.id }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Started {{ formatDate(s.created_at) }}
                        <span class="mx-1 text-gray-300 dark:text-gray-600">·</span>
                        Expires {{ formatDate(s.expires_at) }}
                      </p>
                    </div>
                    <button
                      :disabled="saving.sessions"
                      class="shrink-0 px-2.5 py-1 text-xs text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
                      @click="revokeSession(s.id)"
                    >Revoke</button>
                  </div>
                  <div v-if="!drawerSessions.length" class="flex flex-col items-center justify-center py-10 text-center">
                    <svg class="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    <p class="text-sm text-gray-400 dark:text-gray-500">No active sessions</p>
                    <p class="text-xs text-gray-400 dark:text-gray-600 mt-1">This user has no live sessions right now.</p>
                  </div>
                </div>
              </div>

            </template>
          </div>

          <!-- Drawer footer: delete action -->
          <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0 flex items-center justify-between">
            <span class="text-xs text-gray-400">Danger zone</span>
            <button
              v-if="drawerUser"
              class="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              @click="openDeleteFromDrawer()"
            >
              Delete User
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════
         CREATE USER SIDE DRAWER
         ════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="createDrawerOpen" class="fixed inset-0 z-40 bg-black/30" @click="createDrawerOpen = false" />
      </Transition>
      <Transition name="slide">
        <div v-if="createDrawerOpen" class="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h2 class="text-base font-bold text-gray-900 dark:text-white">Create User</h2>
            <button class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400" @click="createDrawerOpen = false">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-4">
            <p v-if="createError" class="text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded px-3 py-2">{{ createError }}</p>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">First name *</label>
                <input v-model="createForm.first_name" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Last name *</label>
                <input v-model="createForm.last_name" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email *</label>
              <input v-model="createForm.email" type="email" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-medium text-gray-600 dark:text-gray-400">Password *</label>
                <button type="button" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline" @click="generatePassword">
                  Generate
                </button>
              </div>
              <div class="relative">
                <input
                  v-model="createForm.password"
                  :type="showPw ? 'text' : 'password'"
                  class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 pr-10 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  @click="showPw = !showPw"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
v-if="showPw" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    <path
v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Confirm password *</label>
              <input v-model="createForm.repassword" :type="showPw ? 'text' : 'password'" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono" />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
              <select v-model="createForm.status" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option v-for="opt in enums.status" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>

            <label class="flex items-start gap-3 cursor-pointer select-none">
              <input
                v-model="createForm.send_credentials"
                type="checkbox"
                class="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                <span class="block text-sm font-medium text-gray-900 dark:text-white">Send welcome email with credentials</span>
                <span class="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  The user will receive an email with their email and password.
                </span>
              </span>
            </label>

            <!-- Role chips multi-select -->
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Assign Roles (optional)</label>
              <!-- Selected chips -->
              <div v-if="createForm.role_ids.length" class="flex flex-wrap gap-1.5 mb-2">
                <span
                  v-for="roleId in createForm.role_ids"
                  :key="roleId"
                  class="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs rounded-full"
                >
                  {{ allRoles.find(r => r.id === roleId)?.display_name ?? roleId }}
                  <button
                    type="button"
                    class="hover:text-indigo-900 dark:hover:text-indigo-100 leading-none"
                    @click="removeRoleFromCreate(roleId)"
                  >×</button>
                </span>
              </div>
              <!-- Add role dropdown -->
              <select
                class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value=""
                @change="addRoleToCreate($event)"
              >
                <option value="">Add a role…</option>
                <option
                  v-for="r in rolesNotInCreate"
                  :key="r.id"
                  :value="r.id"
                >{{ r.display_name }} ({{ r.name }})</option>
              </select>
            </div>
          </div>

          <!-- Footer -->
          <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0 flex justify-end gap-2">
            <button
              class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              @click="createDrawerOpen = false"
            >Cancel</button>
            <button
              :disabled="creating || !createForm.first_name || !createForm.last_name || !createForm.email || !createForm.password"
              class="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40"
              @click="handleCreate"
            >{{ creating ? 'Creating…' : 'Create User' }}</button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════
         DELETE CONFIRM MODAL
         ════════════════════════════════════════════════════════════════ -->
    <div
      v-if="showDelete"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]"
      @click.self="showDelete = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">Delete User</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          This will soft-delete
          <strong class="text-gray-900 dark:text-white">{{ deleteTarget?.first_name }} {{ deleteTarget?.last_name }}</strong>.
          The backend requires the user's current password.
        </p>
        <div v-if="deleteError" class="text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded px-3 py-2">{{ deleteError }}</div>
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">User's password</label>
          <input v-model="deletePassword" type="password" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            @click="showDelete = false"
          >Cancel</button>
          <button
            :disabled="deleting || !deletePassword"
            class="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-40"
            @click="handleDelete"
          >{{ deleting ? 'Deleting…' : 'Delete' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import RowActionMenu from '../components/RowActionMenu.vue'
import type { MenuAction } from '../components/RowActionMenu.vue'
import { useAdminUsers } from '../composables/useAdminUsers'
import { useAdminRoles } from '../composables/useAdminRoles'
import { useAdminPermissions } from '../composables/useAdminPermissions'
import { useAdminMeta } from '../composables/useAdminMeta'
import type { AdminUserListItem } from '@/modules/admin/business/dtos/AdminUserDto'
import type { CurrentUserDto, SessionDto } from '@/modules/authentication/business/repositories/IUserRepository'
import type { UserDirectPermissionItem } from '@/modules/admin/business/dtos/AdminPermissionDto'

const {
  users, total, isLoading, error,
  listUsers, getUserDetail, createUser,
  updateUserIdentity, suspendUser, activateUser, changePassword, deleteUser,
  updateProfile, updatePreferences,
  assignRole, revokeRole,
  getUserDirectPermissions, assignDirectPermission, revokeDirectPermission,
  listUserSessions, revokeUserSession, revokeAllUserSessions,
  getUserTotpStatus, adminDisable2fa,
} = useAdminUsers()

const { roles: allRoles, listRoles } = useAdminRoles()
const { permissions: allPermissions, listPermissions } = useAdminPermissions()
const { enums, fetchEnums } = useAdminMeta()

// ── List / pagination ──────────────────────────────────────────────────────

const search = ref('')
const statusFilter = ref('')
const roleFilter = ref('')
const limit = 20
const offset = ref(0)
let searchTimer: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  await Promise.all([
    load(),
    listRoles({ limit: 1000 }),
    listPermissions({ limit: 1000 }),
    fetchEnums(),
  ])
})

async function load() {
  await listUsers({
    limit,
    offset: offset.value,
    search: search.value || undefined,
    status: statusFilter.value || undefined,
    role: roleFilter.value || undefined,
  })
}
function prev() { offset.value = Math.max(0, offset.value - limit); load() }
function next() { offset.value += limit; load() }
function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { offset.value = 0; load() }, 300)
}

// ── Row action menus ───────────────────────────────────────────────────────

function rowActions(user: AdminUserListItem): MenuAction[] {
  return [
    { label: 'View / Overview', action: () => openDrawer(user, 'overview') },
    { label: 'Edit Identity & Profile', action: () => openDrawer(user, 'edit') },
    { label: 'Change Password', action: () => openDrawer(user, 'security') },
    { label: 'Manage Roles', action: () => openDrawer(user, 'roles') },
    { label: 'Direct Permissions', action: () => openDrawer(user, 'permissions') },
    { label: 'Sessions', action: () => openDrawer(user, 'sessions') },
    { divider: true },
    user.status === 'ACTIVE'
      ? { label: 'Suspend', danger: true, action: () => quickSuspend(user) }
      : { label: 'Activate', action: () => quickActivate(user) },
    { label: 'Delete', danger: true, action: () => openDelete(user) },
  ]
}

async function quickSuspend(user: AdminUserListItem) {
  if (!confirm(`Suspend ${user.first_name} ${user.last_name}?`)) return
  await suspendUser(user.id)
}
async function quickActivate(user: AdminUserListItem) {
  await activateUser(user.id)
}

// ── DRAWER ─────────────────────────────────────────────────────────────────

const DRAWER_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'edit', label: 'Edit' },
  { key: 'security', label: 'Security' },
  { key: 'roles', label: 'Roles' },
  { key: 'permissions', label: 'Direct Permissions' },
  { key: 'sessions', label: 'Sessions' },
] as const
type DrawerTab = typeof DRAWER_TABS[number]['key']

const drawerOpen = ref(false)
const drawerTab = ref<DrawerTab>('overview')
const drawerUser = ref<CurrentUserDto | null>(null)
const drawerDirectPerms = ref<UserDirectPermissionItem[]>([])
const drawerLoading = ref(false)
const drawerRoleToAdd = ref('')
const drawerPermToAdd = ref('')

type Msg = { type: 'ok' | 'error'; text: string } | null
const drawerMsg = ref<{ identity: Msg; profile: Msg; prefs: Msg; pw: Msg; roles: string | null; perms: string | null; sessions: string | null }>({
  identity: null, profile: null, prefs: null, pw: null, roles: null, perms: null, sessions: null,
})
const saving = ref({ identity: false, profile: false, prefs: false, pw: false, roles: false, perms: false, sessions: false })

const drawerSessions = ref<SessionDto[]>([])
const drawerTotpStatus = ref<{ totp_enabled: boolean; totp_enabled_at: string | null; recovery_codes_remaining: number } | null>(null)
const disable2faLoading = ref(false)
const disable2faError = ref<string | null>(null)

const identityForm = ref({ first_name: '', last_name: '', email: '' })
const profileForm = ref({ phone: '', address_line_1: '', address_line_2: '', city: '', state: '', postal_code: '', country: '' })
const prefsForm = ref({ theme: 'light', language: 'en', timezone: 'UTC', notify_email: true, notify_push: false, notify_sms: false })
const pwForm = ref({ current_password: '', new_password: '', repassword: '' })

const availableRolesToAdd = computed(() =>
  allRoles.value.filter(r => !drawerUser.value?.roles.some(ur => ur.id === r.id)),
)

const directPermDetails = computed(() =>
  drawerDirectPerms.value
    .filter(dp => dp.status === 'ACTIVE')
    .map(dp => ({ ...dp, permission: allPermissions.value.find(p => p.id === dp.permission_id) })),
)

const availablePermsToAdd = computed(() =>
  allPermissions.value.filter(p =>
    !drawerDirectPerms.value.some(dp => dp.permission_id === p.id && dp.status === 'ACTIVE'),
  ),
)

async function openDrawer(user: AdminUserListItem, tab: DrawerTab = 'overview') {
  drawerOpen.value = true
  drawerTab.value = tab
  drawerUser.value = null
  drawerDirectPerms.value = []
  drawerSessions.value = []
  drawerTotpStatus.value = null
  disable2faError.value = null
  drawerLoading.value = true
  drawerMsg.value = { identity: null, profile: null, prefs: null, pw: null, roles: null, perms: null, sessions: null }
  drawerRoleToAdd.value = ''
  drawerPermToAdd.value = ''
  pwForm.value = { current_password: '', new_password: '', repassword: '' }

  try {
    const [detail, directPerms, sessions, totpStatus] = await Promise.all([
      getUserDetail(user.id),
      getUserDirectPermissions(user.id),
      listUserSessions(user.id).catch(() => [] as SessionDto[]),
      getUserTotpStatus(user.id).catch(() => null),
    ])
    drawerUser.value = detail
    drawerDirectPerms.value = directPerms
    drawerSessions.value = sessions
    drawerTotpStatus.value = totpStatus
    populateForms(detail)
  } catch {
    drawerOpen.value = false
  } finally {
    drawerLoading.value = false
  }
}

function populateForms(u: CurrentUserDto) {
  identityForm.value = { first_name: u.first_name, last_name: u.last_name, email: u.email }
  if (u.profile) {
    profileForm.value = {
      phone: u.profile.phone ?? '',
      address_line_1: u.profile.address_line_1 ?? '',
      address_line_2: u.profile.address_line_2 ?? '',
      city: u.profile.city ?? '',
      state: u.profile.state ?? '',
      postal_code: u.profile.postal_code ?? '',
      country: u.profile.country ?? '',
    }
  }
  if (u.preferences) {
    prefsForm.value = {
      theme: u.preferences.theme ?? 'light',
      language: u.preferences.language ?? 'en',
      timezone: u.preferences.timezone ?? 'UTC',
      notify_email: u.preferences.notify_email ?? true,
      notify_push: u.preferences.notify_push ?? false,
      notify_sms: u.preferences.notify_sms ?? false,
    }
  }
}

async function refreshDrawer() {
  if (!drawerUser.value) return
  const [detail, directPerms] = await Promise.all([
    getUserDetail(drawerUser.value.id),
    getUserDirectPermissions(drawerUser.value.id),
  ])
  drawerUser.value = detail
  drawerDirectPerms.value = directPerms
  populateForms(detail)
}

async function drawerToggleStatus() {
  if (!drawerUser.value) return
  if (drawerUser.value.status === 'ACTIVE') await suspendUser(drawerUser.value.id)
  else await activateUser(drawerUser.value.id)
  await refreshDrawer()
  await load()
}

async function saveIdentity() {
  if (!drawerUser.value) return
  saving.value.identity = true
  drawerMsg.value.identity = null
  try {
    await updateUserIdentity(drawerUser.value.id, identityForm.value)
    drawerMsg.value.identity = { type: 'ok', text: 'Identity updated.' }
    await refreshDrawer()
    await load()
  } catch (e: any) {
    drawerMsg.value.identity = { type: 'error', text: extractError(e) }
  } finally { saving.value.identity = false }
}

async function saveProfile() {
  if (!drawerUser.value) return
  saving.value.profile = true
  drawerMsg.value.profile = null
  try {
    await updateProfile(drawerUser.value.id, profileForm.value)
    drawerMsg.value.profile = { type: 'ok', text: 'Profile updated.' }
    await refreshDrawer()
  } catch (e: any) {
    drawerMsg.value.profile = { type: 'error', text: extractError(e) }
  } finally { saving.value.profile = false }
}

async function savePrefs() {
  if (!drawerUser.value) return
  saving.value.prefs = true
  drawerMsg.value.prefs = null
  try {
    await updatePreferences(drawerUser.value.id, prefsForm.value)
    drawerMsg.value.prefs = { type: 'ok', text: 'Preferences updated.' }
  } catch (e: any) {
    drawerMsg.value.prefs = { type: 'error', text: extractError(e) }
  } finally { saving.value.prefs = false }
}

async function savePw() {
  if (!drawerUser.value) return
  saving.value.pw = true
  drawerMsg.value.pw = null
  try {
    await changePassword(drawerUser.value.id, pwForm.value)
    drawerMsg.value.pw = { type: 'ok', text: 'Password changed.' }
    pwForm.value = { current_password: '', new_password: '', repassword: '' }
  } catch (e: any) {
    drawerMsg.value.pw = { type: 'error', text: extractError(e) }
  } finally { saving.value.pw = false }
}

async function handleDisable2fa() {
  if (!drawerUser.value) return
  disable2faLoading.value = true
  disable2faError.value = null
  try {
    await adminDisable2fa(drawerUser.value.id)
    drawerTotpStatus.value = { totp_enabled: false, totp_enabled_at: null, recovery_codes_remaining: 0 }
  } catch (e: any) {
    disable2faError.value = extractError(e)
  } finally {
    disable2faLoading.value = false
  }
}

async function addRole() {
  if (!drawerUser.value || !drawerRoleToAdd.value) return
  saving.value.roles = true
  drawerMsg.value.roles = null
  try {
    await assignRole(drawerUser.value.id, drawerRoleToAdd.value)
    drawerRoleToAdd.value = ''
    await refreshDrawer()
  } catch (e: any) {
    drawerMsg.value.roles = extractError(e)
  } finally { saving.value.roles = false }
}

async function removeRole(roleId: string) {
  if (!drawerUser.value) return
  try {
    await revokeRole(drawerUser.value.id, roleId)
    await refreshDrawer()
  } catch (e: any) {
    drawerMsg.value.roles = extractError(e)
  }
}

async function addDirectPerm() {
  if (!drawerUser.value || !drawerPermToAdd.value) return
  saving.value.perms = true
  drawerMsg.value.perms = null
  try {
    await assignDirectPermission(drawerUser.value.id, drawerPermToAdd.value)
    drawerPermToAdd.value = ''
    await refreshDrawer()
  } catch (e: any) {
    drawerMsg.value.perms = extractError(e)
  } finally { saving.value.perms = false }
}

async function removeDirectPerm(permissionId: string) {
  if (!drawerUser.value) return
  try {
    await revokeDirectPermission(drawerUser.value.id, permissionId)
    await refreshDrawer()
  } catch (e: any) {
    drawerMsg.value.perms = extractError(e)
  }
}

// ── Create user (side drawer) ───────────────────────────────────────────────

const createDrawerOpen = ref(false)
const creating = ref(false)
const createError = ref<string | null>(null)
const showPw = ref(false)
const createForm = ref({
  first_name: '', last_name: '', email: '',
  password: '', repassword: '', status: 'ACTIVE', role_ids: [] as string[],
  send_credentials: true,
})

const rolesNotInCreate = computed(() =>
  allRoles.value.filter(r => !createForm.value.role_ids.includes(r.id)),
)

function openCreate() {
  createForm.value = { first_name: '', last_name: '', email: '', password: '', repassword: '', status: 'ACTIVE', role_ids: [], send_credentials: true }
  createError.value = null
  showPw.value = false
  createDrawerOpen.value = true
}

function addRoleToCreate(event: Event) {
  const val = (event.target as HTMLSelectElement).value
  if (val && !createForm.value.role_ids.includes(val)) {
    createForm.value.role_ids = [...createForm.value.role_ids, val]
  }
  ;(event.target as HTMLSelectElement).value = ''
}

function removeRoleFromCreate(roleId: string) {
  createForm.value.role_ids = createForm.value.role_ids.filter(id => id !== roleId)
}

function generatePassword() {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const digits = '0123456789'
  const special = '!@#$%^&*()-_=+[]{}|;,.<>?'
  const all = upper + lower + digits + special
  const rand = (s: string) => s[Math.floor(Math.random() * s.length)]
  const pw = [...[rand(upper), rand(lower), rand(digits), rand(special)], ...Array.from({ length: 10 }, () => rand(all))]
    .sort(() => Math.random() - 0.5).join('')
  createForm.value.password = pw
  createForm.value.repassword = pw
  showPw.value = true
}

async function handleCreate() {
  creating.value = true
  createError.value = null
  try {
    await createUser({
      first_name: createForm.value.first_name,
      last_name: createForm.value.last_name,
      email: createForm.value.email,
      password: createForm.value.password,
      repassword: createForm.value.repassword,
      status: createForm.value.status,
      role_ids: createForm.value.role_ids.length ? createForm.value.role_ids : undefined,
      send_credentials: createForm.value.send_credentials,
    })
    createDrawerOpen.value = false
  } catch (e: any) {
    createError.value = extractError(e, 'Failed to create user')
  } finally {
    creating.value = false
  }
}

// ── Delete user ──────────────────────────────────────────────────────────────

const showDelete = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)
const deletePassword = ref('')
const deleteTarget = ref<AdminUserListItem | null>(null)

function openDeleteFromDrawer() {
  if (!drawerUser.value) return
  openDelete({
    id: drawerUser.value.id,
    first_name: drawerUser.value.first_name,
    last_name: drawerUser.value.last_name,
    email: drawerUser.value.email,
    status: drawerUser.value.status,
    created_at: String(drawerUser.value.created_at),
  })
}

function openDelete(user: AdminUserListItem) {
  deleteTarget.value = user
  deletePassword.value = ''
  deleteError.value = null
  showDelete.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = null
  try {
    await deleteUser(deleteTarget.value.id, deletePassword.value)
    showDelete.value = false
    if (drawerUser.value?.id === deleteTarget.value.id) drawerOpen.value = false
  } catch (e: any) {
    deleteError.value = extractError(e, 'Failed to delete user')
  } finally { deleting.value = false }
}

// ── Session actions ───────────────────────────────────────────────────────────

async function revokeSession(sessionId: string) {
  if (!drawerUser.value) return
  saving.value.sessions = true
  drawerMsg.value.sessions = null
  try {
    await revokeUserSession(drawerUser.value.id, sessionId)
    drawerSessions.value = await listUserSessions(drawerUser.value.id).catch(() => [])
  } catch (e: any) {
    drawerMsg.value.sessions = extractError(e, 'Failed to revoke session')
  } finally { saving.value.sessions = false }
}

async function revokeAllSessions() {
  if (!drawerUser.value || !confirm('Revoke all sessions for this user?')) return
  saving.value.sessions = true
  drawerMsg.value.sessions = null
  try {
    await revokeAllUserSessions(drawerUser.value.id)
    drawerSessions.value = []
  } catch (e: any) {
    drawerMsg.value.sessions = extractError(e, 'Failed to revoke sessions')
  } finally { saving.value.sessions = false }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractError(e: any, fallback = 'An error occurred'): string {
  const msg = e?.response?.data?.message
  if (Array.isArray(msg)) return msg[0]
  if (typeof msg === 'string') return msg
  return e?.message ?? fallback
}

function statusClass(status: string) {
  return (
    { ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', SUSPENDED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', INACTIVE: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' }[status]
    ?? 'bg-gray-100 text-gray-600'
  )
}
function formatDate(d: string) { return new Date(d).toLocaleDateString() }
</script>

<style scoped>
/* drawer backdrop */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

/* drawer panel */
.slide-enter-active,
.slide-leave-active { transition: transform 0.25s ease; }
.slide-enter-from,
.slide-leave-to { transform: translateX(100%); }
</style>
