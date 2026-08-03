import { Status } from '@database/prisma/generated-client'
import { v4 as uuidv4 } from "uuid"

/**
 * UserRole Mock Factory
 *
 * Provides methods to create mock UserRole entities for testing.
 */

export interface MockUserRoleData {
  id?: string
  user_id?: string
  role_id?: string
  status?: Status
  assigned_by?: string | null
  assigned_at?: Date
  expires_at?: Date | null
  created_at?: Date
  updated_at?: Date | null
  deleted_at?: Date | null
}

/**
 * Creates a mock user-role data object
 */
export function createMockUserRoleData(overrides: MockUserRoleData = {}): MockUserRoleData {
  return {
    id: uuidv4(),
    user_id: uuidv4(),
    role_id: uuidv4(),
    status: Status.ACTIVE as Status,
    assigned_by: null,
    assigned_at: new Date(),
    expires_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  }
}

/**
 * Creates multiple mock user-role assignments
 */
export function createMockUserRoles(
  count: number,
  overrides: MockUserRoleData = {},
): MockUserRoleData[] {
  return Array.from({ length: count }, () => createMockUserRoleData(overrides))
}

/**
 * Creates a user-role assignment with expiration
 */
export function createExpiringUserRole(
  daysFromNow: number = 30,
  overrides: MockUserRoleData = {},
): MockUserRoleData {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + daysFromNow)

  return createMockUserRoleData({
    expires_at: expiresAt,
    ...overrides,
  })
}

/**
 * Creates an expired user-role assignment
 */
export function createExpiredUserRole(overrides: MockUserRoleData = {}): MockUserRoleData {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() - 1) // Yesterday

  return createMockUserRoleData({
    expires_at: expiresAt,
    ...overrides,
  })
}

/**
 * Creates an inactive user-role assignment
 */
export function createInactiveUserRole(overrides: MockUserRoleData = {}): MockUserRoleData {
  return createMockUserRoleData({
    status: Status.INACTIVE as Status,
    ...overrides,
  })
}

/**
 * Creates a user-role assignment with assigned_by field
 */
export function createAssignedUserRole(
  assignedBy: string,
  overrides: MockUserRoleData = {},
): MockUserRoleData {
  return createMockUserRoleData({
    assigned_by: assignedBy,
    ...overrides,
  })
}
