import { Test, TestingModule } from "@nestjs/testing"
import { Status } from "@database/prisma/generated-client"
import { AuthorizationService } from "@authorization/business/services/authorization.service"
import { IRoleRepository, IPermissionRepository } from "@authorization/business/repositories"
import { success, failure } from "@shared/business/utils/error-handling"
import {
  createMockUserRoleData,
  createMockRoleData,
  createMockPermissionData,
  createMockRolePermissionData,
} from "../../../helpers/mock-factories"
import { Role, UserRole, Permission, RolePermission } from "@authorization/business/entities"

describe("AuthorizationService", () => {
  let service: AuthorizationService
  let mockRoleRepo: jest.Mocked<IRoleRepository>
  let mockPermissionRepo: jest.Mocked<IPermissionRepository>

  beforeEach(async () => {
    // Create mock repositories
    mockRoleRepo = {
      getUserRoles: jest.fn(),
      findById: jest.fn(),
      getRolePermissions: jest.fn(),
      assignRoleToUser: jest.fn(),
      revokeRoleFromUser: jest.fn(),
      assignPermissionToRole: jest.fn(),
      revokePermissionFromRole: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    } as any

    mockPermissionRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    } as any

    // Create test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        { provide: IRoleRepository, useValue: mockRoleRepo },
        { provide: IPermissionRepository, useValue: mockPermissionRepo },
      ],
    }).compile()

    service = module.get<AuthorizationService>(AuthorizationService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("checkUserRole", () => {
    it("should return true when user has the required role", async () => {
      // Arrange
      const userId = "user-123"
      const roleName = "admin"
      const roleId = "role-456"

      const userRoleData = createMockUserRoleData({
        user_id: userId,
        role_id: roleId,
        status: Status.ACTIVE as Status,
      })
      const userRole = UserRole.instance(userRoleData as any).value!

      const roleData = createMockRoleData({
        id: roleId,
        name: roleName,
        display_name: "Administrator",
      })
      const role = Role.instance(roleData as any).value!

      mockRoleRepo.getUserRoles.mockResolvedValue(success([userRole]))
      mockRoleRepo.findById.mockResolvedValue(success(role))

      // Act
      const result = await service.checkUserRole(userId, roleName)

      // Assert
      expect(result).toBe(true)
      expect(mockRoleRepo.getUserRoles).toHaveBeenCalledWith(userId)
      expect(mockRoleRepo.findById).toHaveBeenCalledWith(roleId)
    })

    it("should return false when user does not have the role", async () => {
      // Arrange
      const userId = "user-123"
      const roleName = "admin"

      mockRoleRepo.getUserRoles.mockResolvedValue(success([]))

      // Act
      const result = await service.checkUserRole(userId, roleName)

      // Assert
      expect(result).toBe(false)
      expect(mockRoleRepo.getUserRoles).toHaveBeenCalledWith(userId)
    })

    it("should ignore inactive roles", async () => {
      // Arrange
      const userId = "user-123"
      const roleName = "admin"
      const roleId = "role-456"

      const userRoleData = createMockUserRoleData({
        user_id: userId,
        role_id: roleId,
        status: Status.INACTIVE as Status,
      })
      const userRole = UserRole.instance(userRoleData as any).value!

      mockRoleRepo.getUserRoles.mockResolvedValue(success([userRole]))

      // Act
      const result = await service.checkUserRole(userId, roleName)

      // Assert
      expect(result).toBe(false)
      expect(mockRoleRepo.findById).not.toHaveBeenCalled()
    })

    it("should return false when repository returns error", async () => {
      // Arrange
      const userId = "user-123"
      const roleName = "admin"

      mockRoleRepo.getUserRoles.mockResolvedValue(failure({ error: ["Database error"] }))

      // Act
      const result = await service.checkUserRole(userId, roleName)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe("checkUserPermission", () => {
    it("should return true when user has permission via role", async () => {
      // Arrange
      const userId = "user-123"
      const resource = "users"
      const action = "read"
      const roleId = "role-456"
      const permissionId = "perm-789"

      const userRoleData = createMockUserRoleData({
        user_id: userId,
        role_id: roleId,
        status: Status.ACTIVE as Status,
      })
      const userRole = UserRole.instance(userRoleData as any).value!

      const rolePermissionData = createMockRolePermissionData({
        role_id: roleId,
        permission_id: permissionId,
        status: Status.ACTIVE as Status,
      })
      const rolePermission = RolePermission.instance(rolePermissionData as any).value!

      const permissionData = createMockPermissionData({
        id: permissionId,
        resource,
        action,
        status: Status.ACTIVE as Status,
      })
      const permission = Permission.instance(permissionData as any).value!

      mockRoleRepo.getUserRoles.mockResolvedValue(success([userRole]))
      mockRoleRepo.getRolePermissions.mockResolvedValue(success([rolePermission]))
      mockPermissionRepo.findById.mockResolvedValue(success(permission))

      // Act
      const result = await service.checkUserPermission(userId, resource, action)

      // Assert
      expect(result).toBe(true)
      expect(mockRoleRepo.getUserRoles).toHaveBeenCalledWith(userId)
      expect(mockRoleRepo.getRolePermissions).toHaveBeenCalledWith(roleId)
      expect(mockPermissionRepo.findById).toHaveBeenCalledWith(permissionId)
    })

    it("should return false when user lacks permission", async () => {
      // Arrange
      const userId = "user-123"
      const resource = "users"
      const action = "delete"

      mockRoleRepo.getUserRoles.mockResolvedValue(success([]))

      // Act
      const result = await service.checkUserPermission(userId, resource, action)

      // Assert
      expect(result).toBe(false)
    })

    it("should check all user's roles for permissions", async () => {
      // Arrange
      const userId = "user-123"
      const resource = "posts"
      const action = "create"
      const roleId1 = "role-1"
      const roleId2 = "role-2"
      const permissionId = "perm-789"

      const userRole1Data = createMockUserRoleData({
        user_id: userId,
        role_id: roleId1,
        status: Status.ACTIVE as Status,
      })
      const userRole1 = UserRole.instance(userRole1Data as any).value!

      const userRole2Data = createMockUserRoleData({
        user_id: userId,
        role_id: roleId2,
        status: Status.ACTIVE as Status,
      })
      const userRole2 = UserRole.instance(userRole2Data as any).value!

      const rolePermissionData = createMockRolePermissionData({
        role_id: roleId2,
        permission_id: permissionId,
        status: Status.ACTIVE as Status,
      })
      const rolePermission = RolePermission.instance(rolePermissionData as any).value!

      const permissionData = createMockPermissionData({
        id: permissionId,
        resource,
        action,
        status: Status.ACTIVE as Status,
      })
      const permission = Permission.instance(permissionData as any).value!

      mockRoleRepo.getUserRoles.mockResolvedValue(success([userRole1, userRole2]))
      mockRoleRepo.getRolePermissions
        .mockResolvedValueOnce(success([]))
        .mockResolvedValueOnce(success([rolePermission]))
      mockPermissionRepo.findById.mockResolvedValue(success(permission))

      // Act
      const result = await service.checkUserPermission(userId, resource, action)

      // Assert
      expect(result).toBe(true)
      expect(mockRoleRepo.getRolePermissions).toHaveBeenCalledTimes(2)
    })

    it("should return false when repository returns error", async () => {
      // Arrange
      const userId = "user-123"
      const resource = "users"
      const action = "read"

      mockRoleRepo.getUserRoles.mockResolvedValue(failure({ error: ["Database error"] }))

      // Act
      const result = await service.checkUserPermission(userId, resource, action)

      // Assert
      expect(result).toBe(false)
    })
  })

  describe("getUserPermissions", () => {
    it("should return all unique permissions from all roles", async () => {
      // Arrange
      const userId = "user-123"
      const roleId = "role-456"
      const permissionId1 = "perm-1"
      const permissionId2 = "perm-2"

      const userRoleData = createMockUserRoleData({
        user_id: userId,
        role_id: roleId,
        status: Status.ACTIVE as Status,
      })
      const userRole = UserRole.instance(userRoleData as any).value!

      const rolePermission1Data = createMockRolePermissionData({
        role_id: roleId,
        permission_id: permissionId1,
        status: Status.ACTIVE as Status,
      })
      const rolePermission1 = RolePermission.instance(rolePermission1Data as any).value!

      const rolePermission2Data = createMockRolePermissionData({
        role_id: roleId,
        permission_id: permissionId2,
        status: Status.ACTIVE as Status,
      })
      const rolePermission2 = RolePermission.instance(rolePermission2Data as any).value!

      const permission1Data = createMockPermissionData({
        id: permissionId1,
        resource: "users",
        action: "read",
        status: Status.ACTIVE as Status,
      })
      const permission1 = Permission.instance(permission1Data as any).value!

      const permission2Data = createMockPermissionData({
        id: permissionId2,
        resource: "users",
        action: "write",
        status: Status.ACTIVE as Status,
      })
      const permission2 = Permission.instance(permission2Data as any).value!

      mockRoleRepo.getUserRoles.mockResolvedValue(success([userRole]))
      mockRoleRepo.getRolePermissions.mockResolvedValue(success([rolePermission1, rolePermission2]))
      mockPermissionRepo.findById
        .mockResolvedValueOnce(success(permission1))
        .mockResolvedValueOnce(success(permission2))

      // Act
      const result = await service.getUserPermissions(userId)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].resource).toBe("users")
      expect(result[0].action).toBe("read")
      expect(result[1].resource).toBe("users")
      expect(result[1].action).toBe("write")
    })

    it("should return empty array on repository error", async () => {
      // Arrange
      const userId = "user-123"

      mockRoleRepo.getUserRoles.mockResolvedValue(failure({ error: ["Database error"] }))

      // Act
      const result = await service.getUserPermissions(userId)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe("getUserRoles", () => {
    it("should return all active roles for user", async () => {
      // Arrange
      const userId = "user-123"
      const roleId1 = "role-1"
      const roleId2 = "role-2"

      const userRole1Data = createMockUserRoleData({
        user_id: userId,
        role_id: roleId1,
        status: Status.ACTIVE as Status,
      })
      const userRole1 = UserRole.instance(userRole1Data as any).value!

      const userRole2Data = createMockUserRoleData({
        user_id: userId,
        role_id: roleId2,
        status: Status.ACTIVE as Status,
      })
      const userRole2 = UserRole.instance(userRole2Data as any).value!

      const role1Data = createMockRoleData({
        id: roleId1,
        name: "admin",
        display_name: "Administrator",
        status: Status.ACTIVE as Status,
      })
      const role1 = Role.instance(role1Data as any).value!

      const role2Data = createMockRoleData({
        id: roleId2,
        name: "user",
        display_name: "User",
        status: Status.ACTIVE as Status,
      })
      const role2 = Role.instance(role2Data as any).value!

      mockRoleRepo.getUserRoles.mockResolvedValue(success([userRole1, userRole2]))
      mockRoleRepo.findById
        .mockResolvedValueOnce(success(role1))
        .mockResolvedValueOnce(success(role2))

      // Act
      const result = await service.getUserRoles(userId)

      // Assert
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe("admin")
      expect(result[1].name).toBe("user")
    })

    it("should return empty array on repository error", async () => {
      // Arrange
      const userId = "user-123"

      mockRoleRepo.getUserRoles.mockResolvedValue(failure({ error: ["Database error"] }))

      // Act
      const result = await service.getUserRoles(userId)

      // Assert
      expect(result).toEqual([])
    })
  })
})
