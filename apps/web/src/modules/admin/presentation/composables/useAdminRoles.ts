import { ref, inject } from 'vue'
import { HTTP_CLIENT_KEY } from '@/shared/integration'
import { AdminRoleRepository } from '@/modules/admin/integration/repositories'
import type { RoleDto, RolePermissionAssignment } from '@/modules/admin/business/dtos/AdminRoleDto'

export function useAdminRoles() {
  const roles = ref<RoleDto[]>([])
  const total = ref(0)
  const rolePermissions = ref<RolePermissionAssignment[]>([])

  const client = inject(HTTP_CLIENT_KEY)!
  const repo = new AdminRoleRepository(client)

  async function listRoles(params: { limit?: number; offset?: number } = {}) {
    const res = await repo.listRoles(params)
    roles.value = res.results
    total.value = res.count
  }

  async function listRolePermissions(roleId: string): Promise<RolePermissionAssignment[]> {
    const res = await repo.listRolePermissions(roleId)
    rolePermissions.value = res
    return res
  }

  async function createRole(data: {
    name: string
    display_name: string
    description?: string
    is_system?: boolean
    status?: string
  }) {
    await repo.createRole(data)
  }

  async function updateRole(id: string, data: { display_name?: string; description?: string; status?: string; is_system?: boolean }) {
    await repo.updateRole(id, data)
  }

  async function deleteRole(id: string) {
    await repo.deleteRole(id)
    await listRoles({ limit: 100 })
  }

  async function assignPermissionToRole(roleId: string, permissionId: string) {
    await repo.assignPermissionToRole(roleId, permissionId)
  }

  async function revokePermissionFromRole(roleId: string, permissionId: string) {
    await repo.revokePermissionFromRole(roleId, permissionId)
  }

  return {
    roles,
    total,
    rolePermissions,
    listRoles,
    listRolePermissions,
    createRole,
    updateRole,
    deleteRole,
    assignPermissionToRole,
    revokePermissionFromRole,
  }
}
