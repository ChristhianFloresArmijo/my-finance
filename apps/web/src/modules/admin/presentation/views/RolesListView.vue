<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Roles</h1>
      <button
        class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        @click="openCreate"
      >
        + Create Role
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow">
      <div v-if="isLoading" class="p-8 text-center text-gray-400 text-sm">Loading…</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm min-w-[560px]">
          <thead class="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Name</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Display Name</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">System</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Created</th>
              <th class="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="role in roles"
              :key="role.id"
              class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td class="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{{ role.name }}</td>
              <td class="px-4 py-3 text-gray-900 dark:text-white font-medium">{{ role.display_name }}</td>
              <td class="px-4 py-3">
                <span :class="statusClass(role.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ role.status }}</span>
              </td>
              <td class="px-4 py-3">
                <span v-if="role.is_system" class="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded">System</span>
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ role.created_at ? formatDate(role.created_at) : '—' }}</td>
              <td class="px-4 py-3 text-right">
                <RowActionMenu :items="rowActions(role)" />
              </td>
            </tr>
            <tr v-if="!roles.length">
              <td colspan="6" class="px-4 py-8 text-center text-gray-400 text-sm">No roles found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════
         ROLE DETAIL DRAWER
         ════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="drawerOpen" class="fixed inset-0 z-40 bg-black/30" @click="drawerOpen = false" />
      </Transition>
      <Transition name="slide">
        <div v-if="drawerOpen" class="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-xl bg-white dark:bg-gray-900 shadow-2xl">

          <!-- Drawer header -->
          <div class="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div v-if="drawerRole">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ drawerRole.display_name }}</h2>
              <p class="text-xs font-mono text-gray-400 mt-0.5">{{ drawerRole.name }}</p>
              <p class="text-xs font-mono text-gray-300 dark:text-gray-500 mt-0.5 break-all">{{ drawerRole.id }}</p>
            </div>
            <div v-else class="space-y-1">
              <div class="h-5 w-40 bg-gray-100 dark:bg-gray-700 animate-pulse rounded"/>
              <div class="h-3 w-24 bg-gray-100 dark:bg-gray-700 animate-pulse rounded"/>
            </div>
            <button class="ml-4 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 shrink-0" @click="drawerOpen = false">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
            <button
              v-for="t in ROLE_TABS" :key="t.key"
              class="px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap"
              :class="drawerTab === t.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
              @click="drawerTab = t.key"
            >{{ t.label }}</button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="drawerLoading" class="p-8 text-center text-gray-400 text-sm">Loading…</div>
            <template v-else-if="drawerRole">

              <!-- Overview -->
              <div v-if="drawerTab === 'overview'" class="p-6 space-y-4">
                <dl class="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Name (slug)</dt>
                    <dd class="mt-0.5 text-sm font-mono text-gray-900 dark:text-white">{{ drawerRole.name }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Display Name</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ drawerRole.display_name }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd class="mt-0.5"><span :class="statusClass(drawerRole.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ drawerRole.status }}</span></dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">System Role</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ drawerRole.is_system ? 'Yes' : 'No' }}</dd>
                  </div>
                  <div v-if="drawerRole.created_at">
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Created</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ formatDate(drawerRole.created_at) }}</dd>
                  </div>
                  <div v-if="drawerRole.updated_at">
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Updated</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ formatDate(drawerRole.updated_at) }}</dd>
                  </div>
                  <div class="col-span-2">
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Description</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ drawerRole.description || '—' }}</dd>
                  </div>
                </dl>
              </div>

              <!-- Edit -->
              <div v-if="drawerTab === 'edit'" class="p-6">
                <p v-if="editMsg" :class="editMsg.type === 'error' ? 'text-red-600 bg-red-50 dark:bg-red-950' : 'text-green-700 bg-green-50 dark:bg-green-950'" class="text-sm rounded px-3 py-2 mb-4">{{ editMsg.text }}</p>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name (slug, read-only)</label>
                    <input :value="editForm.name" disabled class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed font-mono"/>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Display Name</label>
                    <input v-model="editForm.display_name" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                    <input v-model="editForm.description" placeholder="Optional" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                    <select v-model="editForm.status" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option v-for="opt in enums.status" :key="opt.value" :value="opt.value">{{ opt.label }}</option>

                    </select>
                  </div>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="editForm.is_system" type="checkbox" class="rounded"/>
                    <span class="text-sm text-gray-700 dark:text-gray-300">System role</span>
                  </label>
                </div>
                <button :disabled="!editForm.display_name || isSaving" class="mt-4 px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40" @click="handleEdit">
                  {{ isSaving ? 'Saving…' : 'Save Changes' }}
                </button>
              </div>

              <!-- Permissions -->
              <div v-if="drawerTab === 'permissions'" class="p-6 flex flex-col h-full">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Assigned Permissions ({{ rolePermsData.length }})</h3>
                </div>
                <p v-if="permsError" class="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded px-3 py-2 mb-3">{{ permsError }}</p>
                <div v-if="permsLoading" class="text-center text-gray-400 text-sm py-4">Loading…</div>
                <div v-else class="space-y-1.5 mb-4 overflow-y-auto flex-1">
                  <div
                    v-for="rp in rolePermDetails"
                    :key="rp.id"
                    class="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs font-mono text-gray-900 dark:text-white">{{ rp.permission?.resource }}:{{ rp.permission?.action }}</span>
                      <span class="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded">{{ rp.permission?.scope }}</span>
                    </div>
                    <button class="text-xs text-red-500 hover:underline shrink-0" @click="removeRolePerm(rp.permission_id)">Revoke</button>
                  </div>
                  <p v-if="!rolePermDetails.length && !permsLoading" class="text-sm text-gray-400 italic text-center py-4">No permissions assigned.</p>
                </div>
                <div class="border-t border-gray-200 dark:border-gray-700 pt-4 shrink-0">
                  <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Assign permission</p>
                  <div class="flex gap-2">
                    <select v-model="permToAdd" class="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option value="">Select permission…</option>
                      <option v-for="p in availablePermsForRole" :key="p.id" :value="p.id">{{ p.resource }}:{{ p.action }} ({{ p.scope }})</option>
                    </select>
                    <button :disabled="!permToAdd || assigningPerm" class="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40" @click="addRolePerm">{{ assigningPerm ? '…' : 'Assign' }}</button>
                  </div>
                </div>
              </div>

            </template>
          </div>

          <!-- Drawer footer: delete action -->
          <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0 flex items-center justify-between">
            <span class="text-xs text-gray-400">Role actions</span>
            <button
              class="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              @click="drawerRole && openDelete(drawerRole)"
            >
              Delete
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════
         CREATE ROLE DRAWER
         ════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="createDrawerOpen" class="fixed inset-0 z-40 bg-black/30" @click="createDrawerOpen = false" />
      </Transition>
      <Transition name="slide">
        <div v-if="createDrawerOpen" class="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h2 class="text-base font-bold text-gray-900 dark:text-white">Create Role</h2>
            <button class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400" @click="createDrawerOpen = false">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-4">
            <p v-if="createError" class="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded px-3 py-2">{{ createError }}</p>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name (slug) *</label>
              <input v-model="createForm.name" placeholder="e.g. manager" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"/>
              <p class="mt-1 text-xs text-gray-400">Lowercase, letters and underscores only</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Display Name *</label>
              <input v-model="createForm.display_name" placeholder="e.g. Manager" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
              <input v-model="createForm.description" placeholder="What this role is for…" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
              <select v-model="createForm.status" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option v-for="opt in enums.status" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="createForm.is_system" type="checkbox" class="rounded"/>
              <span class="text-sm text-gray-700 dark:text-gray-300">Mark as system role</span>
            </label>
          </div>

          <!-- Footer -->
          <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0 flex justify-end gap-2">
            <button class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" @click="createDrawerOpen = false">Cancel</button>
            <button :disabled="!createForm.name || !createForm.display_name || isCreating" class="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40" @click="handleCreate">
              {{ isCreating ? 'Creating…' : 'Create Role' }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── DELETE CONFIRM ─────────────────────────────────────────────────── -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" @click.self="showDeleteConfirm = false">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">Delete Role</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">Delete <strong class="text-gray-900 dark:text-white">{{ deleteTarget?.display_name }}</strong>? This cannot be undone.</p>
        <p v-if="deleteError" class="text-sm text-red-600 bg-red-50 dark:bg-red-950 rounded px-3 py-2">{{ deleteError }}</p>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700" @click="showDeleteConfirm = false">Cancel</button>
          <button :disabled="isDeleting" class="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-40" @click="confirmDelete">{{ isDeleting ? 'Deleting…' : 'Delete' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import RowActionMenu from '../components/RowActionMenu.vue'
import type { MenuAction } from '../components/RowActionMenu.vue'
import { useAdminRoles } from '../composables/useAdminRoles'
import { useAdminPermissions } from '../composables/useAdminPermissions'
import { useAdminMeta } from '../composables/useAdminMeta'
import type { RoleDto, RolePermissionAssignment } from '@/modules/admin/business/dtos/AdminRoleDto'

const { roles, listRoles, createRole, updateRole, deleteRole, listRolePermissions, assignPermissionToRole, revokePermissionFromRole } = useAdminRoles()
const { permissions: allPermissions, listPermissions } = useAdminPermissions()
const { enums, fetchEnums } = useAdminMeta()

const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  await Promise.all([listRoles({ limit: 100 }), listPermissions({ limit: 1000 }), fetchEnums()])
  isLoading.value = false
})

function extractError(e: any, fallback = 'An error occurred'): string {
  const msg = e?.response?.data?.message
  if (Array.isArray(msg)) return msg[0]
  if (typeof msg === 'string') return msg
  return e?.message ?? fallback
}

function formatDate(d: string) { return new Date(d).toLocaleDateString() }

// ── Row actions ──────────────────────────────────────────────────────────────

function rowActions(role: RoleDto): MenuAction[] {
  return [
    { label: 'View / Overview', action: () => openDrawer(role, 'overview') },
    { label: 'Edit', action: () => openDrawer(role, 'edit') },
    { label: 'Manage Permissions', action: () => openDrawer(role, 'permissions') },
    { divider: true },
    { label: 'Delete', danger: true, action: () => openDelete(role) },
  ]
}

// ── DRAWER ────────────────────────────────────────────────────────────────────

const ROLE_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'edit', label: 'Edit' },
  { key: 'permissions', label: 'Permissions' },
] as const
type RoleTab = typeof ROLE_TABS[number]['key']

