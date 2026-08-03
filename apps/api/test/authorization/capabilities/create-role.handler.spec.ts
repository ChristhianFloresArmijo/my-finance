import { Test, TestingModule } from "@nestjs/testing"
import { ConflictException, InternalServerErrorException } from "@nestjs/common"
import { CreateRoleHandler } from "@authorization/capabilities/create-role/handler"
import { CreateRoleCommand } from "@authorization/capabilities/create-role/command"
import { IRoleRepository } from "@authorization/business/repositories"
import { Role } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockRoleData } from "../../helpers/mock-factories"
import { Status } from '@database/prisma/generated-client'

describe("CreateRoleHandler", () => {
  let handler: CreateRoleHandler
  let mockRepository: jest.Mocked<IRoleRepository>

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      getUserRoles: jest.fn(),
      getRolePermissions: jest.fn(),
      assignRoleToUser: jest.fn(),
      revokeRoleFromUser: jest.fn(),
      assignPermissionToRole: jest.fn(),
      revokePermissionFromRole: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateRoleHandler, { provide: IRoleRepository, useValue: mockRepository }],
    }).compile()

    handler = module.get<CreateRoleHandler>(CreateRoleHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should successfully create role with valid data", async () => {
    // Arrange
    const dto = {
      name: "moderator",
      display_name: "Moderator",
      description: "Content moderator role",
      is_system: false,
      status: Status.ACTIVE,
    }
    const command = new CreateRoleCommand(dto)

    const roleData = createMockRoleData({
      name: dto.name,
      display_name: dto.display_name,
      description: dto.description,
    })
    const role = Role.instance(roleData as any).value!

    mockRepository.find.mockResolvedValue(success([0, []]))
    mockRepository.save.mockResolvedValue(success(role))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.name).toBe(dto.name)
      expect(result.value.display_name).toBe(dto.display_name)
    }
    expect(mockRepository.find).toHaveBeenCalledWith({
      where: { name: dto.name },
    })
    expect(mockRepository.save).toHaveBeenCalled()
  })

  it("should return failure when role name already exists", async () => {
    // Arrange
    const dto = {
      name: "admin",
      display_name: "Administrator",
      is_system: true,
    }
    const command = new CreateRoleCommand(dto)

    const existingRole = Role.instance(
      createMockRoleData({ name: "admin", display_name: "Administrator" }) as any,
    ).value!

    mockRepository.find.mockResolvedValue(success([1, [existingRole]]))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(ConflictException)
      expect(result.error.message).toBe("A role with this name already exists")
    }
    expect(mockRepository.save).not.toHaveBeenCalled()
  })

  it("should handle entity creation errors", async () => {
    // Arrange
    const dto = {
      name: "ab", // Too short
      display_name: "Test",
      is_system: false,
    }
    const command = new CreateRoleCommand(dto)

    mockRepository.find.mockResolvedValue(success([0, []]))

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
      name: "editor",
      display_name: "Editor",
      is_system: false,
    }
    const command = new CreateRoleCommand(dto)

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

  it("should handle repository find errors", async () => {
    // Arrange
    const dto = {
      name: "viewer",
      display_name: "Viewer",
      is_system: false,
    }
    const command = new CreateRoleCommand(dto)

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

  it("should set default values correctly", async () => {
    // Arrange
    const dto = {
      name: "guest",
      display_name: "Guest",
      is_system: false,
      // description and status not provided
    }
    const command = new CreateRoleCommand(dto)

    const roleData = createMockRoleData({
      name: dto.name,
      display_name: dto.display_name,
    })
    const role = Role.instance(roleData as any).value!

    mockRepository.find.mockResolvedValue(success([0, []]))
    mockRepository.save.mockResolvedValue(success(role))

    // Act
    const result = await handler.execute(command)

    // Assert
    expect(result.isOk).toBe(true)
    expect(mockRepository.save).toHaveBeenCalled()

    const savedRole = mockRepository.save.mock.calls[0][0]
    expect(savedRole.status).toBe("ACTIVE")
    expect(savedRole.description).toBeNull()
  })
})
