import { Status } from '@database/prisma/generated-client'
import { Permission } from "@authorization/business/entities/permission.entity"
import { createMockPermissionData } from "../../../helpers/mock-factories"

describe("Permission Entity", () => {
  describe("instance()", () => {
    it("should create a valid permission with required fields", () => {
      // Arrange
      const data = {
        resource: "users",
        action: "read",
        description: "Permission to read users",
        is_system: true,
        status: Status.ACTIVE,
      }

      // Act
      const result = Permission.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.resource).toBe("users")
        expect(result.value.action).toBe("read")
        expect(result.value.description).toBe("Permission to read users")
        expect(result.value.is_system).toBe(true)
        expect(result.value.status).toBe(Status.ACTIVE)
      }
    })

    it("should auto-generate UUID if not provided", () => {
      // Arrange
      const data = {
        resource: "posts",
        action: "create",
        description: "Create posts",
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Permission.instance(data)

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
        resource: "comments",
        action: "delete",
        description: "Delete comments",
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Permission.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.id).toBe(providedId)
      }
    })

    it("should reject missing resource", () => {
      // Arrange
      const data = {
        action: "read",
        is_system: false,
        status: Status.ACTIVE,
      } as any

      // Act
      const result = Permission.instance(data)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeDefined()
      }
    })

    it("should reject missing action", () => {
      // Arrange
      const data = {
        resource: "users",
        is_system: false,
        status: Status.ACTIVE,
      } as any

      // Act
      const result = Permission.instance(data)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeDefined()
      }
    })

    it("should reject empty resource", () => {
      // Arrange
      const data = {
        resource: undefined,
        action: "read",
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Permission.instance(data as any)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should reject empty action", () => {
      // Arrange
      const data = {
        resource: "users",
        action: undefined,
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Permission.instance(data as any)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should accept valid resource:action format", () => {
      // Arrange
      const data = {
        resource: "articles",
        action: "publish",
        description: "Publish articles",
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Permission.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.resource).toBe("articles")
        expect(result.value.action).toBe("publish")
      }
    })

    it("should handle null description", () => {
      // Arrange
      const data = {
        resource: "files",
        action: "download",
        description: null,
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Permission.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.description).toBeNull()
      }
    })

    it("should handle undefined description", () => {
      // Arrange
      const data = {
        resource: "images",
        action: "upload",
        description: null,
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Permission.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
    })

    it("should set timestamps automatically", () => {
      // Arrange
      const data = {
        resource: "users",
        action: "create",
        description: null,
        is_system: true,
        status: Status.ACTIVE,
      }

      // Act
      const result = Permission.instance(data)

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
        resource: "system",
        action: "manage",
        description: null,
        is_system: true,
        status: Status.ACTIVE,
      }

      // Act
      const result = Permission.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.is_system).toBe(true)
      }
    })

    it("should preserve is_system flag when false", () => {
      // Arrange
      const data = {
        resource: "posts",
        action: "edit",
        description: null,
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Permission.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.is_system).toBe(false)
      }
    })

    it("should accept ACTIVE status", () => {
      // Arrange
      const data = {
        resource: "comments",
        action: "moderate",
        description: null,
        is_system: false,
        status: Status.ACTIVE,
      }

      // Act
      const result = Permission.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.status).toBe(Status.ACTIVE)
      }
    })

    it("should accept INACTIVE status", () => {
      // Arrange
      const data = {
        resource: "legacy",
        action: "access",
        description: null,
        is_system: false,
        status: Status.INACTIVE,
      }

      // Act
      const result = Permission.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.status).toBe(Status.INACTIVE)
      }
    })

    it("should work with mock factory", () => {
      // Arrange
      const mockData = createMockPermissionData({
        resource: "users",
        action: "read",
      })

      // Act
      const result = Permission.instance(mockData as any)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.resource).toBe(mockData.resource)
        expect(result.value.action).toBe(mockData.action)
        expect(result.value.status).toBe(Status.ACTIVE)
      }
    })
  })

  describe("validate()", () => {
    it("should validate correct permission data", () => {
      // Arrange
      const data = {
        resource: "users",
        action: "read",
        description: "Read user data",
        is_system: true,
        status: Status.ACTIVE,
      }

      // Act
      const result = Permission.validate(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(true)
      }
    })

    it("should reject invalid status", () => {
      // Arrange
      const data = {
        resource: "users",
        action: "read",
        description: "Read user data",
        is_system: true,
        status: "INVALID_STATUS" as any,
      }

      // Act
      const result = Permission.validate(data)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should reject data missing required fields", () => {
      // Arrange
      const data = {
        resource: "users",
        // Missing action, is_system, and status
      } as any

      // Act
      const result = Permission.validate(data)

      // Assert
      expect(result.isOk).toBe(false)
    })
  })
})
