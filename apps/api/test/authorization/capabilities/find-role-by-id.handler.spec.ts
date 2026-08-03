import { Test, TestingModule } from "@nestjs/testing"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { FindRoleByIdHandler } from "@authorization/capabilities/find-role-by-id/handler"
import { FindRoleByIdQuery } from "@authorization/capabilities/find-role-by-id/query"
import { IRoleRepository } from "@authorization/business/repositories"
import { Role } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockRoleData } from "../../helpers/mock-factories"

describe("FindRoleByIdHandler", () => {
  let handler: FindRoleByIdHandler
  let mockRepository: jest.Mocked<IRoleRepository>

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      getUserRoles: jest.fn(),
      getRolePermissions: jest.fn(),
      assignRoleToUser: jest.fn(),
      revokeRoleFromUser: jest.fn(),
      assignPermissionToRole: jest.fn(),
      revokePermissionFromRole: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [FindRoleByIdHandler, { provide: IRoleRepository, useValue: mockRepository }],
    }).compile()

    handler = module.get<FindRoleByIdHandler>(FindRoleByIdHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return role when found", async () => {
    // Arrange
    const roleId = "role-123"
    const roleData = createMockRoleData({
      id: roleId,
      name: "admin",
      display_name: "Administrator",
    })
    const role = Role.instance(roleData as any).value!

    const query = new FindRoleByIdQuery(roleId)
    mockRepository.findById.mockResolvedValue(success(role))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.id).toBe(roleId)
      expect(result.value.name).toBe("admin")
    }
    expect(mockRepository.findById).toHaveBeenCalledWith(roleId)
  })

  it("should return NotFoundException when role not found", async () => {
    // Arrange
    const roleId = "non-existent-id"
    const query = new FindRoleByIdQuery(roleId)

    mockRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toBe("Role not found")
    }
  })

  it("should handle repository errors", async () => {
    // Arrange
    const roleId = "role-123"
    const query = new FindRoleByIdQuery(roleId)

    mockRepository.findById.mockResolvedValue(failure({ error: ["Database error"] }))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(InternalServerErrorException)
    }
  })

  it("should handle invalid UUID format", async () => {
    // Arrange
    const invalidId = "invalid-uuid"
    const query = new FindRoleByIdQuery(invalidId)

    mockRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(false)
    expect(mockRepository.findById).toHaveBeenCalledWith(invalidId)
  })
})
