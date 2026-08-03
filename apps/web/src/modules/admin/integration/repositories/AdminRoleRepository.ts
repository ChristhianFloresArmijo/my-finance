import type { HttpClient } from '@/shared/integration'
import type { PaginatedResults } from '@/shared/business'
import type { IAdminRoleRepository } from '../../business/repositories/IAdminRoleRepository'
import type { RoleDto, RolePermissionAssignment } from '../../business/dtos/AdminRoleDto'

export class AdminRoleRepository implements IAdminRoleRepository {
  private readonly client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  async listRoles(params: { limit?: number; offset?: number } = {}): Promise<PaginatedResults<RoleDto[]>> {
    return this.client.get<PaginatedResults<RoleDto[]>>('/roles', { params })
  }

  async listRolePermissions(roleId: string): Promise<RolePermissionAssignment[]> {
    return this.client.get<RolePermissionAssignment[]>(`/roles/${roleId}/permissions`)
  }

  async createRole(data: {
    name: string
    display_name: string
    description?: string
    is_system?: boolean
    status?: string
  }): Promise<void> {
    await this.client.post('/roles', { is_system: false, status: 'ACTIVE', ...data })
  }

  async updateRole(id: string, data: { display_name?: string; description?: string; status?: string; is_system?: boolean }): Promise<void> {
    await this.client.put(`/roles/${id}`, data)
  }

  async deleteRole(id: string): Promise<void> {
    await this.client.delete(`/roles/${id}`)
  }

  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    await this.client.post(`/roles/${roleId}/permissions`, { permission_id: permissionId })
  }

  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.client.delete(`/roles/${roleId}/permissions/${permissionId}`)
  }
}
