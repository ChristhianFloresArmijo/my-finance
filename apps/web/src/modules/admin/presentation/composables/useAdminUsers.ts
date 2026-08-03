import { ref, inject } from 'vue'
import { HTTP_CLIENT_KEY } from '@/shared/integration'
import { AdminUserRepository } from '@/modules/admin/integration/repositories'
import type { AdminUserListItem } from '@/modules/admin/business/dtos/AdminUserDto'
import type { CurrentUserDto, SessionDto } from '@/modules/authentication/business/repositories/IUserRepository'
import type { UserDirectPermissionItem } from '@/modules/admin/business/dtos/AdminPermissionDto'
import type { TotpAdminStatus } from '@/modules/admin/business/repositories/IAdminUserRepository'

export function useAdminUsers() {
  const users = ref<AdminUserListItem[]>([])
  const total = ref(0)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const client = inject(HTTP_CLIENT_KEY)!
  const repo = new AdminUserRepository(client)

  // ─── List ──────────────────────────────────────────────────────────────────

  async function listUsers(params: { limit?: number; offset?: number; search?: string; status?: string; role?: string } = {}) {
    isLoading.value = true
    error.value = null
    try {
      const response = await repo.listUsers(params)
      users.value = response.results
      total.value = response.count
    } catch {
      error.value = 'Failed to load users'
    } finally {
      isLoading.value = false
    }
  }

  // ─── Single detail ─────────────────────────────────────────────────────────

  async function getUserDetail(id: string): Promise<CurrentUserDto> {
    return repo.getUserDetail(id)
  }

  // ─── Create ────────────────────────────────────────────────────────────────

  async function createUser(data: {
    first_name: string
    last_name: string
    email: string
    password: string
    repassword: string
    status?: string
    role_ids?: string[]
    send_credentials?: boolean
  }) {
    await repo.createUser(data)
    await listUsers()
  }

  // ─── Identity ──────────────────────────────────────────────────────────────

  async function updateUserIdentity(id: string, data: {
    first_name?: string; last_name?: string; email?: string
  }) {
    return repo.updateUserIdentity(id, data)
  }

  // ─── Status ────────────────────────────────────────────────────────────────

  async function suspendUser(id: string) {
    await repo.suspendUser(id)
    await listUsers()
  }

  async function activateUser(id: string) {
    await repo.activateUser(id)
    await listUsers()
  }

  // ─── Password ──────────────────────────────────────────────────────────────

  async function changePassword(id: string, data: {
    current_password: string; new_password: string; repassword: string
  }) {
    return repo.changePassword(id, data)
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  async function deleteUser(id: string, password: string) {
    await repo.deleteUser(id, password)
    await listUsers()
  }

  // ─── Profile ───────────────────────────────────────────────────────────────

  async function updateProfile(userId: string, data: {
    phone?: string; address_line_1?: string; address_line_2?: string
    city?: string; state?: string; postal_code?: string; country?: string
  }) {
    return repo.updateProfile(userId, data)
  }

  // ─── Preferences ───────────────────────────────────────────────────────────

  async function updatePreferences(userId: string, data: {
    theme?: string; language?: string; timezone?: string
    notify_email?: boolean; notify_push?: boolean; notify_sms?: boolean
  }) {
    return repo.updatePreferences(userId, data)
  }

  // ─── Roles ─────────────────────────────────────────────────────────────────

  async function assignRole(userId: string, roleId: string) {
    await repo.assignRole(userId, roleId)
  }

  async function revokeRole(userId: string, roleId: string) {
    await repo.revokeRole(userId, roleId)
  }

  // ─── Direct permissions ────────────────────────────────────────────────────

  async function getUserDirectPermissions(userId: string): Promise<UserDirectPermissionItem[]> {
    return repo.getUserDirectPermissions(userId)
  }

  async function assignDirectPermission(userId: string, permissionId: string) {
    await repo.assignDirectPermission(userId, permissionId)
  }

  async function revokeDirectPermission(userId: string, permissionId: string) {
    await repo.revokeDirectPermission(userId, permissionId)
  }

  // ─── Sessions ──────────────────────────────────────────────────────────────

  async function listUserSessions(userId: string): Promise<SessionDto[]> {
    return repo.listUserSessions(userId)
  }

  async function revokeUserSession(userId: string, sessionId: string) {
    await repo.revokeUserSession(userId, sessionId)
  }

  async function revokeAllUserSessions(userId: string) {
    await repo.revokeAllUserSessions(userId)
  }

  // ─── 2FA (admin) ───────────────────────────────────────────────────────────

  async function getUserTotpStatus(userId: string): Promise<TotpAdminStatus> {
    return repo.getUserTotpStatus(userId)
  }

  async function adminDisable2fa(userId: string) {
    await repo.adminDisable2fa(userId)
  }

  return {
    users, total, isLoading, error,
    listUsers, getUserDetail, createUser,
    updateUserIdentity, suspendUser, activateUser, changePassword, deleteUser,
    updateProfile, updatePreferences,
    assignRole, revokeRole,
    getUserDirectPermissions, assignDirectPermission, revokeDirectPermission,
    listUserSessions, revokeUserSession, revokeAllUserSessions,
    getUserTotpStatus, adminDisable2fa,
  }
}
