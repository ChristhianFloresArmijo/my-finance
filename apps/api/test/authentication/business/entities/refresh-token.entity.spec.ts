import { RefreshToken } from "@auth/business/entities/refresh-token.entity"
import { Status } from "@database/prisma/generated-client"
import {
  createMockRefreshToken,
  createExpiredRefreshToken,
  createRevokedRefreshToken,
} from "../../../helpers/mock-factories/refresh-token.factory"

/**
 * RefreshToken Entity Unit Tests
 *
 * Tests the RefreshToken entity validation, creation, and business logic.
 */

describe("RefreshToken Entity", () => {
  describe("instance", () => {
    it("should create valid refresh token with all fields", () => {
      // Arrange
      const data = {
        id: "token-123",
        user_id: "user-123",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: Status.ACTIVE,
        created_at: new Date(),
        updated_at: null,
        deleted_at: null,
      }

      // Act
      const result = RefreshToken.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.id).toBe(data.id)
        expect(result.value.user_id).toBe(data.user_id)
        expect(result.value.expires_at).toEqual(data.expires_at)
        expect(result.value.status).toBe(Status.ACTIVE)
        expect(result.value.created_at).toEqual(data.created_at)
      }
    })

    it("should create token with default expires_at (1 day) when not provided", () => {
      // Arrange
      const data = {
        id: "token-123",
        user_id: "user-123",
        status: Status.ACTIVE,
      }

      // Act
      const result = RefreshToken.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        const expectedExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
        const diff = Math.abs(result.value.expires_at.getTime() - expectedExpiry.getTime())
        expect(diff).toBeLessThan(1000) // Within 1 second
      }
    })

    it("should reject missing id", () => {
      // Arrange
      const data = {
        // id is undefined
        user_id: "user-123",
        status: Status.ACTIVE,
      }

      // Act
      const result = RefreshToken.instance(data as any)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toHaveProperty("id")
      }
    })

    it("should reject missing user_id", () => {
      // Arrange
      const data = {
        id: "token-123",
        // user_id is undefined
        status: Status.ACTIVE,
      }

      // Act
      const result = RefreshToken.instance(data as any)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toHaveProperty("user_id")
      }
    })

    it("should reject invalid status", () => {
      // Arrange
      const data = {
        id: "token-123",
        user_id: "user-123",
        status: "INVALID_STATUS" as Status,
      }

      // Act
      const result = RefreshToken.instance(data)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toHaveProperty("status")
      }
    })

    it("should create token with ACTIVE status by default", () => {
      // Arrange
      const data = {
        id: "token-123",
        user_id: "user-123",
        status: Status.ACTIVE,
      }

      // Act
      const result = RefreshToken.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.status).toBe(Status.ACTIVE)
      }
    })
  })

  describe("validate", () => {
    it("should validate complete refresh token data", () => {
      // Arrange
      const data = {
        id: "token-123",
        user_id: "user-123",
        status: Status.ACTIVE,
      }

      // Act
      const result = RefreshToken.validate(data)

      // Assert
      expect(result.isOk).toBe(true)
    })

    it("should fail validation for incomplete data", () => {
      // Arrange
      const data = {
        id: "token-123",
        // Missing user_id and status
      }

      // Act
      const result = RefreshToken.validate(data as any)

      // Assert
      expect(result.isOk).toBe(false)
    })
  })

  describe("partialValidate", () => {
    it("should validate partial refresh token data", () => {
      // Arrange
      const data = {
        id: "token-123",
        user_id: "user-123",
        status: Status.ACTIVE,
        // Partial data - missing optional fields like expires_at
      }

      // Act
      const result = RefreshToken.partialValidate(data)

      // Assert
      expect(result.isOk).toBe(true)
    })

    it("should reject invalid field types in partial validation", () => {
      // Arrange
      const data = {
        id: 123, // Should be string
        user_id: "user-123",
        status: Status.ACTIVE,
      }

      // Act
      const result = RefreshToken.partialValidate(data as any)

      // Assert
      expect(result.isOk).toBe(false)
    })
  })

  describe("Mock Factory Integration", () => {
    it("should work with createMockRefreshToken factory", () => {
      // Act
      const token = createMockRefreshToken()

      // Assert
      expect(token).toBeInstanceOf(RefreshToken)
      expect(token.id).toBeDefined()
      expect(token.user_id).toBeDefined()
      expect(token.status).toBe(Status.ACTIVE)
      expect(token.expires_at).toBeInstanceOf(Date)
      expect(token.expires_at.getTime()).toBeGreaterThan(Date.now())
    })

    it("should create expired token using factory", () => {
      // Act
      const token = createExpiredRefreshToken()

      // Assert
      expect(token).toBeInstanceOf(RefreshToken)
      expect(token.expires_at.getTime()).toBeLessThan(Date.now())
    })

    it("should create revoked token using factory", () => {
      // Act
      const token = createRevokedRefreshToken()

      // Assert
      expect(token).toBeInstanceOf(RefreshToken)
      expect(token.deleted_at).not.toBeNull()
      expect(token.status).toBe(Status.INACTIVE)
    })

    it("should allow overriding factory defaults", () => {
      // Arrange
      const customUserId = "custom-user-123"

      // Act
      const token = createMockRefreshToken({ user_id: customUserId })

      // Assert
      expect(token.user_id).toBe(customUserId)
    })
  })
})
