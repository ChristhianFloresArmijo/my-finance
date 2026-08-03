import { Test, TestingModule } from "@nestjs/testing"
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common"
import { UpdateRoleHandler } from "@authorization/capabilities/update-role/handler"
import { UpdateRoleCommand } from "@authorization/capabilities/update-role/command"
import { IRoleRepository } from "@authorization/business/repositories"
import { Role } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockRoleData } from "../../helpers/mock-factories"

describe("UpdateRoleHandler", () => {
  let handler: UpdateRoleHandler
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
      providers: [UpdateRoleHandler, { provide: IRoleRepository, useValue: mockRepository }],
    }).compile()

    handler = module.get<UpdateRoleHandler>(UpdateRoleHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should successfully update role with valid data", async () => {
    // Arrange
    const roleId = "role-123"
    const dto = {
      display_name: "Updated Editor",
      description: "Updated description",
    }
    const command = new UpdateRoleCommand(roleId, dto)

    const existingRoleData = createMockRoleData({
      id: roleId,
      name: "editor",
      display_name: "Editor",
    })
    const existingRole = Role.instance(existingRoleData as any).value!

    const updatedRoleData = createMockRoleData({
      id: roleId,
      name: "editor",
      display_name: dto.display_name,
      description: dto.description,
    })
    const updatedRole = Role.instance(updatedRoleData as any).value!

    mockRepository.findById.mockResolvedValue(success(existingRole))
    mockRepository.save.mockResolvedValue(success(updatedRole))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.display_name).toBe(dto.display_name)
    }
    expect(mockRepository.findById).toHaveBeenCalledWith(roleId)
    expect(mockRepository.save).toHaveBeenCalled()
  })

  it("should return NotFoundException when role not found", async () => {
    // Arrange
    const roleId = "non-existent-id"
    const dto = { display_name: "Updated" }
    const command = new UpdateRoleCommand(roleId, dto)

    mockRepository.findById.mockResolvedValue(success(null))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(NotFoundException)
      expect(result.error.message).toBe("Role not found")
    }
    expect(mockRepository.save).not.toHaveBeenCalled()
  })

  it("should prevent updating system role name", async () => {
    // Arrange
    const roleId = "role-123"
    const dto = { name: "new-admin" }
    const command = new UpdateRoleCommand(roleId, dto)

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
      expect(result.error.message).toContain("system role")
    }
    expect(mockRepository.save).not.toHaveBeenCalled()
  })

  it("should return ConflictException when new name already exists", async () => {
    // Arrange
    const roleId = "role-123"
    const dto = { name: "existing-role" }
    const command = new UpdateRoleCommand(roleId, dto)

    const existingRoleData = createMockRoleData({
      id: roleId,
      name: "editor",
      display_name: "Editor",
    })
    const existingRole = Role.instance(existingRoleData as any).value!

    const conflictingRoleData = createMockRoleData({
      id: "role-456",
      name: "existing-role",
      display_name: "Existing",
    })
    const conflictingRole = Role.instance(conflictingRoleData as any).value!

    mockRepository.findById.mockResolvedValue(success(existingRole))
    mockRepository.find.mockResolvedValue(success([1, [conflictingRole]]))

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

  it("should handle repository save errors", async () => {
    // Arrange
    const roleId = "role-123"
    const dto = { description: "Updated description" }
    const command = new UpdateRoleCommand(roleId, dto)

    const existingRoleData = createMockRoleData({
      id: roleId,
      name: "editor",
      display_name: "Editor",
    })
    const existingRole = Role.instance(existingRoleData as any).value!

    mockRepository.findById.mockResolvedValue(success(existingRole))
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
