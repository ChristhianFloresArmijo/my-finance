import { Test, TestingModule } from "@nestjs/testing"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { FindPermissionByIdHandler } from "@authorization/capabilities/find-permission-by-id/handler"
import { FindPermissionByIdQuery } from "@authorization/capabilities/find-permission-by-id/query"
import { IPermissionRepository } from "@authorization/business/repositories"
import { Permission } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockPermissionData } from "../../helpers/mock-factories"

describe("FindPermissionByIdHandler", () => {
  let handler: FindPermissionByIdHandler
  let mockRepository: jest.Mocked<IPermissionRepository>

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindPermissionByIdHandler,
        { provide: IPermissionRepository, useValue: mockRepository },
      ],
    }).compile()

    handler = module.get<FindPermissionByIdHandler>(FindPermissionByIdHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return permission when found", async () => {
    // Arrange
    const permissionId = "perm-123"
    const permissionData = createMockPermissionData({
      id: permissionId,
      resource: "posts",
      action: "delete",
    })
    const permission = Permission.instance(permissionData as any).value!

    const query = new FindPermissionByIdQuery(permissionId)
    mockRepository.findById.mockResolvedValue(success(permission))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.id).toBe(permissionId)
      expect(result.value.resource).toBe("posts")
      expect(result.value.action).toBe("delete")
    }
    expect(mockRepository.findById).toHaveBeenCalledWith(permissionId)
  })

  it("should return NotFoundException when permission not found", async () => {
    // Arrange
    const permissionId = "non-existent-id"
    const query = new FindPermissionByIdQuery(permissionId)

    mockRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toBe("Permission not found")
    }
  })

  it("should handle repository errors", async () => {
    // Arrange
    const permissionId = "perm-123"
    const query = new FindPermissionByIdQuery(permissionId)

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
    const query = new FindPermissionByIdQuery(invalidId)

    mockRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(false)
    expect(mockRepository.findById).toHaveBeenCalledWith(invalidId)
  })
})