const drawerOpen = ref(false)
const drawerTab = ref<RoleTab>('overview')
const drawerRole = ref<RoleDto | null>(null)
const drawerLoading = ref(false)

const isSaving = ref(false)
type Msg = { type: 'ok' | 'error'; text: string } | null
const editMsg = ref<Msg>(null)
const editForm = ref({ id: '', name: '', display_name: '', description: '', status: 'ACTIVE', is_system: false })

// Permissions within drawer
const permsLoading = ref(false)
const permsError = ref<string | null>(null)
const rolePermsData = ref<RolePermissionAssignment[]>([])
const permToAdd = ref('')
const assigningPerm = ref(false)

const rolePermDetails = computed(() =>
  rolePermsData.value.map(rp => ({ ...rp, permission: allPermissions.value.find(p => p.id === rp.permission_id) })),
)
const availablePermsForRole = computed(() =>
  allPermissions.value.filter(p => !rolePermsData.value.some(rp => rp.permission_id === p.id)),
)

async function openDrawer(role: RoleDto, tab: RoleTab = 'overview') {
  drawerOpen.value = true
  drawerTab.value = tab
  drawerRole.value = role
  drawerLoading.value = false
  editMsg.value = null
  permsError.value = null
  permToAdd.value = ''
  editForm.value = { id: role.id, name: role.name, display_name: role.display_name, description: role.description ?? '', status: role.status ?? 'ACTIVE', is_system: role.is_system }
  // Load permissions immediately
  permsLoading.value = true
  rolePermsData.value = []
  try { rolePermsData.value = await listRolePermissions(role.id) }
  catch (e: any) { permsError.value = extractError(e) }
  finally { permsLoading.value = false }
}

