import { ref, inject } from 'vue'
import { HTTP_CLIENT_KEY } from '@/shared/integration'
import { AdminPermissionRepository } from '@/modules/admin/integration/repositories'
import type {
  AdminPermissionListItem,
  CreatePermissionDto,
} from '@/modules/admin/business/dtos/AdminPermissionDto'

export function useAdminPermissions() {
  const permissions = ref<AdminPermissionListItem[]>([])
  const total = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const client = inject(HTTP_CLIENT_KEY)!
  const repo = new AdminPermissionRepository(client)

  async function listPermissions(params: { limit?: number; offset?: number } = {}) {
    isLoading.value = true
    error.value = null
    try {
      const res = await repo.listPermissions(params)
      permissions.value = res.results
      total.value = res.count
    } catch {
      error.value = 'Failed to load permissions'
    } finally {
      isLoading.value = false
    }
  }

  async function createPermission(data: CreatePermissionDto) {
    await repo.createPermission(data)
    await listPermissions()
  }

  async function updatePermission(id: string, data: { description?: string; status?: string; is_system?: boolean }) {
    await repo.updatePermission(id, data)
  }

  async function deletePermission(id: string) {
    await repo.deletePermission(id)
    await listPermissions()
  }

  return { permissions, total, isLoading, error, listPermissions, createPermission, updatePermission, deletePermission }
}
