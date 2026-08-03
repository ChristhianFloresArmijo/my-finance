import type { HttpClient } from '@/shared/integration'
import type { PaginatedResults } from '@/shared/business'
import type { IAdminPermissionRepository } from '../../business/repositories/IAdminPermissionRepository'
import type { AdminPermissionListItem, CreatePermissionDto } from '../../business/dtos/AdminPermissionDto'

export class AdminPermissionRepository implements IAdminPermissionRepository {
  private readonly client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  async listPermissions(params: { limit?: number; offset?: number } = {}): Promise<PaginatedResults<AdminPermissionListItem[]>> {
    return this.client.get<PaginatedResults<AdminPermissionListItem[]>>('/permissions', { params })
  }

  async createPermission(data: CreatePermissionDto): Promise<void> {
    await this.client.post('/permissions', { is_system: false, ...data })
  }

  async updatePermission(id: string, data: { description?: string; status?: string; is_system?: boolean }): Promise<void> {
    await this.client.put(`/permissions/${id}`, data)
  }

  async deletePermission(id: string): Promise<void> {
    await this.client.delete(`/permissions/${id}`)
  }
}
