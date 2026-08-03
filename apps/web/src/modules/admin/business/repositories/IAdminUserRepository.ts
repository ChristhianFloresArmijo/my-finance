import type { PaginatedResults } from '@/shared/business'
import type { AdminUserListItem } from '../dtos/AdminUserDto'
import type { CurrentUserDto, SessionDto } from '@/modules/authentication/business/repositories/IUserRepository'
import type { UserDirectPermissionItem } from '../dtos/AdminPermissionDto'

export interface ListUsersParams {
  limit?: number
  offset?: number
  search?: string
  status?: string
  role?: string
}

export interface CreateUserParams {
  first_name: string
  last_name: string
  email: string
  password: string
  repassword: string
  status?: string
  role_ids?: string[]
  send_credentials?: boolean
}

export interface TotpAdminStatus {
  totp_enabled: boolean
  totp_enabled_at: string | null
  recovery_codes_remaining: number
}

export interface IAdminUserRepository {
  listUsers(params?: ListUsersParams): Promise<PaginatedResults<AdminUserListItem[]>>
  getUserDetail(id: string): Promise<CurrentUserDto>
  createUser(data: CreateUserParams): Promise<void>
  updateUserIdentity(id: string, data: { first_name?: string; last_name?: string; email?: string }): Promise<unknown>
  suspendUser(id: string): Promise<void>
  activateUser(id: string): Promise<void>
  changePassword(id: string, data: { current_password: string; new_password: string; repassword: string }): Promise<unknown>
  deleteUser(id: string, password: string): Promise<void>
  updateProfile(userId: string, data: {
    phone?: string
    address_line_1?: string
    address_line_2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }): Promise<unknown>
  updatePreferences(userId: string, data: {
    theme?: string
    language?: string
    timezone?: string
    notify_email?: boolean
    notify_push?: boolean
    notify_sms?: boolean
  }): Promise<unknown>
  assignRole(userId: string, roleId: string): Promise<void>
  revokeRole(userId: string, roleId: string): Promise<void>
  getUserDirectPermissions(userId: string): Promise<UserDirectPermissionItem[]>
  assignDirectPermission(userId: string, permissionId: string): Promise<void>
  revokeDirectPermission(userId: string, permissionId: string): Promise<void>
  listUserSessions(userId: string): Promise<SessionDto[]>
  revokeUserSession(userId: string, sessionId: string): Promise<void>
  revokeAllUserSessions(userId: string): Promise<void>
  getUserTotpStatus(userId: string): Promise<TotpAdminStatus>
  adminDisable2fa(userId: string): Promise<void>
}
