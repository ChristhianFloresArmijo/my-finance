import type { PaginatedResults } from '@/shared/business'
import type { RoleDto, RolePermissionAssignment } from '../dtos/AdminRoleDto'

export interface IAdminRoleRepository {
  listRoles(params?: { limit?: number; offset?: number }): Promise<PaginatedResults<RoleDto[]>>
  listRolePermissions(roleId: string): Promise<RolePermissionAssignment[]>
  createRole(data: {
    name: string
    display_name: string
    description?: string
    is_system?: boolean
    status?: string
  }): Promise<void>
  updateRole(id: string, data: { display_name?: string; description?: string; status?: string; is_system?: boolean }): Promise<void>
  deleteRole(id: string): Promise<void>
  assignPermissionToRole(roleId: string, permissionId: string): Promise<void>
  revokePermissionFromRole(roleId: string, permissionId: string): Promise<void>
}
