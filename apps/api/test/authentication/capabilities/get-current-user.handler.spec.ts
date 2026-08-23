import { Test, TestingModule } from "@nestjs/testing"
import { GetCurrentUserHandler } from "@auth/capabilities/get-current-user/handler"
import { GetCurrentUserQuery } from "@auth/capabilities/get-current-user/query"
import { IUserRepository } from "@account/business/repositories"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockCurrentUserDto } from "../../helpers/mock-factories"
import { UnauthorizedException } from "@nestjs/common"

describe("GetCurrentUserHandler", () => {
  let handler: GetCurrentUserHandler
  let mockUserRepo: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    mockUserRepo = {
      findById: jest.fn(),
      findCurrent: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [GetCurrentUserHandler, { provide: IUserRepository, useValue: mockUserRepo }],
    }).compile()

    handler = module.get<GetCurrentUserHandler>(GetCurrentUserHandler)
  })

  afterEach(() => jest.clearAllMocks())

  it("should return current user dto when found by id", async () => {
    const mockDto = createMockCurrentUserDto({ id: "user-123", email: "john@example.com" })
    mockUserRepo.findCurrent.mockResolvedValueOnce(success(mockDto))

    const result = await handler.execute(new GetCurrentUserQuery("user-123"))

    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value).toBe(mockDto)
      expect(result.value.id).toBe("user-123")
    }
    expect(mockUserRepo.findCurrent).toHaveBeenCalledWith("user-123")
  })

  it("should return failure when user not found", async () => {
    mockUserRepo.findCurrent.mockResolvedValueOnce(success(null))

    const result = await handler.execute(new GetCurrentUserQuery("nonexistent-user-id"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(UnauthorizedException)
      expect(result.error.message).toBe("User not found")
    }
  })

  it("should return failure when repository lookup fails", async () => {
    mockUserRepo.findCurrent.mockResolvedValueOnce(failure({ error: ["Database error"] }))

    const result = await handler.execute(new GetCurrentUserQuery("user-123"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(UnauthorizedException)
  })

  it("should return user with all properties", async () => {
    const mockDto = createMockCurrentUserDto({
      id: "user-123",
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
    })
    mockUserRepo.findCurrent.mockResolvedValueOnce(success(mockDto))

    const result = await handler.execute(new GetCurrentUserQuery("user-123"))

    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.first_name).toBe("John")
      expect(result.value.last_name).toBe("Doe")
      expect(result.value.email).toBe("john@example.com")
    }
  })
})
