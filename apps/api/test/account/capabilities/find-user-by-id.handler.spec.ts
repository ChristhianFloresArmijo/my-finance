import { Test, TestingModule } from "@nestjs/testing"
import { FindUserByIdHandler } from "@account/capabilities/find-user-by-id/handler"
import { FindUserByIdQuery } from "@account/capabilities/find-user-by-id/query"
import { IUserRepository } from "@account/business/repositories"
import { success, failure } from "@shared/business/utils/error-handling"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { createMockCurrentUserDto } from "../../helpers/mock-factories"

describe("FindUserByIdHandler", () => {
  let handler: FindUserByIdHandler
  let mockUserRepo: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    mockUserRepo = {
      findById: jest.fn(),
      findCurrent: jest.fn(),
      find: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [FindUserByIdHandler, { provide: IUserRepository, useValue: mockUserRepo }],
    }).compile()

    handler = module.get<FindUserByIdHandler>(FindUserByIdHandler)
  })

  afterEach(() => jest.clearAllMocks())

  describe("execute", () => {
    it("should successfully find user by id", async () => {
      const userId = "user-123"
      const mockDto = createMockCurrentUserDto({ id: userId, email: "john@example.com" })

      mockUserRepo.findCurrent.mockResolvedValue(success(mockDto))

      const result = await handler.execute(new FindUserByIdQuery(userId))

      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(mockDto)
        expect(result.value.id).toBe(userId)
      }
      expect(mockUserRepo.findCurrent).toHaveBeenCalledWith(userId)
    })

    it("should return NotFoundException when user not found", async () => {
      mockUserRepo.findCurrent.mockResolvedValue(success(null))

      const result = await handler.execute(new FindUserByIdQuery("non-existent-id"))

      expect(result.isOk).toBe(false)
      if (!result.isOk) expect(result.error).toBeInstanceOf(NotFoundException)
      expect(mockUserRepo.findCurrent).toHaveBeenCalledWith("non-existent-id")
    })

    it("should handle repository errors", async () => {
      mockUserRepo.findCurrent.mockResolvedValue(failure({ message: "Database connection error" }))

      const result = await handler.execute(new FindUserByIdQuery("user-123"))

      expect(result.isOk).toBe(false)
      if (!result.isOk) expect(result.error).toBeInstanceOf(InternalServerErrorException)
    })

    it("should handle invalid UUID format gracefully", async () => {
      mockUserRepo.findCurrent.mockResolvedValue(failure({ message: "Invalid UUID format" }))

      const result = await handler.execute(new FindUserByIdQuery("invalid-uuid"))

      expect(result.isOk).toBe(false)
      if (!result.isOk) expect(result.error).toBeInstanceOf(InternalServerErrorException)
    })
  })
})
