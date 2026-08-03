import { Test, TestingModule } from "@nestjs/testing"
import { ConflictException, NotFoundException } from "@nestjs/common"
import { AssignPermissionToRoleHandler } from "@authorization/capabilities/assign-permission-to-role/handler"
import { AssignPermissionToRoleCommand } from "@authorization/capabilities/assign-permission-to-role/command"
import { IRoleRepository, IPermissionRepository } from "@authorization/business/repositories"
import { RolePermission, Role, Permission } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import {
  createMockRoleData,
  createMockPermissionData,
  createMockRolePermissionData,
} from "../../helpers/mock-factories"
import { Status } from '@database/prisma/generated-client'

describe("AssignPermissionToRoleHandler", () => {
  let handler: AssignPermissionToRoleHandler
  let mockRoleRepository: jest.Mocked<IRoleRepository>
  let mockPermissionRepository: jest.Mocked<IPermissionRepository>

  beforeEach(async () => {
    mockRoleRepository = {
      findById: jest.fn(),
      getRolePermissions: jest.fn(),
      assignPermissionToRole: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      getUserRoles: jest.fn(),
      revokeRoleFromUser: jest.fn(),
      assignRoleToUser: jest.fn(),
      revokePermissionFromRole: jest.fn(),
    } as any

    mockPermissionRepository = {
      findById: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignPermissionToRoleHandler,
        { provide: IRoleRepository, useValue: mockRoleRepository },
        { provide: IPermissionRepository, useValue: mockPermissionRepository },
      ],
    }).compile()

    handler = module.get<AssignPermissionToRoleHandler>(AssignPermissionToRoleHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should successfully assign permission to role", async () => {
    // Arrange
    const roleId = "role-123"
    const permissionId = "perm-456"

    const dto = {
      role_id: roleId,
      permission_id: permissionId,
    }
    const command = new AssignPermissionToRoleCommand(dto)

    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    const permissionData = createMockPermissionData({
      id: permissionId,
      resource: "posts",
      action: "create",
    })
    const permission = Permission.instance(permissionData as any).value!

    const rolePermissionData = createMockRolePermissionData({
      role_id: roleId,
      permission_id: permissionId,
    })
    const rolePermission = RolePermission.instance(rolePermissionData as any).value!

    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockPermissionRepository.findById.mockResolvedValue(success(permission))
    mockRoleRepository.getRolePermissions.mockResolvedValue(success([]))
    mockRoleRepository.assignPermissionToRole.mockResolvedValue(success(rolePermission))

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
    expect(mockRoleRepository.assignPermissionToRole).toHaveBeenCalled()
  })

  it("should return NotFoundException when role not found", async () => {
    // Arrange
    const dto = {
      role_id: "non-existent-role",
      permission_id: "perm-456",
    }
    const command = new AssignPermissionToRoleCommand(dto)

    mockRoleRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toBe("Role not found")
    }
    expect(mockPermissionRepository.findById).not.toHaveBeenCalled()
  })

  it("should return NotFoundException when permission not found", async () => {
    // Arrange
    const roleId = "role-123"
    const dto = {
      role_id: roleId,
      permission_id: "non-existent-perm",
    }
    const command = new AssignPermissionToRoleCommand(dto)

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
    expect(mockRoleRepository.assignPermissionToRole).not.toHaveBeenCalled()
  })

  it("should return ConflictException when permission already assigned", async () => {
    // Arrange
    const roleId = "role-123"
    const permissionId = "perm-456"

    const dto = {
      role_id: roleId,
      permission_id: permissionId,
    }
    const command = new AssignPermissionToRoleCommand(dto)

    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    const permissionData = createMockPermissionData({
      id: permissionId,
      resource: "posts",
      action: "create",
    })
    const permission = Permission.instance(permissionData as any).value!

    const existingRolePermissionData = createMockRolePermissionData({
      role_id: roleId,
      permission_id: permissionId,
      status: Status.ACTIVE as Status,
    })
    const existingRolePermission = RolePermission.instance(existingRolePermissionData as any).value!

    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockPermissionRepository.findById.mockResolvedValue(success(permission))
    mockRoleRepository.getRolePermissions.mockResolvedValue(success([existingRolePermission]))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(ConflictException)
      expect(result.error.message).toBe("This permission is already assigned to the role")
    }
    expect(mockRoleRepository.assignPermissionToRole).not.toHaveBeenCalled()
  })

  it("should allow re-assignment if previous assignment is INACTIVE", async () => {
    // Arrange
    const roleId = "role-123"
    const permissionId = "perm-456"

    const dto = {
      role_id: roleId,
      permission_id: permissionId,
    }
    const command = new AssignPermissionToRoleCommand(dto)

    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    const permissionData = createMockPermissionData({
      id: permissionId,
      resource: "posts",
      action: "create",
    })
    const permission = Permission.instance(permissionData as any).value!

    const inactiveRolePermissionData = createMockRolePermissionData({
      role_id: roleId,
      permission_id: permissionId,
      status: Status.INACTIVE as Status,
    })
    const inactiveRolePermission = RolePermission.instance(inactiveRolePermissionData as any).value!

    const newRolePermissionData = createMockRolePermissionData({
      role_id: roleId,
      permission_id: permissionId,
      status: Status.ACTIVE as Status,
    })
    const newRolePermission = RolePermission.instance(newRolePermissionData as any).value!

    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockPermissionRepository.findById.mockResolvedValue(success(permission))
    mockRoleRepository.getRolePermissions.mockResolvedValue(success([inactiveRolePermission]))
    mockRoleRepository.assignPermissionToRole.mockResolvedValue(success(newRolePermission))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(true)
    expect(mockRoleRepository.assignPermissionToRole).toHaveBeenCalled()
  })

  it("should handle repository errors during assignment", async () => {
    // Arrange
    const roleId = "role-123"
    const permissionId = "perm-456"

    const dto = {
      role_id: roleId,
      permission_id: permissionId,
    }
    const command = new AssignPermissionToRoleCommand(dto)

    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    const permissionData = createMockPermissionData({
      id: permissionId,
      resource: "posts",
      action: "create",
    })
    const permission = Permission.instance(permissionData as any).value!

    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockPermissionRepository.findById.mockResolvedValue(success(permission))
    mockRoleRepository.getRolePermissions.mockResolvedValue(success([]))
    mockRoleRepository.assignPermissionToRole.mockResolvedValue(
      failure({ assignment: ["Database error"] }),
    )

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(ConflictException)
    }
  })
})
