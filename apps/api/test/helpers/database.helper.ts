/**
 * Database Test Helper
 *
 * Utilities for setting up and tearing down test database.
 */

import { PrismaClient } from "@database/prisma/generated-client"
import { PrismaService } from "@shared/integration/services/prisma.service"

/**
 * Creates a test database connection
 */
export const createTestDatabase = (): PrismaService => {
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === "DATABASE_URL") {
        return process.env.DATABASE_URL
      }
      return null
    }),
  } as any

  return new PrismaService(mockConfigService)
}

/**
 * Cleans up all tables in the test database
 */
export const cleanDatabase = async (prisma: PrismaClient): Promise<void> => {
  const tables = [
    "user_roles",
    "role_permissions",
    "permissions",
    "roles",
    "refresh_tokens",
    "users",
  ]

  // Disable foreign key checks
  await prisma.$executeRawUnsafe("SET CONSTRAINTS ALL DEFERRED;")

  // Delete all data from tables
  for (const table of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
  }

  // Re-enable foreign key checks
  await prisma.$executeRawUnsafe("SET CONSTRAINTS ALL IMMEDIATE;")
}

/**
 * Sets up the test database before tests
 */
export const setupTestDatabase = async (prisma: PrismaClient): Promise<void> => {
  // Ensure connection is established
  await prisma.$connect()
  await cleanDatabase(prisma)
}

/**
 * Tears down the test database after tests
 */
export const teardownTestDatabase = async (prisma: PrismaService): Promise<void> => {
  if (!prisma) {
    console.warn("PrismaService is undefined in teardown")
    return
  }

  try {
    await cleanDatabase(prisma)
    await prisma.$disconnect()
  } catch (error) {
    console.error("Error during teardown:", error)
  }
}

/**
 * Creates a mock PrismaService for unit tests
 */
export const createMockPrismaService = (): Partial<PrismaService> => {
  return {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    } as any,
    role: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any,
    permission: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any,
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    } as any,
    userRole: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    } as any,
    rolePermission: {
      create: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    } as any,
    $transaction: jest.fn().mockImplementation((arg) => {
      if (typeof arg === "function") {
        return arg({} as any)
      }
      return Promise.resolve(arg)
    }),
    $disconnect: jest.fn(),
  }
}
