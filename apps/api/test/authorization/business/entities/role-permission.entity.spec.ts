import { Status } from '@database/prisma/generated-client'
import { RolePermission } from "@authorization/business/entities/role-permission.entity"
import { createMockRolePermissionData } from "../../../helpers/mock-factories"

describe("RolePermission Entity", () => {
  describe("instance()", () => {
    it("should create a valid role-permission with required fields", () => {
      // Arrange
      const roleId = "role-123"
      const permissionId = "perm-456"
      const data = {
        role_id: roleId,
        permission_id: permissionId,
        status: Status.ACTIVE,
      }

      // Act
      const result = RolePermission.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.role_id).toBe(roleId)
        expect(result.value.permission_id).toBe(permissionId)
        expect(result.value.status).toBe(Status.ACTIVE)
      }
    })

    it("should auto-generate UUID if not provided", () => {
      // Arrange
      const data = {
        role_id: "role-123",
        permission_id: "perm-456",
        status: Status.ACTIVE,
      }

      // Act
      const result = RolePermission.instance(data)

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
        role_id: "role-123",
        permission_id: "perm-456",
        status: Status.ACTIVE,
      }

      // Act
      const result = RolePermission.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.id).toBe(providedId)
      }
    })

    it("should reject missing role_id", () => {
      // Arrange
      const data = {
        permission_id: "perm-456",
        status: Status.ACTIVE,
      } as any

      // Act
      const result = RolePermission.instance(data)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeDefined()
      }
    })

    it("should reject missing permission_id", () => {
      // Arrange
      const data = {
        role_id: "role-123",
        status: Status.ACTIVE,
      } as any

      // Act
      const result = RolePermission.instance(data)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeDefined()
      }
    })

    it("should reject empty role_id", () => {
      // Arrange
      const data = {
        role_id: undefined,
        permission_id: "perm-456",
        status: Status.ACTIVE,
      }

      // Act
      const result = RolePermission.instance(data as any)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should reject empty permission_id", () => {
      // Arrange
      const data = {
        role_id: "role-123",
        permission_id: undefined,
        status: Status.ACTIVE,
      }

      // Act
      const result = RolePermission.instance(data as any)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should accept ACTIVE status", () => {
      // Arrange
      const data = {
        role_id: "role-123",
        permission_id: "perm-456",
        status: Status.ACTIVE,
      }

      // Act
      const result = RolePermission.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.status).toBe(Status.ACTIVE)
      }
    })

    it("should accept INACTIVE status", () => {
      // Arrange
      const data = {
        role_id: "role-123",
        permission_id: "perm-456",
        status: Status.INACTIVE,
      }

      // Act
      const result = RolePermission.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.status).toBe(Status.INACTIVE)
      }
    })

    it("should set timestamps automatically", () => {
      // Arrange
      const data = {
        role_id: "role-123",
        permission_id: "perm-456",
        status: Status.ACTIVE,
      }

      // Act
      const result = RolePermission.instance(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.created_at).toBeInstanceOf(Date)
      }
    })

    it("should handle multiple role-permission assignments", () => {
      // Arrange
      const roleId = "admin-role"
      const permissions = ["read-users", "write-users", "delete-users"]

      // Act
      const results = permissions.map((permId) =>
        RolePermission.instance({
          role_id: roleId,
          permission_id: permId,
          status: Status.ACTIVE,
        }),
      )

      // Assert
      results.forEach((result, index) => {
        expect(result.isOk).toBe(true)
        if (result.isOk) {
          expect(result.value.role_id).toBe(roleId)
          expect(result.value.permission_id).toBe(permissions[index])
        }
      })
    })

    it("should work with mock factory", () => {
      // Arrange
      const mockData = createMockRolePermissionData({
        role_id: "role-123",
        permission_id: "perm-456",
      })

      // Act
      const result = RolePermission.instance(mockData as any)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.role_id).toBe(mockData.role_id)
        expect(result.value.permission_id).toBe(mockData.permission_id)
        expect(result.value.status).toBe(Status.ACTIVE)
      }
    })
  })

  describe("validate()", () => {
    it("should validate correct role-permission data", () => {
      // Arrange
      const data = {
        role_id: "role-123",
        permission_id: "perm-456",
        status: Status.ACTIVE,
      }

      // Act
      const result = RolePermission.validate(data)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(true)
      }
    })

    it("should reject invalid status", () => {
      // Arrange
      const data = {
        role_id: "role-123",
        permission_id: "perm-456",
        status: "INVALID_STATUS" as any,
      }

      // Act
      const result = RolePermission.validate(data)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should reject data missing required fields", () => {
      // Arrange
      const data = {
        role_id: "role-123",
        // Missing permission_id and status
      } as any

      // Act
      const result = RolePermission.validate(data)

      // Assert
      expect(result.isOk).toBe(false)
    })
  })
})