async function handleEdit() {
  isSaving.value = true
  editMsg.value = null
  try {
    await updateRole(editForm.value.id, {
      display_name: editForm.value.display_name,
      description: editForm.value.description || undefined,
      status: editForm.value.status,
      is_system: editForm.value.is_system,
    })
    editMsg.value = { type: 'ok', text: 'Role updated.' }
    await listRoles({ limit: 100 })
    drawerRole.value = roles.value.find(r => r.id === editForm.value.id) ?? drawerRole.value
  } catch (e: any) {
    editMsg.value = { type: 'error', text: extractError(e) }
  } finally { isSaving.value = false }
}

async function addRolePerm() {
  if (!drawerRole.value || !permToAdd.value) return
  assigningPerm.value = true
  permsError.value = null
  try {
    await assignPermissionToRole(drawerRole.value.id, permToAdd.value)
    permToAdd.value = ''
    rolePermsData.value = await listRolePermissions(drawerRole.value.id)
  } catch (e: any) { permsError.value = extractError(e) }
  finally { assigningPerm.value = false }
}

async function removeRolePerm(permissionId: string) {
  if (!drawerRole.value) return
  permsError.value = null
  try {
    await revokePermissionFromRole(drawerRole.value.id, permissionId)
    rolePermsData.value = await listRolePermissions(drawerRole.value.id)
  } catch (e: any) { permsError.value = extractError(e) }
}

