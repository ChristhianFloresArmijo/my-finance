import { Test, TestingModule } from "@nestjs/testing"
import { ListUsersHandler } from "@account/capabilities/list-users/handler"
import { ListUsersQuery } from "@account/capabilities/list-users/query"
import { IUserRepository } from "@account/business/repositories"
import { success, failure } from "@shared/business/utils/error-handling"
import { InternalServerErrorException } from "@nestjs/common"
import { createMockUser } from "../../helpers/mock-factories"

/**
 * ListUsersHandler Tests
 *
 * Tests for the ListUsersHandler which handles listing users with pagination.
 */

describe("ListUsersHandler", () => {
  let handler: ListUsersHandler
  let mockUserRepo: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    // Setup mock repository
    mockUserRepo = {
      find: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    } as any

    // Create test module
    const module: TestingModule = await Test.createTestingModule({
      providers: [ListUsersHandler, { provide: IUserRepository, useValue: mockUserRepo }],
    }).compile()

    handler = module.get<ListUsersHandler>(ListUsersHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("execute", () => {
    it("should successfully list users with pagination", async () => {
      // Arrange
      const pagination = { limit: 10, offset: 0 }
      const query = new ListUsersQuery(pagination)

      const mockUsers = [
        createMockUser({ id: "user-1", email: "user1@example.com" }),
        createMockUser({ id: "user-2", email: "user2@example.com" }),
      ]

      mockUserRepo.find.mockResolvedValue(success([2, mockUsers]))

      // Act
      const result = await handler.execute(query)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.count).toBe(2)
        expect(result.value.results).toEqual(mockUsers)
        expect(result.value.results).toHaveLength(2)
      }
      expect(mockUserRepo.find).toHaveBeenCalled()
    })

    it("should return empty results when no users found", async () => {
      // Arrange
      const pagination = { limit: 10, offset: 0 }
      const query = new ListUsersQuery(pagination)

      mockUserRepo.find.mockResolvedValue(success([0, []]))

      // Act
      const result = await handler.execute(query)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.count).toBe(0)
        expect(result.value.results).toEqual([])
      }
    })

    it("should handle repository errors", async () => {
      // Arrange
      const pagination = { limit: 10, offset: 0 }
      const query = new ListUsersQuery(pagination)

      mockUserRepo.find.mockResolvedValue(failure({ message: "Database error" }))

      // Act
      const result = await handler.execute(query)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeInstanceOf(InternalServerErrorException)
      }
    })

    it("should respect pagination offset", async () => {
      // Arrange
      const pagination = { limit: 10, offset: 20 }
      const query = new ListUsersQuery(pagination)

      const mockUsers = [createMockUser({ id: "user-21", email: "user21@example.com" })]

      mockUserRepo.find.mockResolvedValue(success([100, mockUsers]))

      // Act
      const result = await handler.execute(query)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.count).toBe(100)
        expect(result.value.results).toHaveLength(1)
      }
    })

    it("should handle large datasets correctly", async () => {
      // Arrange
      const pagination = { limit: 100, offset: 0 }
      const query = new ListUsersQuery(pagination)

      const mockUsers = Array.from({ length: 100 }, (_, i) =>
        createMockUser({ id: `user-${i}`, email: `user${i}@example.com` }),
      )

      mockUserRepo.find.mockResolvedValue(success([1000, mockUsers]))

      // Act
      const result = await handler.execute(query)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.count).toBe(1000)
        expect(result.value.results).toHaveLength(100)
      }
    })
  })
})
