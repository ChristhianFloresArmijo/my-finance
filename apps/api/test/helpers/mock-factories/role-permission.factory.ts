import { Status } from '@database/prisma/generated-client'
import { v4 as uuidv4 } from "uuid"

/**
 * RolePermission Mock Factory
 *
 * Provides methods to create mock RolePermission entities for testing.
 */

export interface MockRolePermissionData {
  id?: string
  role_id?: string
  permission_id?: string
  status?: Status
  created_at?: Date
  updated_at?: Date | null
  deleted_at?: Date | null
}

/**
 * Creates a mock role-permission data object
 */
export function createMockRolePermissionData(
  overrides: MockRolePermissionData = {},
): MockRolePermissionData {
  return {
    id: uuidv4(),
    role_id: uuidv4(),
    permission_id: uuidv4(),
    status: Status.ACTIVE as Status,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  }
}

/**
 * Creates multiple mock role-permission assignments
 */
export function createMockRolePermissions(
  count: number,
  overrides: MockRolePermissionData = {},
): MockRolePermissionData[] {
  return Array.from({ length: count }, () => createMockRolePermissionData(overrides))
}

/**
 * Creates an inactive role-permission assignment
 */
export function createInactiveRolePermission(
  overrides: MockRolePermissionData = {},
): MockRolePermissionData {
  return createMockRolePermissionData({
    status: Status.INACTIVE as Status,
    ...overrides,
  })
}

/**
 * Creates role-permission assignments for a specific role
 */
export function createRolePermissionsForRole(
  roleId: string,
  permissionIds: string[],
): MockRolePermissionData[] {
  return permissionIds.map((permissionId) =>
    createMockRolePermissionData({
      role_id: roleId,
      permission_id: permissionId,
    }),
  )
}
