import { RefreshTokenRepository } from "@auth/integration/repositories/refresh-token.repository"
import { RefreshToken } from "@auth/business/entities/refresh-token.entity"
import { Status } from "@database/prisma/generated-client"
import { createTestDatabase, cleanDatabase } from "../../helpers/database.helper"
import { createMockRefreshToken } from "../../helpers/mock-factories/refresh-token.factory"

/**
 * RefreshTokenRepository Integration Tests
 *
 * Tests the RefreshToken repository with a real database connection.
 * These tests verify database operations, constraints, and query logic.
 */

describe("RefreshTokenRepository (Integration)", () => {
  let repository: RefreshTokenRepository
  let prismaService: any

  beforeAll(async () => {
    prismaService = createTestDatabase()
    repository = new RefreshTokenRepository(prismaService)
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
    it("should create a new refresh token", async () => {
      // Arrange - Create a user first (foreign key constraint)
      await prismaService.user.create({
        data: {
          id: "user-123",
          first_name: "Test",
          last_name: "User",
          email: "test@example.com",
          password: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
          status: Status.ACTIVE,
        },
      })

      const token = createMockRefreshToken({
        user_id: "user-123",
      })

      // Act
      const result = await repository.save(token)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.id).toBeDefined()
        expect(result.value.user_id).toBe("user-123")
        expect(result.value.status).toBe(Status.ACTIVE)

        // Verify in database
        const dbToken = await prismaService.refreshToken.findUnique({
          where: { id: result.value.id },
        })
        expect(dbToken).toBeDefined()
        expect(dbToken.user_id).toBe("user-123")
      }
    })

    it("should update existing refresh token", async () => {
      // Arrange - Create user
      await prismaService.user.create({
        data: {
          id: "user-456",
          first_name: "Test",
          last_name: "User",
          email: "test2@example.com",
          password: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
          status: Status.ACTIVE,
        },
      })

      const token = createMockRefreshToken({
        user_id: "user-456",
        status: Status.ACTIVE,
      })

      const savedResult = await repository.save(token)
      expect(savedResult.isOk).toBe(true)

      // Modify token
      const updatedToken = RefreshToken.instance({
        ...savedResult.value,
        status: Status.INACTIVE,
      })

      // Act
      const result = await repository.save(updatedToken.value)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.status).toBe(Status.INACTIVE)

        // Verify in database
        const dbToken = await prismaService.refreshToken.findUnique({
          where: { id: result.value.id },
        })
        expect(dbToken.status).toBe(Status.INACTIVE)
      }
    })
  })

  describe("findByUserToken", () => {
    it("should find token by user ID and token ID", async () => {
      // Arrange - Create user
      const userId = "user-789"
      await prismaService.user.create({
        data: {
          id: userId,
          first_name: "Test",
          last_name: "User",
          email: "test3@example.com",
          password: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
          status: Status.ACTIVE,
        },
      })

      const token = createMockRefreshToken({
        user_id: userId,
      })

      const savedResult = await repository.save(token)
      expect(savedResult.isOk).toBe(true)

      // Act
      const result = await repository.findByUserToken(userId, savedResult.value.id)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBeDefined()
        expect(result.value.user_id).toBe(userId)
        expect(result.value.id).toBe(savedResult.value.id)
      }
    })

    it("should return null when token not found", async () => {
      // Arrange
      const userId = "user-789"
      const tokenId = "nonexistent-token"

      // Act
      const result = await repository.findByUserToken(userId, tokenId)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBeNull()
      }
    })

    it("should return null when user ID doesn't match", async () => {
      // Arrange - Create user
      await prismaService.user.create({
        data: {
          id: "user-xyz",
          first_name: "Test",
          last_name: "User",
          email: "test4@example.com",
          password: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
          status: Status.ACTIVE,
        },
      })

      const token = createMockRefreshToken({
        user_id: "user-xyz",
      })

      const savedResult = await repository.save(token)
      expect(savedResult.isOk).toBe(true)

      // Act - Different user ID
      const result = await repository.findByUserToken("different-user", savedResult.value.id)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBeNull()
      }
    })
  })

  describe("deleteMany", () => {
    it("should delete tokens matching criteria", async () => {
      // Arrange - Create users first
      await prismaService.user.createMany({
        data: [
          {
            id: "user-del-1",
            first_name: "User",
            last_name: "One",
            email: "userdel1@example.com",
            password: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
            status: Status.ACTIVE,
          },
          {
            id: "user-del-2",
            first_name: "User",
            last_name: "Two",
            email: "userdel2@example.com",
            password: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
            status: Status.ACTIVE,
          },
          {
            id: "user-del-3",
            first_name: "User",
            last_name: "Three",
            email: "userdel3@example.com",
            password: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
            status: Status.ACTIVE,
          },
        ],
      })

      const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 60 days ago

      // Create old inactive tokens
      await prismaService.refreshToken.create({
        data: {
          id: "token-del-1",
          user_id: "user-del-1",
          status: Status.INACTIVE,
          expires_at: new Date(),
          created_at: oldDate,
          updated_at: oldDate,
        },
      })

      await prismaService.refreshToken.create({
        data: {
          id: "token-del-2",
          user_id: "user-del-2",
          status: Status.INACTIVE,
          expires_at: new Date(),
          created_at: oldDate,
          updated_at: oldDate,
        },
      })

      // Create recent active token (should not be deleted)
      await prismaService.refreshToken.create({
        data: {
          id: "token-del-3",
          user_id: "user-del-3",
          status: Status.ACTIVE,
          expires_at: new Date(),
        },
      })

      // Act
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const result = await repository.deleteMany({
        where: {
          status: Status.INACTIVE,
          updated_at: {
            lt: cutoffDate,
          },
        },
      })

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(2)
      }

      // Verify only inactive old tokens were deleted
      const remainingTokens = await prismaService.refreshToken.findMany({
        where: { user_id: { in: ["user-del-1", "user-del-2", "user-del-3"] } },
      })
      expect(remainingTokens).toHaveLength(1)
      expect(remainingTokens[0].status).toBe(Status.ACTIVE)
      expect(remainingTokens[0].id).toBe("token-del-3")
    })

    it("should return 0 when no tokens match criteria", async () => {
      // Arrange - Create user
      await prismaService.user.create({
        data: {
          id: "user-nomatch",
          first_name: "No",
          last_name: "Match",
          email: "nomatch@example.com",
          password: "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
          status: Status.ACTIVE,
        },
      })

      await repository.save(
        createMockRefreshToken({
          user_id: "user-nomatch",
          status: Status.ACTIVE,
        }),
      )

      // Act - Try to delete INACTIVE tokens
      const result = await repository.deleteMany({
        where: {
          status: Status.INACTIVE,
        },
      })

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(0)
      }
    })
  })
})
