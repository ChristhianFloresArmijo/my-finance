import { Test, TestingModule } from "@nestjs/testing"
import { ConflictException, InternalServerErrorException } from "@nestjs/common"
import { CreatePermissionHandler } from "@authorization/capabilities/create-permission/handler"
import { CreatePermissionCommand } from "@authorization/capabilities/create-permission/command"
import { IPermissionRepository } from "@authorization/business/repositories"
import { Permission } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockPermissionData } from "../../helpers/mock-factories"

describe("CreatePermissionHandler", () => {
  let handler: CreatePermissionHandler
  let mockRepository: jest.Mocked<IPermissionRepository>

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePermissionHandler,
        { provide: IPermissionRepository, useValue: mockRepository },
      ],
    }).compile()

    handler = module.get<CreatePermissionHandler>(CreatePermissionHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should successfully create permission with valid data", async () => {
    // Arrange
    const dto = {
      resource: "posts",
      action: "create",
      description: "Create posts",
      is_system: false,
    }
    const command = new CreatePermissionCommand(dto)

    const permissionData = createMockPermissionData({
      resource: dto.resource,
      action: dto.action,
      description: dto.description,
    })
    const permission = Permission.instance(permissionData as any).value!

    mockRepository.find.mockResolvedValue(success([0, []]))
    mockRepository.save.mockResolvedValue(success(permission))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.resource).toBe(dto.resource)
      expect(result.value.action).toBe(dto.action)
    }
    expect(mockRepository.find).toHaveBeenCalledWith({
      where: { resource: dto.resource, action: dto.action },
    })
    expect(mockRepository.save).toHaveBeenCalled()
  })

  it("should return failure when permission already exists", async () => {
    // Arrange
    const dto = {
      resource: "users",
      action: "read",
      is_system: true,
    }
    const command = new CreatePermissionCommand(dto)

    const existingPermission = Permission.instance(
      createMockPermissionData({ resource: "users", action: "read" }) as any,
    ).value!

    mockRepository.find.mockResolvedValue(success([1, [existingPermission]]))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(ConflictException)
      expect(result.error.message).toContain("already exists")
    }
    expect(mockRepository.save).not.toHaveBeenCalled()
  })

  it("should handle repository find errors", async () => {
    // Arrange
    const dto = {
      resource: "comments",
      action: "delete",
      is_system: false,
    }
    const command = new CreatePermissionCommand(dto)

    mockRepository.find.mockResolvedValue(failure({ error: ["Database error"] }))

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
    const dto = {
      resource: "articles",
      action: "publish",
      is_system: false,
    }
    const command = new CreatePermissionCommand(dto)

    mockRepository.find.mockResolvedValue(success([0, []]))
    mockRepository.save.mockResolvedValue(failure({ error: ["Database error"] }))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(InternalServerErrorException)
    }
  })

  it("should set default values correctly", async () => {
    // Arrange
    const dto = {
      resource: "files",
      action: "download",
      is_system: false,
      // description not provided
    }
    const command = new CreatePermissionCommand(dto)

    const permissionData = createMockPermissionData({
      resource: dto.resource,
      action: dto.action,
    })
    const permission = Permission.instance(permissionData as any).value!

    mockRepository.find.mockResolvedValue(success([0, []]))
    mockRepository.save.mockResolvedValue(success(permission))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(true)
    expect(mockRepository.save).toHaveBeenCalled()

    const savedPermission = mockRepository.save.mock.calls[0][0]
    expect(savedPermission.status).toBe("ACTIVE")
  })
})
