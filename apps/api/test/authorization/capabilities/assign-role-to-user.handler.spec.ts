import { Test, TestingModule } from "@nestjs/testing"
import { ConflictException, NotFoundException } from "@nestjs/common"
import { AssignRoleToUserHandler } from "@authorization/capabilities/assign-role-to-user/handler"
import { AssignRoleToUserCommand } from "@authorization/capabilities/assign-role-to-user/command"
import { IRoleRepository } from "@authorization/business/repositories"
import { IUserRepository } from "@account/business/repositories"
import { UserRole, Role } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import {
  createMockUser,
  createMockRoleData,
  createMockUserRoleData,
} from "../../helpers/mock-factories"
import { Status } from "@database/prisma/generated-client"

describe("AssignRoleToUserHandler", () => {
  let handler: AssignRoleToUserHandler
  let mockRoleRepository: jest.Mocked<IRoleRepository>
  let mockUserRepository: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    mockRoleRepository = {
      findById: jest.fn(),
      getUserRoles: jest.fn(),
      assignRoleToUser: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      getRolePermissions: jest.fn(),
      revokeRoleFromUser: jest.fn(),
      assignPermissionToRole: jest.fn(),
      revokePermissionFromRole: jest.fn(),
    } as any

    mockUserRepository = {
      findById: jest.fn(),
      findCurrent: jest.fn(),
      find: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignRoleToUserHandler,
        { provide: IRoleRepository, useValue: mockRoleRepository },
        { provide: IUserRepository, useValue: mockUserRepository },
      ],
    }).compile()

    handler = module.get<AssignRoleToUserHandler>(AssignRoleToUserHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should successfully assign role to user", async () => {
    // Arrange
    const userId = "user-123"
    const roleId = "role-456"
    const assignedBy = "admin-789"

    const dto = {
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy,
    }
    const command = new AssignRoleToUserCommand(dto)

    const user = createMockUser({ id: userId })

    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    const userRoleData = createMockUserRoleData({
      user_id: userId,
      role_id: roleId,
      assigned_by: assignedBy,
    })
    const userRole = UserRole.instance(userRoleData as any).value!

    mockUserRepository.findById.mockResolvedValue(success(user))
    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockRoleRepository.getUserRoles.mockResolvedValue(success([]))
    mockRoleRepository.assignRoleToUser.mockResolvedValue(success(userRole))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.user_id).toBe(userId)
      expect(result.value.role_id).toBe(roleId)
      expect(result.value.assigned_by).toBe(assignedBy)
    }
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
    expect(mockRoleRepository.findById).toHaveBeenCalledWith(roleId)
    expect(mockRoleRepository.assignRoleToUser).toHaveBeenCalled()
  })

  it("should return NotFoundException when user not found", async () => {
    // Arrange
    const dto = {
      user_id: "non-existent-user",
      role_id: "role-456",
      assigned_by: null,
    }
    const command = new AssignRoleToUserCommand(dto)

    mockUserRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toBe("User not found")
    }
    expect(mockRoleRepository.findById).not.toHaveBeenCalled()
  })

  it("should return NotFoundException when role not found", async () => {
    // Arrange
    const userId = "user-123"
    const dto = {
      user_id: userId,
      role_id: "non-existent-role",
      assigned_by: null,
    }
    const command = new AssignRoleToUserCommand(dto)

    const user = createMockUser({ id: userId })

    mockUserRepository.findById.mockResolvedValue(success(user))
    mockRoleRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toBe("Role not found")
    }
    expect(mockRoleRepository.assignRoleToUser).not.toHaveBeenCalled()
  })

  it("should return ConflictException when user already has the role", async () => {
    // Arrange — the duplicate check now lives in the repository layer
    const userId = "user-123"
    const roleId = "role-456"

    const dto = {
      user_id: userId,
      role_id: roleId,
      assigned_by: null,
    }
    const command = new AssignRoleToUserCommand(dto)

    const user = createMockUser({ id: userId })

    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    mockUserRepository.findById.mockResolvedValue(success(user))
    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockRoleRepository.assignRoleToUser.mockResolvedValue(
      failure({ assignment: ["User already has this role assigned"] }),
    )

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(ConflictException)
      expect(result.error.message).toBe("User already has this role assigned")
    }
    expect(mockRoleRepository.assignRoleToUser).toHaveBeenCalled()
  })

  it("should reject past expiration date", async () => {
    // Arrange
    const userId = "user-123"
    const roleId = "role-456"
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1) // Yesterday

    const dto = {
      user_id: userId,
      role_id: roleId,
      assigned_by: null,
      expires_at: pastDate.toISOString(),
    }
    const command = new AssignRoleToUserCommand(dto)

    const user = createMockUser({ id: userId })

    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    mockUserRepository.findById.mockResolvedValue(success(user))
    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockRoleRepository.getUserRoles.mockResolvedValue(success([]))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(ConflictException)
      expect(result.error.message).toBe("Expiration date must be in the future")
    }
  })

  it("should accept future expiration date", async () => {
    // Arrange
    const userId = "user-123"
    const roleId = "role-456"
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30) // 30 days from now

    const dto = {
      user_id: userId,
      role_id: roleId,
      assigned_by: null,
      expires_at: futureDate.toISOString(),
    }
    const command = new AssignRoleToUserCommand(dto)

    const user = createMockUser({ id: userId })

    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    const userRoleData = createMockUserRoleData({
      user_id: userId,
      role_id: roleId,
      expires_at: futureDate,
    })
    const userRole = UserRole.instance(userRoleData as any).value!

    mockUserRepository.findById.mockResolvedValue(success(user))
    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockRoleRepository.getUserRoles.mockResolvedValue(success([]))
    mockRoleRepository.assignRoleToUser.mockResolvedValue(success(userRole))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.expires_at).toBeInstanceOf(Date)
    }
  })

  it("should handle repository errors during assignment", async () => {
    // Arrange
    const userId = "user-123"
    const roleId = "role-456"

    const dto = {
      user_id: userId,
      role_id: roleId,
      assigned_by: null,
    }
    const command = new AssignRoleToUserCommand(dto)

    const user = createMockUser({ id: userId })

    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    mockUserRepository.findById.mockResolvedValue(success(user))
    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockRoleRepository.getUserRoles.mockResolvedValue(success([]))
    mockRoleRepository.assignRoleToUser.mockResolvedValue(
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
