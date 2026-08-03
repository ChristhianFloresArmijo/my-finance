<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Permissions</h1>
      <button
        class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        @click="openCreate"
      >
        + Create Permission
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow">
      <div v-if="isLoading" class="p-8 text-center text-gray-400 text-sm">Loading…</div>
      <div v-else-if="error" class="p-8 text-center text-red-500 text-sm">{{ error }}</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm min-w-[640px]">
          <thead class="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Resource</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Action</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Scope</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">System</th>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Created</th>
              <th class="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in permissions"
              :key="p.id"
              class="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <td class="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{{ p.resource }}</td>
              <td class="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{{ p.action }}</td>
              <td class="px-4 py-3">
                <span :class="scopeClass(p.scope)" class="px-2 py-0.5 rounded text-xs font-medium">{{ p.scope }}</span>
              </td>
              <td class="px-4 py-3">
                <span :class="statusClass(p.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ p.status }}</span>
              </td>
              <td class="px-4 py-3">
                <span v-if="p.is_system" class="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded">System</span>
              </td>
              <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ p.created_at ? formatDate(p.created_at) : '—' }}</td>
              <td class="px-4 py-3 text-right">
                <RowActionMenu :items="rowActions(p)" />
              </td>
            </tr>
            <tr v-if="!permissions.length">
              <td colspan="7" class="px-4 py-8 text-center text-gray-400 text-sm">No permissions found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div class="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
      <span>Showing {{ permissions.length }} of {{ total }}</span>
      <div class="flex gap-2">
        <button :disabled="offset === 0" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" @click="prev">Prev</button>
        <button :disabled="offset + limit >= total" class="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" @click="next">Next</button>
      </div>
    </div>

    <!-- ════════════════════════════════════════════════════════════════
         PERMISSION DETAIL DRAWER
         ════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="drawerOpen" class="fixed inset-0 z-40 bg-black/30" @click="drawerOpen = false" />
      </Transition>
      <Transition name="slide">
        <div v-if="drawerOpen" class="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl">

          <!-- Header -->
          <div class="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div v-if="drawerPerm">
              <h2 class="text-base font-bold text-gray-900 dark:text-white font-mono">{{ drawerPerm.resource }}:{{ drawerPerm.action }}</h2>
              <p class="text-xs text-gray-400 font-mono mt-0.5 break-all">{{ drawerPerm.id }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span :class="scopeClass(drawerPerm.scope)" class="px-2 py-0.5 rounded text-xs font-medium">{{ drawerPerm.scope }}</span>
                <span v-if="drawerPerm.is_system" class="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 rounded">System</span>
                <span :class="statusClass(drawerPerm.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ drawerPerm.status }}</span>
              </div>
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
              v-for="t in PERM_TABS" :key="t.key"
              class="px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap"
              :class="drawerTab === t.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
              @click="drawerTab = t.key"
            >{{ t.label }}</button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto">
            <template v-if="drawerPerm">

              <!-- ── Overview ── -->
              <div v-if="drawerTab === 'overview'" class="p-6 space-y-4">
                <dl class="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Resource</dt>
                    <dd class="mt-0.5 text-sm font-mono text-gray-900 dark:text-white">{{ drawerPerm.resource }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Action</dt>
                    <dd class="mt-0.5 text-sm font-mono text-gray-900 dark:text-white">{{ drawerPerm.action }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Scope</dt>
                    <dd class="mt-0.5"><span :class="scopeClass(drawerPerm.scope)" class="px-2 py-0.5 rounded text-xs font-medium">{{ drawerPerm.scope }}</span></dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd class="mt-0.5"><span :class="statusClass(drawerPerm.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ drawerPerm.status }}</span></dd>
                  </div>
                  <div>
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">System permission</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ drawerPerm.is_system ? 'Yes' : 'No' }}</dd>
                  </div>
                  <div v-if="drawerPerm.created_at">
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Created</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ formatDate(drawerPerm.created_at) }}</dd>
                  </div>
                  <div v-if="drawerPerm.updated_at">
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Updated</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ formatDate(drawerPerm.updated_at) }}</dd>
                  </div>
                  <div class="col-span-2">
                    <dt class="text-xs font-medium text-gray-500 dark:text-gray-400">Description</dt>
                    <dd class="mt-0.5 text-sm text-gray-900 dark:text-white">{{ drawerPerm.description || '—' }}</dd>
                  </div>
                </dl>
              </div>

              <!-- ── Edit ── -->
              <div v-if="drawerTab === 'edit'" class="p-6">
                <p v-if="editMsg" :class="editMsg.type === 'error' ? 'text-red-600 bg-red-50 dark:bg-red-950' : 'text-green-700 bg-green-50 dark:bg-green-950'" class="text-sm rounded px-3 py-2 mb-4">{{ editMsg.text }}</p>
                <div class="space-y-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                    <input v-model="editForm.description" placeholder="What this permission allows…" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
                    <select v-model="editForm.status" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <option v-for="opt in enums.status" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                  </div>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="editForm.is_system" type="checkbox" class="rounded"/>
                    <span class="text-sm text-gray-700 dark:text-gray-300">System permission</span>
                    <span class="text-xs text-gray-400">(shows the System badge)</span>
                  </label>
                </div>
                <button :disabled="isSaving" class="mt-5 px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40" @click="handleEdit">
                  {{ isSaving ? 'Saving…' : 'Save Changes' }}
                </button>
              </div>

            </template>
          </div>

          <!-- Drawer footer: delete action -->
          <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0 flex items-center justify-between">
            <span class="text-xs text-gray-400">Permission actions</span>
            <button
              class="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-40"
              @click="drawerPerm && openDelete(drawerPerm)"
            >
              Delete
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════════════════════════════════════════════════════
         CREATE PERMISSION DRAWER
         ════════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="createDrawerOpen" class="fixed inset-0 z-40 bg-black/30" @click="createDrawerOpen = false" />
      </Transition>
      <Transition name="slide">
        <div v-if="createDrawerOpen" class="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <h2 class="text-base font-bold text-gray-900 dark:text-white">Create Permission</h2>
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
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Resource *</label>
              <input v-model="createForm.resource" placeholder="e.g. user" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"/>
              <p class="mt-1 text-xs text-gray-400">Lowercase, numbers, hyphens, underscores</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Action *</label>
              <input v-model="createForm.action" placeholder="e.g. read" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"/>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Scope</label>
              <select v-model="createForm.scope" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option v-for="opt in enums.permissionScope" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
              <input v-model="createForm.description" placeholder="What this permission allows…" class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"/>
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="createForm.is_system" type="checkbox" class="rounded"/>
              <span class="text-sm text-gray-700 dark:text-gray-300">Mark as system permission</span>
            </label>
          </div>

          <!-- Footer -->
          <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0 flex justify-end gap-2">
            <button class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300" @click="createDrawerOpen = false">Cancel</button>
            <button :disabled="!createForm.resource || !createForm.action || isCreating" class="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40" @click="handleCreate">
              {{ isCreating ? 'Creating…' : 'Create Permission' }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── DELETE CONFIRM ─────────────────────────────────────────────────── -->
    <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/40 flex items-center justify-center z-[60]" @click.self="showDeleteConfirm = false">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">Delete Permission</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400">Delete <strong class="font-mono text-gray-900 dark:text-white">{{ deleteTarget?.resource }}:{{ deleteTarget?.action }}</strong>? This cannot be undone.</p>
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
import { ref, onMounted } from 'vue'
import RowActionMenu from '../components/RowActionMenu.vue'
import type { MenuAction } from '../components/RowActionMenu.vue'
import { useAdminPermissions } from '../composables/useAdminPermissions'
import { useAdminMeta } from '../composables/useAdminMeta'
import type { AdminPermissionListItem } from '@/modules/admin/business/dtos/AdminPermissionDto'

const { permissions, total, isLoading, error, listPermissions, createPermission, updatePermission, deletePermission } = useAdminPermissions()
const { enums, fetchEnums } = useAdminMeta()

const limit = 50
const offset = ref(0)

onMounted(() => { load(); fetchEnums() })
async function load() { await listPermissions({ limit, offset: offset.value }) }
function prev() { offset.value = Math.max(0, offset.value - limit); load() }
function next() { offset.value += limit; load() }

function extractError(e: any, fallback = 'An error occurred'): string {
  const msg = e?.response?.data?.message
  if (Array.isArray(msg)) return msg[0]
  if (typeof msg === 'string') return msg
  return e?.message ?? fallback
}

function formatDate(d: string) { return new Date(d).toLocaleDateString() }

// ── Row actions ──────────────────────────────────────────────────────────────

function rowActions(p: AdminPermissionListItem): MenuAction[] {
  return [
    { label: 'Overview', action: () => openDrawer(p, 'overview') },
    { label: 'Edit', action: () => openDrawer(p, 'edit') },
    { divider: true },
    { label: 'Delete', danger: true, action: () => openDelete(p) },
  ]
}

// ── DRAWER ─────────────────────────────────────────────────────────────────────

const PERM_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'edit', label: 'Edit' },
] as const
type PermTab = typeof PERM_TABS[number]['key']

