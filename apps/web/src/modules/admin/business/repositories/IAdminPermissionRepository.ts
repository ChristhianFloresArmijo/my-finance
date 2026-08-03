import type { PaginatedResults } from '@/shared/business'
import type { AdminPermissionListItem, CreatePermissionDto } from '../dtos/AdminPermissionDto'

export interface IAdminPermissionRepository {
  listPermissions(params?: { limit?: number; offset?: number }): Promise<PaginatedResults<AdminPermissionListItem[]>>
  createPermission(data: CreatePermissionDto): Promise<void>
  updatePermission(id: string, data: { description?: string; status?: string; is_system?: boolean }): Promise<void>
  deletePermission(id: string): Promise<void>
}
