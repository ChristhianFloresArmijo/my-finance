import { Test, TestingModule } from "@nestjs/testing"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { RevokePermissionFromRoleHandler } from "@authorization/capabilities/revoke-permission-from-role/handler"
import { RevokePermissionFromRoleCommand } from "@authorization/capabilities/revoke-permission-from-role/command"
import { IRoleRepository, IPermissionRepository } from "@authorization/business/repositories"
import { RolePermission, Role, Permission } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import {
  createMockRoleData,
  createMockPermissionData,
  createMockRolePermissionData,
} from "../../helpers/mock-factories"
import { Status } from '@database/prisma/generated-client'

describe("RevokePermissionFromRoleHandler", () => {
  let handler: RevokePermissionFromRoleHandler
  let mockRoleRepository: jest.Mocked<IRoleRepository>
  let mockPermissionRepository: jest.Mocked<IPermissionRepository>

  beforeEach(async () => {
    mockRoleRepository = {
      findById: jest.fn(),
      revokePermissionFromRole: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      getUserRoles: jest.fn(),
      getRolePermissions: jest.fn(),
      assignRoleToUser: jest.fn(),
      revokeRoleFromUser: jest.fn(),
      assignPermissionToRole: jest.fn(),
    } as any

    mockPermissionRepository = {
      findById: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RevokePermissionFromRoleHandler,
        { provide: IRoleRepository, useValue: mockRoleRepository },
        { provide: IPermissionRepository, useValue: mockPermissionRepository },
      ],
    }).compile()

    handler = module.get<RevokePermissionFromRoleHandler>(RevokePermissionFromRoleHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should successfully revoke permission from role", async () => {
    // Arrange
    const roleId = "role-123"
    const permissionId = "perm-456"
    const command = new RevokePermissionFromRoleCommand(roleId, permissionId)

    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    const permissionData = createMockPermissionData({
      id: permissionId,
      resource: "posts",
      action: "delete",
    })
    const permission = Permission.instance(permissionData as any).value!

    const revokedRolePermissionData = createMockRolePermissionData({
      role_id: roleId,
      permission_id: permissionId,
      status: Status.INACTIVE as Status,
    })
    const revokedRolePermission = RolePermission.instance(revokedRolePermissionData as any).value!

    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockPermissionRepository.findById.mockResolvedValue(success(permission))
    mockRoleRepository.revokePermissionFromRole.mockResolvedValue(success(revokedRolePermission))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.role_id).toBe(roleId)
      expect(result.value.permission_id).toBe(permissionId)
    }
    expect(mockRoleRepository.findById).toHaveBeenCalledWith(roleId)
    expect(mockPermissionRepository.findById).toHaveBeenCalledWith(permissionId)
    expect(mockRoleRepository.revokePermissionFromRole).toHaveBeenCalledWith(roleId, permissionId)
  })

  it("should return NotFoundException when role not found", async () => {
    // Arrange
    const roleId = "non-existent-role"
    const permissionId = "perm-456"
    const command = new RevokePermissionFromRoleCommand(roleId, permissionId)

    mockRoleRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toBe("Role not found")
    }
    expect(mockRoleRepository.revokePermissionFromRole).not.toHaveBeenCalled()
  })

  it("should return NotFoundException when permission not found", async () => {
    // Arrange
    const roleId = "role-123"
    const permissionId = "non-existent-perm"
    const command = new RevokePermissionFromRoleCommand(roleId, permissionId)

    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockPermissionRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toBe("Permission not found")
    }
    expect(mockRoleRepository.revokePermissionFromRole).not.toHaveBeenCalled()
  })

  it("should handle permission assignment not found", async () => {
    // Arrange
    const roleId = "role-123"
    const permissionId = "perm-456"
    const command = new RevokePermissionFromRoleCommand(roleId, permissionId)

    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    const permissionData = createMockPermissionData({
      id: permissionId,
      resource: "posts",
      action: "delete",
    })
    const permission = Permission.instance(permissionData as any).value!

    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockPermissionRepository.findById.mockResolvedValue(success(permission))
    mockRoleRepository.revokePermissionFromRole.mockResolvedValue(
      failure({ assignment: ["Assignment not found"] }),
    )

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toContain("Assignment not found")
    }
  })

  it("should handle repository errors during revocation", async () => {
    // Arrange
    const roleId = "role-123"
    const permissionId = "perm-456"
    const command = new RevokePermissionFromRoleCommand(roleId, permissionId)

    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockPermissionRepository.findById.mockResolvedValue(failure({ error: ["Database error"] }))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(InternalServerErrorException)
    }
    expect(mockRoleRepository.revokePermissionFromRole).not.toHaveBeenCalled()
  })
})