const drawerOpen = ref(false)
const drawerTab = ref<PermTab>('overview')
const drawerPerm = ref<AdminPermissionListItem | null>(null)
const isSaving = ref(false)
type Msg = { type: 'ok' | 'error'; text: string } | null
const editMsg = ref<Msg>(null)
const editForm = ref({ description: '', status: 'ACTIVE', is_system: false })

function openDrawer(p: AdminPermissionListItem, tab: PermTab = 'overview') {
  drawerPerm.value = p
  drawerTab.value = tab
  editForm.value = { description: p.description ?? '', status: p.status ?? 'ACTIVE', is_system: p.is_system }
  editMsg.value = null
  drawerOpen.value = true
}

async function handleEdit() {
  if (!drawerPerm.value) return
  isSaving.value = true
  editMsg.value = null
  try {
    await updatePermission(drawerPerm.value.id, {
      description: editForm.value.description || undefined,
      status: editForm.value.status,
      is_system: editForm.value.is_system,
    })
    editMsg.value = { type: 'ok', text: 'Permission updated.' }
    await load()
    drawerPerm.value = permissions.value.find(p => p.id === drawerPerm.value!.id) ?? drawerPerm.value
  } catch (e: any) {
    editMsg.value = { type: 'error', text: extractError(e) }
  } finally { isSaving.value = false }
}

