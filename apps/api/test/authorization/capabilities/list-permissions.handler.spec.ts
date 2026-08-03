import { Test, TestingModule } from "@nestjs/testing"
import { InternalServerErrorException } from "@nestjs/common"
import { ListPermissionsHandler } from "@authorization/capabilities/list-permissions/handler"
import { ListPermissionsQuery } from "@authorization/capabilities/list-permissions/query"
import { IPermissionRepository } from "@authorization/business/repositories"
import { Permission } from "@authorization/business/entities"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockPermissionData } from "../../helpers/mock-factories"

describe("ListPermissionsHandler", () => {
  let handler: ListPermissionsHandler
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
        ListPermissionsHandler,
        { provide: IPermissionRepository, useValue: mockRepository },
      ],
    }).compile()

    handler = module.get<ListPermissionsHandler>(ListPermissionsHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should return paginated list of permissions", async () => {
    // Arrange
    const params = { page: "1", limit: "10" }
    const query = new ListPermissionsQuery(params as any)

    const permission1 = Permission.instance(
      createMockPermissionData({ resource: "posts", action: "create" }) as any,
    ).value!
    const permission2 = Permission.instance(
      createMockPermissionData({ resource: "posts", action: "read" }) as any,
    ).value!

    mockRepository.find.mockResolvedValue(success([2, [permission1, permission2]]))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.count).toBe(2)
      expect(result.value.results).toHaveLength(2)
    }
    expect(mockRepository.find).toHaveBeenCalledWith({}, query.pagination, query.filter)
  })

  it("should return empty results when no permissions found", async () => {
    // Arrange
    const params = { page: "1", limit: "10" }
    const query = new ListPermissionsQuery(params as any)

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
    const query = new ListPermissionsQuery(params as any)

    mockRepository.find.mockResolvedValue(failure({ error: ["Database error"] }))

    // Act
    const result = await handler.execute(query)

    // Assert
    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(InternalServerErrorException)
    }
  })

  it("should pass filter parameters to repository", async () => {
    // Arrange
    const params = {
      page: "1",
      limit: "5",
      resource: "users",
      action: "delete",
    }
    const query = new ListPermissionsQuery(params as any)

    mockRepository.find.mockResolvedValue(success([0, []]))

    // Act
    await handler.execute(query)

    // Assert
    expect(mockRepository.find).toHaveBeenCalledWith({}, query.pagination, query.filter)
  })
})
