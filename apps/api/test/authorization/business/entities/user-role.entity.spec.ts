import { Status } from '@database/prisma/generated-client'
import { UserRole } from "@authorization/business/entities/user-role.entity"
import {
  createMockUserRoleData,
  createExpiringUserRole,
  createExpiredUserRole,
} from "../../../helpers/mock-factories"

describe("UserRole Entity", () => {
  describe("instance()", () => {
    it("should create a valid user-role with required fields", () => {
      // Arrange
      const userId = "user-123"
      const roleId = "role-456"
      const data = {
        user_id: userId,
        role_id: roleId,
        status: Status.ACTIVE,
        assigned_at: new Date(),
      }

      // Act
      const result = UserRole.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.user_id).toBe(userId)
        expect(result.value.role_id).toBe(roleId)
        expect(result.value.status).toBe(Status.ACTIVE)
        expect(result.value.assigned_at).toBeInstanceOf(Date)
      }
    })

    it("should auto-generate UUID if not provided", () => {
      // Arrange
      const data = {
        user_id: "user-123",
        role_id: "role-456",
        status: Status.ACTIVE,
        assigned_at: new Date(),
      }

      // Act
      const result = UserRole.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.id).toBeDefined()
        expect(typeof result.value.id).toBe("string")
        expect(result.value.id.length).toBeGreaterThan(0)
      }
    })

    it("should reject missing user_id", () => {
      // Arrange
      const data = {
        role_id: "role-456",
        status: Status.ACTIVE,
      } as any

      // Act
      const result = UserRole.instance(data)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeDefined()
      }
    })

    it("should reject missing role_id", () => {
      // Arrange
      const data = {
        user_id: "user-123",
        status: Status.ACTIVE,
      } as any

      // Act
      const result = UserRole.instance(data)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeDefined()
      }
    })

    it("should reject empty user_id", () => {
      // Arrange
      const data = {
        user_id: undefined,
        role_id: "role-456",
        status: Status.ACTIVE,
      }

      // Act
      const result = UserRole.instance(data as any)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should reject empty role_id", () => {
      // Arrange
      const data = {
        user_id: "user-123",
        role_id: undefined,
        status: Status.ACTIVE,
      }

      // Act
      const result = UserRole.instance(data as any)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should accept ACTIVE status", () => {
      // Arrange
      const data = {
        user_id: "user-123",
        role_id: "role-456",
        status: Status.ACTIVE,
        assigned_at: new Date(),
      }

      // Act
      const result = UserRole.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.status).toBe(Status.ACTIVE)
      }
    })

    it("should accept INACTIVE status", () => {
      // Arrange
      const data = {
        user_id: "user-123",
        role_id: "role-456",
        status: Status.INACTIVE,
        assigned_at: new Date(),
      }

      // Act
      const result = UserRole.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.status).toBe(Status.INACTIVE)
      }
    })

    it("should set assigned_at to current time if not provided", () => {
      // Arrange
      const data = {
        user_id: "user-123",
        role_id: "role-456",
        status: Status.ACTIVE,
        assigned_at: new Date(),
      }

      // Act
      const result = UserRole.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.assigned_at).toBeDefined()
        expect(result.value.assigned_at).toBeInstanceOf(Date)
      }
    })

    it("should handle null expires_at (no expiration)", () => {
      // Arrange
      const data = {
        user_id: "user-123",
        role_id: "role-456",
        status: Status.ACTIVE,
        assigned_at: new Date(),
        expires_at: null,
      }

      // Act
      const result = UserRole.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.expires_at).toBeNull()
      }
    })

    it("should handle undefined expires_at", () => {
      // Arrange
      const data = {
        user_id: "user-123",
        role_id: "role-456",
        status: Status.ACTIVE,
        assigned_at: new Date(),
      }

      // Act
      const result = UserRole.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
    })

    it("should accept future expires_at date", () => {
      // Arrange
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const data = createExpiringUserRole(30, {
        user_id: "user-123",
        role_id: "role-456",
      })

      // Act
      const result = UserRole.instance(data as any)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.expires_at).toBeInstanceOf(Date)
        expect(result.value.expires_at!.getTime()).toBeGreaterThan(new Date().getTime())
      }
    })

    it("should accept past expires_at date (for expired assignments)", () => {
      // Arrange
      const data = createExpiredUserRole({
        user_id: "user-123",
        role_id: "role-456",
      })

      // Act
      const result = UserRole.instance(data as any)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.expires_at).toBeInstanceOf(Date)
        expect(result.value.expires_at!.getTime()).toBeLessThan(new Date().getTime())
      }
    })

    it("should handle null assigned_by", () => {
      // Arrange
      const data = {
        user_id: "user-123",
        role_id: "role-456",
        status: Status.ACTIVE,
        assigned_by: null,
        assigned_at: new Date(),
      }

      // Act
      const result = UserRole.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.assigned_by).toBeNull()
      }
    })

    it("should accept valid assigned_by user ID", () => {
      // Arrange
      const assignerId = "admin-789"
      const data = createMockUserRoleData({
        user_id: "user-123",
        role_id: "role-456",
        assigned_by: assignerId,
      })

      // Act
      const result = UserRole.instance(data as any)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.assigned_by).toBe(assignerId)
      }
    })

    it("should set timestamps automatically", () => {
      // Arrange
      const data = {
        user_id: "user-123",
        role_id: "role-456",
        status: Status.ACTIVE,
        assigned_at: new Date(),
      }

      // Act
      const result = UserRole.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.created_at).toBeInstanceOf(Date)
      }
    })

    it("should work with mock factory", () => {
      // Arrange
      const mockData = createMockUserRoleData({
        user_id: "user-123",
        role_id: "role-456",
      })

      // Act
      const result = UserRole.instance(mockData as any)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.user_id).toBe(mockData.user_id)
        expect(result.value.role_id).toBe(mockData.role_id)
        expect(result.value.status).toBe(Status.ACTIVE)
      }
    })
  })

  describe("validate()", () => {
    it("should validate correct user-role data", () => {
      // Arrange
      const data = {
        user_id: "user-123",
        role_id: "role-456",
        status: Status.ACTIVE,
        assigned_at: new Date(),
      }

      // Act
      const result = UserRole.validate(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(true)
      }
    })

    it("should reject invalid status", () => {
      // Arrange
      const data = {
        user_id: "user-123",
        role_id: "role-456",
        assigned_at: new Date(),
        status: "INVALID_STATUS" as any,
      }

      // Act
      const result = UserRole.validate(data)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should reject data missing required fields", () => {
      // Arrange
      const data = {
        user_id: "user-123",
        assigned_at: new Date(),
        // Missing role_id and status
      } as any

      // Act
      const result = UserRole.validate(data)

      // Assert
      expect(result.isOk).toBe(false)
    })
  })
})
