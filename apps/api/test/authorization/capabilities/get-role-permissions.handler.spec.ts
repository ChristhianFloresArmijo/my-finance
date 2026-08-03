import { Test, TestingModule } from "@nestjs/testing"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { GetRolePermissionsHandler } from "@authorization/capabilities/get-role-permissions/handler"
import { GetRolePermissionsQuery } from "@authorization/capabilities/get-role-permissions/query"
import { IRoleRepository } from "@authorization/business/repositories"
import { RolePermission, Role } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockRoleData, createMockRolePermissionData } from "../../helpers/mock-factories"

describe("GetRolePermissionsHandler", () => {
  let handler: GetRolePermissionsHandler
  let mockRepository: jest.Mocked<IRoleRepository>

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      getRolePermissions: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      getUserRoles: jest.fn(),
      assignRoleToUser: jest.fn(),
      revokeRoleFromUser: jest.fn(),
      assignPermissionToRole: jest.fn(),
      revokePermissionFromRole: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetRolePermissionsHandler,
        { provide: IRoleRepository, useValue: mockRepository },
      ],
    }).compile()

    handler = module.get<GetRolePermissionsHandler>(GetRolePermissionsHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return role permissions when role exists", async () => {
    // Arrange
    const roleId = "role-123"
    const query = new GetRolePermissionsQuery(roleId)

    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    const rolePermission1Data = createMockRolePermissionData({
      role_id: roleId,
      permission_id: "perm-1",
    })
    const rolePermission2Data = createMockRolePermissionData({
      role_id: roleId,
      permission_id: "perm-2",
    })
    const rolePermission1 = RolePermission.instance(rolePermission1Data as any).value!
    const rolePermission2 = RolePermission.instance(rolePermission2Data as any).value!

    mockRepository.findById.mockResolvedValue(success(role))
    mockRepository.getRolePermissions.mockResolvedValue(success([rolePermission1, rolePermission2]))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value).toHaveLength(2)
      expect(result.value[0].role_id).toBe(roleId)
      expect(result.value[1].role_id).toBe(roleId)
    }
    expect(mockRepository.findById).toHaveBeenCalledWith(roleId)
    expect(mockRepository.getRolePermissions).toHaveBeenCalledWith(roleId)
  })

  it("should return empty array when role has no permissions", async () => {
    // Arrange
    const roleId = "role-123"
    const query = new GetRolePermissionsQuery(roleId)

    const roleData = createMockRoleData({ id: roleId, name: "viewer", display_name: "Viewer" })
    const role = Role.instance(roleData as any).value!

    mockRepository.findById.mockResolvedValue(success(role))
    mockRepository.getRolePermissions.mockResolvedValue(success([]))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value).toHaveLength(0)
    }
  })

  it("should return NotFoundException when role not found", async () => {
    // Arrange
    const roleId = "non-existent-role"
    const query = new GetRolePermissionsQuery(roleId)

    mockRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toBe("Role not found")
    }
    expect(mockRepository.getRolePermissions).not.toHaveBeenCalled()
  })

  it("should handle role repository findById errors", async () => {
    // Arrange
    const roleId = "role-123"
    const query = new GetRolePermissionsQuery(roleId)

    mockRepository.findById.mockResolvedValue(failure({ error: ["Database error"] }))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(InternalServerErrorException)
    }
    expect(mockRepository.getRolePermissions).not.toHaveBeenCalled()
  })

  it("should handle getRolePermissions errors", async () => {
    // Arrange
    const roleId = "role-123"
    const query = new GetRolePermissionsQuery(roleId)

    const roleData = createMockRoleData({ id: roleId, name: "admin", display_name: "Admin" })
    const role = Role.instance(roleData as any).value!

    mockRepository.findById.mockResolvedValue(success(role))
    mockRepository.getRolePermissions.mockResolvedValue(failure({ error: ["Database error"] }))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(InternalServerErrorException)
    }
  })
})
