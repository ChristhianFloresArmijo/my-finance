import { UserRepository } from "@account/integration/repositories/user.repository"
import { User } from "@account/business/entities"
import { Status } from '@database/prisma/generated-client'
import {
  createTestDatabase,
  cleanDatabase,
} from "../../helpers/database.helper"

/**
 * UserRepository Integration Tests
 *
 * Tests for the UserRepository with actual database interactions.
 * These tests require a running PostgreSQL database.
 */

describe("UserRepository (Integration)", () => {
  let repository: UserRepository
  let prismaService: any

  beforeAll(async () => {
    prismaService = createTestDatabase()
    await prismaService.$connect()
    repository = new UserRepository(prismaService)
  })

  afterAll(async () => {
    if (prismaService && prismaService.pool) {
      await prismaService.pool.end()
    }
    await prismaService.$disconnect()
  })

  beforeEach(async () => {
    await cleanDatabase(prismaService)
  })

  describe("save", () => {
    it("should create a new user", async () => {
      // Arrange
      const userData = {
        id: "test-user-1",
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        password: "hashed_password_123",
        status: Status.ACTIVE,
      }
      const user = User.instance(userData).value as User

      // Act
      const result = await repository.save(user)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.id).toBe(user.id)
        expect(result.value.email).toBe(user.email)
        expect(result.value.first_name).toBe(user.first_name)
      }
    })

    it("should update an existing user", async () => {
      // Arrange - create initial user
      const userData = {
        id: "test-user-2",
        first_name: "Jane",
        last_name: "Smith",
        email: "jane@example.com",
        password: "hashed_password_456",
        status: Status.ACTIVE,
      }
      const user = User.instance(userData).value as User
      await repository.save(user)

      // Modify user
      const updatedUserData = {
        ...userData,
        first_name: "Jane Updated",
      }
      const updatedUser = User.instance(updatedUserData).value as User

      // Act
      const result = await repository.save(updatedUser)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.first_name).toBe("Jane Updated")
      }
    })
  })

  describe("findByEmail", () => {
    it("should find user by email", async () => {
      // Arrange
      const userData = {
        id: "test-user-4",
        first_name: "Alice",
        last_name: "Williams",
        email: "alice@example.com",
        password: "hashed_password_abc",
        status: Status.ACTIVE,
      }
      const user = User.instance(userData).value as User
      await repository.save(user)

      // Act
      const result = await repository.findByEmail("alice@example.com")

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk && result.value) {
        expect(result.value.email).toBe("alice@example.com")
        expect(result.value.first_name).toBe("Alice")
      }
    })

    it("should return null for non-existent email", async () => {
      // Act
      const result = await repository.findByEmail("nonexistent@example.com")

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBeNull()
      }
    })
  })
})
