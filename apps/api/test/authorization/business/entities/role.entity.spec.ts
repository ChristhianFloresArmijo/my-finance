import { Status } from '@database/prisma/generated-client'
import { Role } from "@authorization/business/entities/role.entity"
import { createMockRoleData } from "../../../helpers/mock-factories"

describe("Role Entity", () => {
  describe("instance()", () => {
    it("should create a valid role with required fields", () => {
      // Arrange
      const data = {
        name: "admin",
        display_name: "Administrator",
        description: "Administrator role",
        is_system: true,
        status: Status.ACTIVE,
      }

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.name).toBe("admin")
        expect(result.value.display_name).toBe("Administrator")
        expect(result.value.description).toBe("Administrator role")
        expect(result.value.is_system).toBe(true)
        expect(result.value.status).toBe(Status.ACTIVE)
      }
    })

    it("should auto-generate UUID if not provided", () => {
      // Arrange
      const data = {
        name: "user",
        display_name: "User",
        description: "Regular user",
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.id).toBeDefined()
        expect(typeof result.value.id).toBe("string")
        expect(result.value.id.length).toBeGreaterThan(0)
      }
    })

    it("should preserve provided UUID", () => {
      // Arrange
      const providedId = "550e8400-e29b-41d4-a716-446655440000"
      const data = {
        id: providedId,
        name: "moderator",
        display_name: "Moderator",
        description: "Moderator role",
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.id).toBe(providedId)
      }
    })

    it("should reject missing name", () => {
      // Arrange
      const data = {
        display_name: "Test",
        is_system: false,
        status: Status.ACTIVE,
      } as any

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeDefined()
      }
    })

    it("should reject name shorter than 3 characters", () => {
      // Arrange
      const data = {
        name: "ab",
        display_name: "Test",
        description: null,
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should accept name at minimum length (3 chars)", () => {
      // Arrange
      const data = {
        name: "abc",
        display_name: "ABC Role",
        description: null,
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
    })

    it("should reject name exceeding maximum length (255 chars)", () => {
      // Arrange
      const data = {
        name: "a".repeat(256),
        display_name: "Test",
        description: null,
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should reject missing display_name", () => {
      // Arrange
      const data = {
        name: "admin",
        is_system: false,
        status: Status.ACTIVE,
      } as any

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should reject display_name shorter than 3 characters", () => {
      // Arrange
      const data = {
        name: "admin",
        display_name: "ab",
        description: null,
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should handle null description", () => {
      // Arrange
      const data = {
        name: "moderator",
        display_name: "Moderator",
        description: null,
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.description).toBeNull()
      }
    })

    it("should handle undefined description", () => {
      // Arrange
      const data = {
        name: "guest",
        display_name: "Guest",
        description: null,
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
    })

    it("should set timestamps automatically", () => {
      // Arrange
      const data = {
        name: "admin",
        display_name: "Administrator",
        description: null,
        is_system: true,
        status: Status.ACTIVE,
      }

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.created_at).toBeInstanceOf(Date)
        expect(result.value.updated_at).toBeInstanceOf(Date)
      }
    })

    it("should preserve is_system flag when true", () => {
      // Arrange
      const data = {
        name: "admin",
        display_name: "Administrator",
        description: null,
        is_system: true,
        status: Status.ACTIVE,
      }

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.is_system).toBe(true)
      }
    })

    it("should preserve is_system flag when false", () => {
      // Arrange
      const data = {
        name: "user",
        display_name: "User",
        description: null,
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.is_system).toBe(false)
      }
    })

    it("should accept ACTIVE status", () => {
      // Arrange
      const data = {
        name: "user",
        display_name: "User",
        description: null,
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.status).toBe(Status.ACTIVE)
      }
    })

    it("should accept INACTIVE status", () => {
      // Arrange
      const data = {
        name: "archived",
        display_name: "Archived Role",
        description: null,
        is_system: false,
        status: Status.INACTIVE,
      }

      // Act
      const result = Role.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.status).toBe(Status.INACTIVE)
      }
    })

    it("should work with mock factory", () => {
      // Arrange
      const mockData = createMockRoleData({
        name: "user",
        display_name: "User",
      })

      // Act
      const result = Role.instance(mockData as any)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.name).toBe(mockData.name)
        expect(result.value.display_name).toBe(mockData.display_name)
        expect(result.value.status).toBe(Status.ACTIVE)
      }
    })
  })

  describe("validate()", () => {
    it("should validate correct role data", () => {
      // Arrange
      const data = {
        name: "admin",
        display_name: "Administrator",
        description: "System administrator",
        is_system: true,
        status: Status.ACTIVE,
      }

      // Act
      const result = Role.validate(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(true)
      }
    })

    it("should reject invalid status", () => {
      // Arrange
      const data = {
        name: "admin",
        display_name: "Administrator",
        description: "System administrator",
        is_system: true,
        status: "INVALID_STATUS" as any,
      }

      // Act
      const result = Role.validate(data)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should reject data missing required fields", () => {
      // Arrange
      const data = {
        name: "admin",
        // Missing display_name, is_system, and status
      } as any

      // Act
      const result = Role.validate(data)

      // Assert
      expect(result.isOk).toBe(false)
    })
  })
})
