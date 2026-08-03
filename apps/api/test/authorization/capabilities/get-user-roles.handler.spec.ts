import { Test, TestingModule } from "@nestjs/testing"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { GetUserRolesHandler } from "@authorization/capabilities/get-user-roles/handler"
import { GetUserRolesQuery } from "@authorization/capabilities/get-user-roles/query"
import { IRoleRepository } from "@authorization/business/repositories"
import { IUserRepository } from "@account/business/repositories"
import { UserRole } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockUser, createMockUserRoleData } from "../../helpers/mock-factories"

describe("GetUserRolesHandler", () => {
  let handler: GetUserRolesHandler
  let mockRoleRepository: jest.Mocked<IRoleRepository>
  let mockUserRepository: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    mockRoleRepository = {
      getUserRoles: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      getRolePermissions: jest.fn(),
      assignRoleToUser: jest.fn(),
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
        GetUserRolesHandler,
        { provide: IRoleRepository, useValue: mockRoleRepository },
        { provide: IUserRepository, useValue: mockUserRepository },
      ],
    }).compile()

    handler = module.get<GetUserRolesHandler>(GetUserRolesHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return user roles when user exists", async () => {
    // Arrange
    const userId = "user-123"
    const query = new GetUserRolesQuery(userId)

    const user = createMockUser({ id: userId })
    const userRole1Data = createMockUserRoleData({ user_id: userId, role_id: "role-1" })
    const userRole2Data = createMockUserRoleData({ user_id: userId, role_id: "role-2" })
    const userRole1 = UserRole.instance(userRole1Data as any).value!
    const userRole2 = UserRole.instance(userRole2Data as any).value!

    mockUserRepository.findById.mockResolvedValue(success(user))
    mockRoleRepository.getUserRoles.mockResolvedValue(success([userRole1, userRole2]))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value).toHaveLength(2)
      expect(result.value[0].user_id).toBe(userId)
    }
    expect(mockUserRepository.findById).toHaveBeenCalledWith(userId)
    expect(mockRoleRepository.getUserRoles).toHaveBeenCalledWith(userId)
  })

  it("should return empty array when user has no roles", async () => {
    // Arrange
    const userId = "user-123"
    const query = new GetUserRolesQuery(userId)

    const user = createMockUser({ id: userId })
    mockUserRepository.findById.mockResolvedValue(success(user))
    mockRoleRepository.getUserRoles.mockResolvedValue(success([]))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value).toHaveLength(0)
    }
  })

  it("should return NotFoundException when user not found", async () => {
    // Arrange
    const userId = "non-existent-user"
    const query = new GetUserRolesQuery(userId)

    mockUserRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toBe("User not found")
    }
    expect(mockRoleRepository.getUserRoles).not.toHaveBeenCalled()
  })

  it("should handle user repository errors", async () => {
    // Arrange
    const userId = "user-123"
    const query = new GetUserRolesQuery(userId)

    mockUserRepository.findById.mockResolvedValue(failure({ error: ["Database error"] }))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(InternalServerErrorException)
    }
  })

  it("should handle role repository errors", async () => {
    // Arrange
    const userId = "user-123"
    const query = new GetUserRolesQuery(userId)

    const user = createMockUser({ id: userId })
    mockUserRepository.findById.mockResolvedValue(success(user))
    mockRoleRepository.getUserRoles.mockResolvedValue(failure({ error: ["Database error"] }))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(InternalServerErrorException)
    }
  })
})
