import { Test, TestingModule } from "@nestjs/testing"
import { NotFoundException } from "@nestjs/common"
import { RevokeRoleFromUserHandler } from "@authorization/capabilities/revoke-role-from-user/handler"
import { RevokeRoleFromUserCommand } from "@authorization/capabilities/revoke-role-from-user/command"
import { IRoleRepository } from "@authorization/business/repositories"
import { IUserRepository } from "@account/business/repositories"
import { UserRole, Role } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import {
  createMockUser,
  createMockRoleData,
  createMockUserRoleData,
} from "../../helpers/mock-factories"
import { Status } from '@database/prisma/generated-client'

describe("RevokeRoleFromUserHandler", () => {
  let handler: RevokeRoleFromUserHandler
  let mockRoleRepository: jest.Mocked<IRoleRepository>
  let mockUserRepository: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    mockRoleRepository = {
      findById: jest.fn(),
      getUserRoles: jest.fn(),
      revokeRoleFromUser: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      getRolePermissions: jest.fn(),
      assignRoleToUser: jest.fn(),
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
        RevokeRoleFromUserHandler,
        { provide: IRoleRepository, useValue: mockRoleRepository },
        { provide: IUserRepository, useValue: mockUserRepository },
      ],
    }).compile()

    handler = module.get<RevokeRoleFromUserHandler>(RevokeRoleFromUserHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should successfully revoke role from user", async () => {
    // Arrange
    const userId = "user-123"
    const roleId = "role-456"
    const command = new RevokeRoleFromUserCommand(userId, roleId)

    const user = createMockUser({ id: userId })
    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    const userRoleData = createMockUserRoleData({
      user_id: userId,
      role_id: roleId,
      status: Status.ACTIVE as Status,
    })
    const userRole = UserRole.instance(userRoleData as any).value!

    const revokedUserRoleData = createMockUserRoleData({
      ...userRoleData,
      status: Status.INACTIVE as Status,
    })
    const revokedUserRole = UserRole.instance(revokedUserRoleData as any).value!

    mockUserRepository.findById.mockResolvedValue(success(user))
    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockRoleRepository.getUserRoles.mockResolvedValue(success([userRole]))
    mockRoleRepository.revokeRoleFromUser.mockResolvedValue(success(revokedUserRole))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.user_id).toBe(userId)
      expect(result.value.role_id).toBe(roleId)
    }
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
    expect(mockRoleRepository.findById).toHaveBeenCalledWith(roleId)
    expect(mockRoleRepository.getUserRoles).toHaveBeenCalledWith(userId)
    expect(mockRoleRepository.revokeRoleFromUser).toHaveBeenCalledWith(userRole)
  })

  it("should return NotFoundException when user not found", async () => {
    // Arrange
    const userId = "non-existent-user"
    const roleId = "role-456"
    const command = new RevokeRoleFromUserCommand(userId, roleId)

    mockUserRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toBe("User not found")
    }
    expect(mockRoleRepository.revokeRoleFromUser).not.toHaveBeenCalled()
  })

  it("should return NotFoundException when role not found", async () => {
    // Arrange
    const userId = "user-123"
    const roleId = "non-existent-role"
    const command = new RevokeRoleFromUserCommand(userId, roleId)

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
    expect(mockRoleRepository.revokeRoleFromUser).not.toHaveBeenCalled()
  })

  it("should return NotFoundException when user does not have the role", async () => {
    // Arrange
    const userId = "user-123"
    const roleId = "role-456"
    const command = new RevokeRoleFromUserCommand(userId, roleId)

    const user = createMockUser({ id: userId })
    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    // User has a different role, not the one being revoked
    const differentRoleData = createMockUserRoleData({
      user_id: userId,
      role_id: "different-role-id",
      status: Status.ACTIVE as Status,
    })
    const differentRole = UserRole.instance(differentRoleData as any).value!

    mockUserRepository.findById.mockResolvedValue(success(user))
    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockRoleRepository.getUserRoles.mockResolvedValue(success([differentRole]))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toContain("does not have this role")
    }
    expect(mockRoleRepository.revokeRoleFromUser).not.toHaveBeenCalled()
  })

  it("should handle repository errors during revocation", async () => {
    // Arrange
    const userId = "user-123"
    const roleId = "role-456"
    const command = new RevokeRoleFromUserCommand(userId, roleId)

    const user = createMockUser({ id: userId })
    const roleData = createMockRoleData({ id: roleId, name: "editor", display_name: "Editor" })
    const role = Role.instance(roleData as any).value!

    const userRoleData = createMockUserRoleData({
      user_id: userId,
      role_id: roleId,
      status: Status.ACTIVE as Status,
    })
    const userRole = UserRole.instance(userRoleData as any).value!

    mockUserRepository.findById.mockResolvedValue(success(user))
    mockRoleRepository.findById.mockResolvedValue(success(role))
    mockRoleRepository.getUserRoles.mockResolvedValue(success([userRole]))
    mockRoleRepository.revokeRoleFromUser.mockResolvedValue(
      failure({ assignment: ["Failed to revoke"] }),
    )

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
    }
  })
})