// ── Create drawer ─────────────────────────────────────────────────────────────

const createDrawerOpen = ref(false)
const isCreating = ref(false)
const createError = ref<string | null>(null)
const createForm = ref({ resource: '', action: '', scope: 'ALL', description: '', is_system: false })

function openCreate() {
  createForm.value = { resource: '', action: '', scope: 'ALL', description: '', is_system: false }
  createError.value = null
  createDrawerOpen.value = true
}

async function handleCreate() {
  isCreating.value = true
  createError.value = null
  try {
    await createPermission({
      resource: createForm.value.resource,
      action: createForm.value.action,
      scope: createForm.value.scope || undefined,
      description: createForm.value.description || undefined,
    })
    createDrawerOpen.value = false
    await load()
  } catch (e: any) {
    createError.value = extractError(e, 'Failed to create permission')
  } finally { isCreating.value = false }
}

// ── Delete ─────────────────────────────────────────────────────────────────────

const showDeleteConfirm = ref(false)
const isDeleting = ref(false)
const deleteError = ref<string | null>(null)
const deleteTarget = ref<AdminPermissionListItem | null>(null)

function openDelete(p: AdminPermissionListItem) {
  deleteTarget.value = p
  deleteError.value = null
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!deleteTarget.value) return
  isDeleting.value = true
  deleteError.value = null
  try {
    await deletePermission(deleteTarget.value.id)
    showDeleteConfirm.value = false
    if (drawerPerm.value?.id === deleteTarget.value.id) drawerOpen.value = false
    await load()
  } catch (e: any) {
    deleteError.value = extractError(e, 'Failed to delete permission')
  } finally { isDeleting.value = false }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scopeClass(scope: string): string {
  return ({ ALL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', OWN: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', TEAM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', ORG: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' }[scope] ?? 'bg-gray-100 text-gray-600')
}
function statusClass(status: string): string {
  return ({ ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', INACTIVE: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', SUSPENDED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' }[status] ?? 'bg-gray-100 text-gray-600')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-enter-active, .slide-leave-active { transition: transform 0.25s ease; }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
</style>
