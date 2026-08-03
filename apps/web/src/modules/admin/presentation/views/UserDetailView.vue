<template>
  <div class="p-6 max-w-3xl space-y-6">
    <RouterLink to="/admin/users" class="text-sm text-gray-400 hover:underline">← Users</RouterLink>

    <div v-if="user" class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-xl font-bold">{{ user.full_name }}</h1>
          <p class="text-sm text-gray-500">{{ user.email }}</p>
        </div>
        <span :class="statusClass(user.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">
          {{ user.status }}
        </span>
      </div>

      <!-- Roles section -->
      <div>
        <h2 class="text-sm font-semibold mb-2">Roles</h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="role in user.roles"
            :key="role.id"
            class="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full"
          >
            {{ role.display_name }}
            <button
              class="ml-1 text-indigo-400 hover:text-red-500 font-bold leading-none"
              title="Remove role"
              @click="removeRole(role.id)"
            >
              ×
            </button>
          </span>
          <span v-if="user.roles.length === 0" class="text-xs text-gray-400 italic">No roles assigned</span>
        </div>

        <!-- Assign role -->
        <div class="flex gap-2 mt-3">
          <select
            v-model="selectedRoleId"
            class="border rounded px-2 py-1 text-sm flex-1 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Select role…</option>
            <option v-for="r in availableRoles" :key="r.id" :value="r.id">{{ r.display_name }}</option>
          </select>
          <button
            :disabled="!selectedRoleId"
            class="px-3 py-1 text-sm bg-indigo-600 text-white rounded disabled:opacity-40 hover:bg-indigo-700"
            @click="addRole"
          >
            Assign
          </button>
        </div>
      </div>

      <!-- Effective permissions (read-only) -->
      <div>
        <h2 class="text-sm font-semibold mb-2">Effective Permissions</h2>
        <div class="flex flex-wrap gap-1">
          <span
            v-for="p in user.permissions"
            :key="p.id"
            class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded font-mono"
          >
            {{ p.resource }}:{{ p.action }}
            <span v-if="p.scope !== 'ALL'" class="text-gray-400"> ({{ p.scope }})</span>
          </span>
          <span v-if="user.permissions.length === 0" class="text-xs text-gray-400 italic">None</span>
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
import { useAdminUsers } from '../composables/useAdminUsers'
import { useAdminRoles } from '../composables/useAdminRoles'
import type { CurrentUserDto } from '@/modules/authentication/business'
import type { RoleDto } from '@/modules/admin/business/dtos/AdminRoleDto'

const route = useRoute()
const userId = route.params.id as string

const client = inject(HTTP_CLIENT_KEY)!

const user = ref<CurrentUserDto | null>(null)
const allRoles = ref<RoleDto[]>([])
const selectedRoleId = ref('')
const loadError = ref<string | null>(null)

const { assignRole, revokeRole } = useAdminUsers()
const { listRoles } = useAdminRoles()

async function fetchUser() {
  user.value = await client.get<CurrentUserDto>(`/account/${userId}`)
}

onMounted(async () => {
  try {
    await fetchUser()
    await listRoles({ limit: 100 })
    // useAdminRoles returns roles via reactive ref — we need the raw array here
    const res = await client.get<{ results: RoleDto[] }>('/roles', { params: { limit: 100 } })
    allRoles.value = res.results
  } catch {
    loadError.value = 'Failed to load user details'
  }
})

// Only show roles the user doesn't already have
const availableRoles = computed(() =>
  allRoles.value.filter((r) => !user.value?.roles.some((ur) => ur.id === r.id)),
)

async function addRole() {
  if (!selectedRoleId.value) return
  await assignRole(userId, selectedRoleId.value)
  await fetchUser()
  selectedRoleId.value = ''
}

async function removeRole(roleId: string) {
  await revokeRole(userId, roleId)
  await fetchUser()
}

function statusClass(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    SUSPENDED: 'bg-yellow-100 text-yellow-700',
    INACTIVE: 'bg-gray-100 text-gray-600',
  }
  return map[status] ?? 'bg-gray-100 text-gray-600'
}
</script>
