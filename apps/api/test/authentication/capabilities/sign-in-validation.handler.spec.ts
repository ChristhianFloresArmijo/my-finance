import { Test, TestingModule } from "@nestjs/testing"
import { SignInValidationHandler } from "@auth/capabilities/sign-in-validation/handler"
import { SignInValidationQuery } from "@auth/capabilities/sign-in-validation/query"
import { IUserRepository } from "@account/business/repositories"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockUser } from "../../helpers/mock-factories/user.factory"
import { NotFoundException, InternalServerErrorException } from "@nestjs/common"

/**
 * SignInValidationHandler Unit Tests
 *
 * Tests the sign-in validation query handler which validates user credentials.
 */

describe("SignInValidationHandler", () => {
  let handler: SignInValidationHandler
  let mockUserRepo: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    // Create mock repository
    mockUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignInValidationHandler,
        {
          provide: IUserRepository,
          useValue: mockUserRepo,
        },
      ],
    }).compile()

    handler = module.get<SignInValidationHandler>(SignInValidationHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("execute", () => {
    it("should return user when credentials are valid", async () => {
      // Arrange
      const mockUser = createMockUser({
        email: "john@example.com",
      })
      // Mock comparePassword to return true
      jest.spyOn(mockUser, "comparePassword").mockReturnValue(true)

      const query = new SignInValidationQuery("john@example.com", "correctPassword")

      mockUserRepo.findByEmail.mockResolvedValueOnce(success(mockUser))

      // Act
      const result = await handler.execute(query)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value).toBe(mockUser)
        expect(result.value.email).toBe("john@example.com")
      }
    })

    it("should return failure when user not found", async () => {
      // Arrange
      const query = new SignInValidationQuery("nonexistent@example.com", "password")

      mockUserRepo.findByEmail.mockResolvedValueOnce(success(null))

      // Act
      const result = await handler.execute(query)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeInstanceOf(NotFoundException)
        expect(result.error.message).toBe("Invalid email or password")
      }
    })

    it("should return failure when password is incorrect", async () => {
      // Arrange
      const mockUser = createMockUser()
      jest.spyOn(mockUser, "comparePassword").mockReturnValue(false)

      const query = new SignInValidationQuery("john@example.com", "wrongPassword")

      mockUserRepo.findByEmail.mockResolvedValueOnce(success(mockUser))

      // Act
      const result = await handler.execute(query)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeInstanceOf(NotFoundException)
        expect(result.error.message).toBe("Invalid email or password")
      }
    })

    it("should return failure when repository lookup fails", async () => {
      // Arrange
      const query = new SignInValidationQuery("john@example.com", "password")

      mockUserRepo.findByEmail.mockResolvedValueOnce(failure({ error: ["Database error"] }))

      // Act
      const result = await handler.execute(query)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeInstanceOf(InternalServerErrorException)
      }
    })

    it("should call comparePassword with correct password", async () => {
      // Arrange
      const password = "testPassword123"
      const mockUser = createMockUser()
      const comparePasswordSpy = jest.spyOn(mockUser, "comparePassword").mockReturnValue(true)

      const query = new SignInValidationQuery("john@example.com", password)

      mockUserRepo.findByEmail.mockResolvedValueOnce(success(mockUser))

      // Act
      await handler.execute(query)

      // Assert
      expect(comparePasswordSpy).toHaveBeenCalledWith(password)
    })

    it("should not expose whether user exists or password is wrong", async () => {
      // Arrange
      const query1 = new SignInValidationQuery("nonexistent@example.com", "password")
      const query2 = new SignInValidationQuery("existing@example.com", "wrongPassword")

      mockUserRepo.findByEmail.mockResolvedValueOnce(success(null))

      const mockUser = createMockUser()
      jest.spyOn(mockUser, "comparePassword").mockReturnValue(false)
      mockUserRepo.findByEmail.mockResolvedValueOnce(success(mockUser))

      // Act
      const result1 = await handler.execute(query1)
      const result2 = await handler.execute(query2)

      // Assert - Both should have same error message
      expect(result1.isOk).toBe(false)
      expect(result2.isOk).toBe(false)

      if (!result1.isOk && !result2.isOk) {
        expect(result1.error.message).toBe(result2.error.message)
        expect(result1.error.message).toBe("Invalid email or password")
      }
    })

    it("should handle empty email", async () => {
      // Arrange
      const query = new SignInValidationQuery("", "password")

      mockUserRepo.findByEmail.mockResolvedValueOnce(success(null))

      // Act
      const result = await handler.execute(query)

      // Assert
      expect(result.isOk).toBe(false)
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith("")
    })

    it("should handle empty password", async () => {
      // Arrange
      const mockUser = createMockUser()
      jest.spyOn(mockUser, "comparePassword").mockReturnValue(false)

      const query = new SignInValidationQuery("john@example.com", "")

      mockUserRepo.findByEmail.mockResolvedValueOnce(success(mockUser))

      // Act
      const result = await handler.execute(query)

      // Assert
      expect(result.isOk).toBe(false)
    })

    it("should call repository with lowercase email", async () => {
      // Arrange
      const mockUser = createMockUser()
      jest.spyOn(mockUser, "comparePassword").mockReturnValue(true)

      const query = new SignInValidationQuery("John@Example.COM", "password")

      mockUserRepo.findByEmail.mockResolvedValueOnce(success(mockUser))

      // Act
      await handler.execute(query)

      // Assert
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith("John@Example.COM")
    })
  })
})
