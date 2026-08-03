import { Status } from '@database/prisma/generated-client'
import { v4 as uuidv4 } from "uuid"

/**
 * Permission Mock Factory
 *
 * Provides methods to create mock Permission entities for testing.
 */

export interface MockPermissionData {
  id?: string
  resource?: string
  action?: string
  description?: string | null
  is_system?: boolean
  status?: Status
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

/**
 * Creates a mock permission data object
 */
export function createMockPermissionData(overrides: MockPermissionData = {}): MockPermissionData {
  return {
    id: uuidv4(),
    resource: "users",
    action: "read",
    description: "Permission to read user data",
    is_system: false,
    status: Status.ACTIVE as Status,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  }
}

/**
 * Creates multiple mock permissions
 */
export function createMockPermissions(
  count: number,
  overrides: MockPermissionData = {},
): MockPermissionData[] {
  return Array.from({ length: count }, (_, index) =>
    createMockPermissionData({
      ...overrides,
      resource: overrides.resource || `resource_${index}`,
      action: overrides.action || "read",
      description: overrides.description || `Permission ${index} description`,
    }),
  )
}

/**
 * Creates standard CRUD permissions for a resource
 */
export function createCrudPermissions(resource: string): MockPermissionData[] {
  return [
    createMockPermissionData({
      resource,
      action: "create",
      description: `Create ${resource}`,
    }),
    createMockPermissionData({
      resource,
      action: "read",
      description: `Read ${resource}`,
    }),
    createMockPermissionData({
      resource,
      action: "update",
      description: `Update ${resource}`,
    }),
    createMockPermissionData({
      resource,
      action: "delete",
      description: `Delete ${resource}`,
    }),
  ]
}

/**
 * Creates an inactive permission
 */
export function createInactivePermission(overrides: MockPermissionData = {}): MockPermissionData {
  return createMockPermissionData({
    status: Status.INACTIVE as Status,
    ...overrides,
  })
}
