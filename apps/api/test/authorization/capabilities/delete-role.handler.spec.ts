import { Test, TestingModule } from "@nestjs/testing"
import { InternalServerErrorException, NotFoundException, ForbiddenException } from "@nestjs/common"
import { DeleteRoleHandler } from "@authorization/capabilities/delete-role/handler"
import { DeleteRoleCommand } from "@authorization/capabilities/delete-role/command"
import { IRoleRepository } from "@authorization/business/repositories"
import { Role, UserRole } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockRoleData, createMockUserRoleData } from "../../helpers/mock-factories"

describe("DeleteRoleHandler", () => {
  let handler: DeleteRoleHandler
  let mockRepository: jest.Mocked<IRoleRepository>

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      getUserRoles: jest.fn(),
      getRoleUsers: jest.fn(),
      getRolePermissions: jest.fn(),
      assignRoleToUser: jest.fn(),
      revokeRoleFromUser: jest.fn(),
      assignPermissionToRole: jest.fn(),
      revokePermissionFromRole: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteRoleHandler, { provide: IRoleRepository, useValue: mockRepository }],
    }).compile()

    handler = module.get<DeleteRoleHandler>(DeleteRoleHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should successfully delete non-system role", async () => {
    // Arrange
    const roleId = "role-123"
    const command = new DeleteRoleCommand(roleId)

    const roleData = createMockRoleData({
      id: roleId,
      name: "custom-role",
      display_name: "Custom Role",
      is_system: false,
    })
    const role = Role.instance(roleData as any).value!

    mockRepository.findById.mockResolvedValue(success(role))
    mockRepository.getRoleUsers.mockResolvedValue(success([]))
    mockRepository.delete.mockResolvedValue(success(true))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value).toBe(true)
    }
    expect(mockRepository.findById).toHaveBeenCalledWith(roleId)
    expect(mockRepository.getRoleUsers).toHaveBeenCalledWith(roleId)
    expect(mockRepository.delete).toHaveBeenCalledWith(roleId)
  })

  it("should return NotFoundException when role not found", async () => {
    // Arrange
    const roleId = "non-existent-id"
    const command = new DeleteRoleCommand(roleId)

    mockRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toBe("Role not found")
    }
    expect(mockRepository.delete).not.toHaveBeenCalled()
  })

  it("should prevent deletion of system roles", async () => {
    // Arrange
    const roleId = "role-123"
    const command = new DeleteRoleCommand(roleId)

    const systemRoleData = createMockRoleData({
      id: roleId,
      name: "admin",
      display_name: "Admin",
      is_system: true,
    })
    const systemRole = Role.instance(systemRoleData as any).value!

    mockRepository.findById.mockResolvedValue(success(systemRole))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(ForbiddenException)
      expect(result.error.message).toContain("system roles")
    }
    expect(mockRepository.delete).not.toHaveBeenCalled()
  })

  it("should handle repository findById errors", async () => {
    // Arrange
    const roleId = "role-123"
    const command = new DeleteRoleCommand(roleId)

    mockRepository.findById.mockResolvedValue(failure({ error: ["Database error"] }))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(InternalServerErrorException)
    }
    expect(mockRepository.delete).not.toHaveBeenCalled()
  })

  it("should handle repository delete errors", async () => {
    // Arrange
    const roleId = "role-123"
    const command = new DeleteRoleCommand(roleId)

    const roleData = createMockRoleData({
      id: roleId,
      name: "editor",
      display_name: "Editor",
      is_system: false,
    })
    const role = Role.instance(roleData as any).value!

    mockRepository.findById.mockResolvedValue(success(role))
    mockRepository.getRoleUsers.mockResolvedValue(success([]))
    mockRepository.delete.mockResolvedValue(failure({ error: ["Database error"] }))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(InternalServerErrorException)
    }
  })

  it("should prevent deletion of role assigned to active users", async () => {
    // Arrange
    const roleId = "role-123"
    const command = new DeleteRoleCommand(roleId)

    const roleData = createMockRoleData({
      id: roleId,
      name: "editor",
      display_name: "Editor",
      is_system: false,
    })
    const role = Role.instance(roleData as any).value!

    const userRoleData = createMockUserRoleData({ role_id: roleId, user_id: "user-001" })
    const userRole = UserRole.instance(userRoleData as any).value!

    mockRepository.findById.mockResolvedValue(success(role))
    mockRepository.getRoleUsers.mockResolvedValue(success([userRole]))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(ForbiddenException)
      expect(result.error.message).toContain("active users")
    }
    expect(mockRepository.delete).not.toHaveBeenCalled()
  })
})
