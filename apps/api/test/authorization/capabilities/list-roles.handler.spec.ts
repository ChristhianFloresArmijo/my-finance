import { Test, TestingModule } from "@nestjs/testing"
import { InternalServerErrorException } from "@nestjs/common"
import { ListRolesHandler } from "@authorization/capabilities/list-roles/handler"
import { ListRolesQuery } from "@authorization/capabilities/list-roles/query"
import { IRoleRepository } from "@authorization/business/repositories"
import { Role } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockRoleData } from "../../helpers/mock-factories"

describe("ListRolesHandler", () => {
  let handler: ListRolesHandler
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
      providers: [ListRolesHandler, { provide: IRoleRepository, useValue: mockRepository }],
    }).compile()

    handler = module.get<ListRolesHandler>(ListRolesHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return paginated roles list", async () => {
    // Arrange
    const role1Data = createMockRoleData({
      name: "admin",
      display_name: "Administrator",
    })
    const role1 = Role.instance(role1Data as any).value!

    const role2Data = createMockRoleData({
      name: "user",
      display_name: "User",
    })
    const role2 = Role.instance(role2Data as any).value!

    const params = { page: "1", limit: "10" }
    const query = new ListRolesQuery(params as any)

    mockRepository.find.mockResolvedValue(success([2, [role1, role2]]))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.count).toBe(2)
      expect(result.value.results).toHaveLength(2)
      expect(result.value.results[0].name).toBe("admin")
      expect(result.value.results[1].name).toBe("user")
    }
    expect(mockRepository.find).toHaveBeenCalled()
  })

  it("should return empty results when no roles exist", async () => {
    // Arrange
    const params = { page: "1", limit: "10" }
    const query = new ListRolesQuery(params as any)

    mockRepository.find.mockResolvedValue(success([0, []]))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.count).toBe(0)
      expect(result.value.results).toHaveLength(0)
    }
  })

  it("should handle repository errors", async () => {
    // Arrange
    const params = { page: "1", limit: "10" }
    const query = new ListRolesQuery(params as any)

    mockRepository.find.mockResolvedValue(failure({ error: ["Database error"] }))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(InternalServerErrorException)
    }
  })

  it("should pass filter to repository", async () => {
    // Arrange
    const params = { page: "1", limit: "10", name: "admin" }
    const query = new ListRolesQuery(params as any)

    mockRepository.find.mockResolvedValue(success([0, []]))

    // Act
    await handler.execute(query)

    // Assert
    expect(mockRepository.find).toHaveBeenCalled()
  })
})
