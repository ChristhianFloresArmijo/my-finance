import { Test, TestingModule } from "@nestjs/testing"
import { InternalServerErrorException, NotFoundException, ForbiddenException } from "@nestjs/common"
import { DeletePermissionHandler } from "@authorization/capabilities/delete-permission/handler"
import { DeletePermissionCommand } from "@authorization/capabilities/delete-permission/command"
import { IPermissionRepository } from "@authorization/business/repositories"
import { Permission } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockPermissionData } from "../../helpers/mock-factories"
import { PrismaService } from "@shared/integration/services"

describe("DeletePermissionHandler", () => {
  let handler: DeletePermissionHandler
  let mockRepository: jest.Mocked<IPermissionRepository>
  let mockPrismaService: any

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    } as any

    mockPrismaService = {
      rolePermission: {
        count: jest.fn(),
      },
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePermissionHandler,
        { provide: IPermissionRepository, useValue: mockRepository },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile()

    handler = module.get<DeletePermissionHandler>(DeletePermissionHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should successfully delete non-system permission", async () => {
    // Arrange
    const permissionId = "perm-123"
    const command = new DeletePermissionCommand(permissionId)

    const permissionData = createMockPermissionData({
      id: permissionId,
      resource: "custom",
      action: "manage",
      is_system: false,
    })
    const permission = Permission.instance(permissionData as any).value!

    mockRepository.findById.mockResolvedValue(success(permission))
    mockPrismaService.rolePermission.count.mockResolvedValue(0)
    mockRepository.delete.mockResolvedValue(success(true))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value).toBe(true)
    }
    expect(mockRepository.findById).toHaveBeenCalledWith(permissionId)
    expect(mockPrismaService.rolePermission.count).toHaveBeenCalledWith({
      where: { permission_id: permissionId, status: "ACTIVE" },
    })
    expect(mockRepository.delete).toHaveBeenCalledWith(permissionId)
  })

  it("should return NotFoundException when permission not found", async () => {
    // Arrange
    const permissionId = "non-existent-id"
    const command = new DeletePermissionCommand(permissionId)

    mockRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toBe("Permission not found")
    }
    expect(mockRepository.delete).not.toHaveBeenCalled()
  })

  it("should prevent deletion of system permissions", async () => {
    // Arrange
    const permissionId = "perm-123"
    const command = new DeletePermissionCommand(permissionId)

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
      expect(result.error.message).toContain("system permissions")
    }
    expect(mockRepository.delete).not.toHaveBeenCalled()
  })

  it("should prevent deletion of permissions assigned to roles", async () => {
    // Arrange
    const permissionId = "perm-123"
    const command = new DeletePermissionCommand(permissionId)

    const permissionData = createMockPermissionData({
      id: permissionId,
      resource: "posts",
      action: "publish",
      is_system: false,
    })
    const permission = Permission.instance(permissionData as any).value!

    mockRepository.findById.mockResolvedValue(success(permission))
    mockPrismaService.rolePermission.count.mockResolvedValue(2) // Assigned to 2 roles

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(ForbiddenException)
      expect(result.error.message).toContain("assigned to roles")
    }
    expect(mockRepository.delete).not.toHaveBeenCalled()
  })

  it("should handle repository delete errors", async () => {
    // Arrange
    const permissionId = "perm-123"
    const command = new DeletePermissionCommand(permissionId)

    const permissionData = createMockPermissionData({
      id: permissionId,
      resource: "comments",
      action: "moderate",
      is_system: false,
    })
    const permission = Permission.instance(permissionData as any).value!

    mockRepository.findById.mockResolvedValue(success(permission))
    mockPrismaService.rolePermission.count.mockResolvedValue(0)
    mockRepository.delete.mockResolvedValue(failure({ error: ["Database error"] }))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(InternalServerErrorException)
    }
  })
})
