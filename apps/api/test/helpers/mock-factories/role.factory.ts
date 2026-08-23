import { Status } from "@database/prisma/generated-client"
import { v4 as uuidv4 } from "uuid"

/**
 * Role Mock Factory
 *
 * Provides methods to create mock Role entities for testing.
 */

export interface MockRoleData {
  id?: string
  name?: string
  display_name?: string
  description?: string | null
  is_system?: boolean
  status?: Status
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

/**
 * Creates a mock role data object
 */
export function createMockRoleData(overrides: MockRoleData = {}): MockRoleData {
  return {
    id: uuidv4(),
    name: "user",
    display_name: "User",
    description: "Standard user role",
    is_system: false,
    status: Status.ACTIVE as Status,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  }
}

/**
 * Creates multiple mock roles
 */
export function createMockRoles(count: number, overrides: MockRoleData = {}): MockRoleData[] {
  return Array.from({ length: count }, (_, index) =>
    createMockRoleData({
      ...overrides,
      name: overrides.name || `role_${index}`,
      display_name: overrides.display_name || `Role ${index}`,
      description: overrides.description || `Role ${index} description`,
    }),
  )
}

/**
 * Creates a mock admin role
 */
export function createMockAdminRole(overrides: MockRoleData = {}): MockRoleData {
  return createMockRoleData({
    name: "admin",
    display_name: "Administrator",
    description: "Administrator role with full access",
    is_system: true,
    ...overrides,
  })
}

/**
 * Creates a mock user role
 */
export function createMockUserRole(overrides: MockRoleData = {}): MockRoleData {
  return createMockRoleData({
    name: "user",
    display_name: "User",
    description: "Standard user role",
    is_system: false,
    ...overrides,
  })
}

/**
 * Creates a mock moderator role
 */
export function createMockModeratorRole(overrides: MockRoleData = {}): MockRoleData {
  return createMockRoleData({
    name: "moderator",
    display_name: "Moderator",
    description: "Moderator role with limited admin access",
    is_system: false,
    ...overrides,
  })
}

/**
 * Creates an inactive role
 */
export function createInactiveRole(overrides: MockRoleData = {}): MockRoleData {
  return createMockRoleData({
    status: Status.INACTIVE as Status,
    ...overrides,
  })
}
