import { Test, TestingModule } from "@nestjs/testing"
import { InternalServerErrorException, NotFoundException, ForbiddenException } from "@nestjs/common"
import { UpdatePermissionHandler } from "@authorization/capabilities/update-permission/handler"
import { UpdatePermissionCommand } from "@authorization/capabilities/update-permission/command"
import { IPermissionRepository } from "@authorization/business/repositories"
import { Permission } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockPermissionData } from "../../helpers/mock-factories"
import { Status } from "@database/prisma/generated-client"

describe("UpdatePermissionHandler", () => {
  let handler: UpdatePermissionHandler
  let mockRepository: jest.Mocked<IPermissionRepository>

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePermissionHandler,
        { provide: IPermissionRepository, useValue: mockRepository },
      ],
    }).compile()

    handler = module.get<UpdatePermissionHandler>(UpdatePermissionHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should successfully update permission with valid data", async () => {
    // Arrange
    const permissionId = "perm-123"
    const dto = {
      description: "Updated description",
      status: Status.INACTIVE,
    }
    const command = new UpdatePermissionCommand(permissionId, dto)

    const existingPermissionData = createMockPermissionData({
      id: permissionId,
      resource: "posts",
      action: "create",
      description: "Original description",
    })
    const existingPermission = Permission.instance(existingPermissionData as any).value!

    const updatedPermissionData = createMockPermissionData({
      id: permissionId,
      resource: "posts",
      action: "create",
      description: dto.description,
      status: dto.status,
    })
    const updatedPermission = Permission.instance(updatedPermissionData as any).value!

    mockRepository.findById.mockResolvedValue(success(existingPermission))
    mockRepository.save.mockResolvedValue(success(updatedPermission))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.description).toBe(dto.description)
    }
    expect(mockRepository.findById).toHaveBeenCalledWith(permissionId)
    expect(mockRepository.save).toHaveBeenCalled()
  })

  it("should return NotFoundException when permission not found", async () => {
    // Arrange
    const permissionId = "non-existent-id"
    const dto = { description: "Updated" }
    const command = new UpdatePermissionCommand(permissionId, dto)

    mockRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toBe("Permission not found")
    }
    expect(mockRepository.save).not.toHaveBeenCalled()
  })

  it("should prevent updating system permissions", async () => {
    // Arrange
    const permissionId = "perm-123"
    const dto = { description: "Updated description" }
    const command = new UpdatePermissionCommand(permissionId, dto)

    const systemPermissionData = createMockPermissionData({
      id: permissionId,
      resource: "users",
      action: "manage",
      is_system: true,
    })
    const systemPermission = Permission.instance(systemPermissionData as any).value!

    mockRepository.findById.mockResolvedValue(success(systemPermission))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(ForbiddenException)
      expect(result.error.message).toContain("system permission")
    }
    expect(mockRepository.save).not.toHaveBeenCalled()
  })

  it("should handle repository findById errors", async () => {
    // Arrange
    const permissionId = "perm-123"
    const dto = { description: "Updated" }
    const command = new UpdatePermissionCommand(permissionId, dto)

    mockRepository.findById.mockResolvedValue(failure({ error: ["Database error"] }))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(InternalServerErrorException)
    }
    expect(mockRepository.save).not.toHaveBeenCalled()
  })

  it("should handle repository save errors", async () => {
    // Arrange
    const permissionId = "perm-123"
    const dto = { description: "Updated description" }
    const command = new UpdatePermissionCommand(permissionId, dto)

    const existingPermissionData = createMockPermissionData({
      id: permissionId,
      resource: "posts",
      action: "edit",
    })
    const existingPermission = Permission.instance(existingPermissionData as any).value!

    mockRepository.findById.mockResolvedValue(success(existingPermission))
    mockRepository.save.mockResolvedValue(failure({ error: ["Database error"] }))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(InternalServerErrorException)
    }
  })
})
