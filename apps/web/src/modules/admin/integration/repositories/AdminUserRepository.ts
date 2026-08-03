import type { HttpClient } from '@/shared/integration'
import type { PaginatedResults } from '@/shared/business'
import type {
  IAdminUserRepository,
  ListUsersParams,
  CreateUserParams,
  TotpAdminStatus,
} from '../../business/repositories/IAdminUserRepository'
import type { AdminUserListItem } from '../../business/dtos/AdminUserDto'
import type { CurrentUserDto, SessionDto } from '@/modules/authentication/business/repositories/IUserRepository'
import type { UserDirectPermissionItem } from '../../business/dtos/AdminPermissionDto'

export class AdminUserRepository implements IAdminUserRepository {
  private readonly client: HttpClient

  constructor(client: HttpClient) {
    this.client = client
  }

  async listUsers(params: ListUsersParams = {}): Promise<PaginatedResults<AdminUserListItem[]>> {
    return this.client.get<PaginatedResults<AdminUserListItem[]>>('/account', { params })
  }

  async getUserDetail(id: string): Promise<CurrentUserDto> {
    return this.client.get<CurrentUserDto>(`/account/${id}`)
  }

  async createUser(data: CreateUserParams): Promise<void> {
    await this.client.post('/account', { status: 'ACTIVE', ...data })
  }

  async updateUserIdentity(id: string, data: { first_name?: string; last_name?: string; email?: string }): Promise<unknown> {
    return this.client.put(`/account/${id}`, data)
  }

  async suspendUser(id: string): Promise<void> {
    await this.client.post(`/account/${id}/suspend`, {})
  }

  async activateUser(id: string): Promise<void> {
    await this.client.post(`/account/${id}/activate`, {})
  }

  async changePassword(id: string, data: { current_password: string; new_password: string; repassword: string }): Promise<unknown> {
    return this.client.post(`/account/${id}/password`, data)
  }

  async deleteUser(id: string, password: string): Promise<void> {
    await this.client.post(`/account/${id}/delete`, { password })
  }

  async updateProfile(userId: string, data: {
    phone?: string; address_line_1?: string; address_line_2?: string
    city?: string; state?: string; postal_code?: string; country?: string
  }): Promise<unknown> {
    return this.client.put(`/account/${userId}/profile`, data)
  }

  async updatePreferences(userId: string, data: {
    theme?: string; language?: string; timezone?: string
    notify_email?: boolean; notify_push?: boolean; notify_sms?: boolean
  }): Promise<unknown> {
    return this.client.put(`/account/${userId}/preferences`, data)
  }

  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.client.post('/user-roles', { user_id: userId, role_id: roleId })
  }

  async revokeRole(userId: string, roleId: string): Promise<void> {
    await this.client.delete(`/user-roles/${userId}/roles/${roleId}`)
  }

  async getUserDirectPermissions(userId: string): Promise<UserDirectPermissionItem[]> {
    return this.client.get<UserDirectPermissionItem[]>(`/user-permissions/${userId}/permissions`)
  }

  async assignDirectPermission(userId: string, permissionId: string): Promise<void> {
    await this.client.post('/user-permissions', { user_id: userId, permission_id: permissionId })
  }

  async revokeDirectPermission(userId: string, permissionId: string): Promise<void> {
    await this.client.delete(`/user-permissions/${userId}/permissions/${permissionId}`)
  }

  async listUserSessions(userId: string): Promise<SessionDto[]> {
    return this.client.get<SessionDto[]>(`/account/${userId}/sessions`)
  }

  async revokeUserSession(userId: string, sessionId: string): Promise<void> {
    await this.client.delete(`/account/${userId}/sessions/${sessionId}`)
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.client.delete(`/account/${userId}/sessions`)
  }

  async getUserTotpStatus(userId: string): Promise<TotpAdminStatus> {
    return this.client.get<TotpAdminStatus>(`/account/${userId}/2fa-status`)
  }

  async adminDisable2fa(userId: string): Promise<void> {
    await this.client.delete(`/account/${userId}/2fa`)
  }
}