// ── Create drawer ─────────────────────────────────────────────────────────────

const createDrawerOpen = ref(false)
const isCreating = ref(false)
const createError = ref<string | null>(null)
const createForm = ref({ name: '', display_name: '', description: '', status: 'ACTIVE', is_system: false })

function openCreate() {
  createForm.value = { name: '', display_name: '', description: '', status: 'ACTIVE', is_system: false }
  createError.value = null
  createDrawerOpen.value = true
}

async function handleCreate() {
  isCreating.value = true
  createError.value = null
  try {
    await createRole({
      name: createForm.value.name,
      display_name: createForm.value.display_name,
      description: createForm.value.description || undefined,
      is_system: createForm.value.is_system,
      status: createForm.value.status,
    })
    createDrawerOpen.value = false
    await listRoles({ limit: 100 })
  } catch (e: any) {
    createError.value = extractError(e, 'Failed to create role')
  } finally { isCreating.value = false }
}

// ── Delete ─────────────────────────────────────────────────────────────────────

const showDeleteConfirm = ref(false)
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)
const deleteTarget = ref<RoleDto | null>(null)

function openDelete(role: RoleDto) {
  deleteTarget.value = role
  deleteError.value = null
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  deleteError.value = null
  try {
    await deleteRole(deleteTarget.value.id)
    showDeleteConfirm.value = false
    if (drawerRole.value?.id === deleteTarget.value.id) drawerOpen.value = false
  } catch (e: any) {
    deleteError.value = extractError(e, 'Failed to delete role')
  } finally { isDeleting.value = false }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusClass(status: string): string {
  return ({ ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', INACTIVE: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' }[status] ?? 'bg-gray-100 text-gray-600')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: transform 0.25s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>
