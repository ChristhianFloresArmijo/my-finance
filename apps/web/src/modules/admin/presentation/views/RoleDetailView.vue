<template>
  <div class="p-6 max-w-3xl space-y-6">
    <RouterLink to="/admin/roles" class="text-sm text-gray-400 hover:underline">← Roles</RouterLink>

    <div v-if="role" class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-xl font-bold">{{ role.display_name }}</h1>
        <p class="font-mono text-xs text-gray-400">{{ role.name }}</p>
        <p v-if="role.description" class="text-sm text-gray-500 mt-1">{{ role.description }}</p>
        <span
          v-if="role.is_system"
          class="inline-block mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
        >
          System role — cannot be modified
        </span>
      </div>

      <!-- Assigned permissions table -->
      <div>
        <h2 class="text-sm font-semibold mb-2">Assigned Permissions</h2>
        <div class="rounded-lg border dark:border-gray-700 overflow-hidden">
          <table class="w-full text-xs">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-3 py-2 text-left font-medium">Resource</th>
                <th class="px-3 py-2 text-left font-medium">Action</th>
                <th class="px-3 py-2 text-left font-medium">Scope</th>
                <th class="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in assignedPermissionsWithDetails"
                :key="p.id"
                class="border-t dark:border-gray-700"
              >
                <td class="px-3 py-2 font-mono">{{ p.resource }}</td>
                <td class="px-3 py-2 font-mono">{{ p.action }}</td>
                <td class="px-3 py-2">
                  <span :class="scopeClass(p.scope)" class="px-1.5 py-0.5 rounded text-xs">
                    {{ p.scope }}
                  </span>
                </td>
                <td class="px-3 py-2">
                  <button
                    v-if="!role.is_system"
                    class="text-red-500 hover:underline text-xs"
                    @click="revoke(p.permission_id)"
                  >
                    Revoke
                  </button>
                  <span v-else class="text-gray-300 text-xs">protected</span>
                </td>
              </tr>
              <tr v-if="assignedPermissionsWithDetails.length === 0">
                <td colspan="4" class="px-3 py-6 text-center text-gray-400">No permissions assigned</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Assign permission (non-system roles only) -->
      <div v-if="!role.is_system">
        <h2 class="text-sm font-semibold mb-2">Add Permission</h2>
        <div class="flex gap-2">
          <select
            v-model="selectedPermId"
            class="border rounded px-2 py-1 text-sm flex-1 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Select permission…</option>
            <option v-for="p in availablePermissions" :key="p.id" :value="p.id">
              {{ p.resource }}:{{ p.action }} ({{ p.scope }})
            </option>
          </select>
          <button
            :disabled="!selectedPermId"
            class="px-3 py-1 text-sm bg-indigo-600 text-white rounded disabled:opacity-40 hover:bg-indigo-700"
            @click="assign"
          >
            Assign
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="loadError" class="text-red-500 text-sm">{{ loadError }}</div>
    <div v-else class="text-gray-400 text-sm">Loading…</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { HTTP_CLIENT_KEY } from '@/shared/integration'
import { useAdminRoles } from '../composables/useAdminRoles'
import { useAdminPermissions } from '../composables/useAdminPermissions'
import type { RoleDto, RolePermissionAssignment } from '@/modules/admin/business/dtos/AdminRoleDto'

const route = useRoute()
const roleId = route.params.id as string

const client = inject(HTTP_CLIENT_KEY)!

const { listRolePermissions, assignPermissionToRole, revokePermissionFromRole } = useAdminRoles()
const { permissions: allPermissions, listPermissions } = useAdminPermissions()

const role = ref<RoleDto | null>(null)
const assignedPermissions = ref<RolePermissionAssignment[]>([])
const selectedPermId = ref('')
const loadError = ref<string | null>(null)

/** Joins RolePermissionAssignment with full permission details from allPermissions */
const assignedPermissionsWithDetails = computed(() =>
  assignedPermissions.value.map((ap) => {
    const perm = allPermissions.value.find((p) => p.id === ap.permission_id)
    return { ...ap, resource: perm?.resource ?? '—', action: perm?.action ?? '—', scope: perm?.scope ?? '—' }
  }),
)

onMounted(async () => {
  try {
    const [roleRes, permsRes] = await Promise.all([
      client.get<RoleDto>(`/roles/${roleId}`),
      listRolePermissions(roleId),
    ])
    role.value = roleRes
    assignedPermissions.value = permsRes ?? []
    await listPermissions({ limit: 200 })
  } catch {
    loadError.value = 'Failed to load role details'
  }
})

const availablePermissions = computed(() =>
  allPermissions.value.filter((p) => !assignedPermissions.value.some((ap) => ap.id === p.id)),
)

async function assign() {
  if (!selectedPermId.value) return
  await assignPermissionToRole(roleId, selectedPermId.value)
  assignedPermissions.value = (await listRolePermissions(roleId)) ?? []
  selectedPermId.value = ''
}

async function revoke(permissionId: string) {
  await revokePermissionFromRole(roleId, permissionId)
  assignedPermissions.value = (await listRolePermissions(roleId)) ?? []
}

function scopeClass(scope: string): string {
  const map: Record<string, string> = {
    ALL: 'bg-blue-50 text-blue-700',
    OWN: 'bg-green-50 text-green-700',
    TEAM: 'bg-yellow-50 text-yellow-700',
    ORG: 'bg-purple-50 text-purple-700',
  }
  return map[scope] ?? 'bg-gray-100 text-gray-600'
}
</script>
