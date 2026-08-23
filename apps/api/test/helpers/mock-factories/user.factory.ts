import { User } from "@account/business/entities/user.entity"
import { Status } from "@database/prisma/generated-client"
import { v4 as uuidv4 } from "uuid"

/**
 * User Mock Factory
 *
 * Provides methods to create mock User entities for testing.
 */

export interface MockUserData {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  password?: string
  status?: Status
  last_login?: Date | null
  created_at?: Date
  updated_at?: Date
  deleted_at?: Date | null
}

/**
 * Creates a mock user with default or custom data
 */
export function createMockUser(overrides: MockUserData = {}): User {
  const defaultData = {
    id: uuidv4(),
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    // Use a valid SHA-256 hash (64 hex characters)
    password: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3", // hash of 'password'
    status: Status.ACTIVE,
    last_login: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  }

  const result = User.instance(defaultData)

  if (!result.isOk) {
    throw new Error(`Failed to create mock user: ${JSON.stringify(result.error)}`)
  }

  return result.value
}

/**
 * Creates multiple mock users
 */
export function createMockUsers(count: number, overrides: MockUserData = {}): User[] {
  return Array.from({ length: count }, (_, index) =>
    createMockUser({
      ...overrides,
      email: overrides.email ? `${index}-${overrides.email}` : `user${index}@example.com`,
      first_name: overrides.first_name || `User${index}`,
    }),
  )
}

/**
 * Creates a mock user data object (not an entity instance)
 */
export function createMockUserData(overrides: MockUserData = {}): MockUserData {
  return {
    id: uuidv4(),
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    password: "SecurePassword123!",
    status: Status.ACTIVE,
    last_login: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  }
}

/**
 * Creates a mock admin user
 */
export function createMockAdminUser(overrides: MockUserData = {}): User {
  return createMockUser({
    email: "admin@example.com",
    first_name: "Admin",
    last_name: "User",
    ...overrides,
  })
}
