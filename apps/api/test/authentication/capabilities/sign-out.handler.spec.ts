import { Test, TestingModule } from "@nestjs/testing"
import { SignOutHandler } from "@auth/capabilities/sign-out/handler"
import { SignOutCommand } from "@auth/capabilities/sign-out/command"
import { IRefreshTokenRepository } from "@auth/business/repositories"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockRefreshToken } from "../../helpers/mock-factories/refresh-token.factory"
import { UnauthorizedException } from "@nestjs/common"

/**
 * SignOutHandler Unit Tests
 *
 * Tests the sign-out command handler which invalidates refresh tokens by marking them inactive.
 */

describe("SignOutHandler", () => {
  let handler: SignOutHandler
  let mockRefreshTokenRepo: jest.Mocked<IRefreshTokenRepository>

  beforeEach(async () => {
    // Create mock repository
    mockRefreshTokenRepo = {
      findByUserToken: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByUser: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignOutHandler,
        {
          provide: IRefreshTokenRepository,
          useValue: mockRefreshTokenRepo,
        },
      ],
    }).compile()

    handler = module.get<SignOutHandler>(SignOutHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("execute", () => {
    it("should successfully sign out user by marking refresh token as inactive", async () => {
      // Arrange
      const mockToken = createMockRefreshToken()
      const command = new SignOutCommand("user-123", "refresh-token-123")

      mockRefreshTokenRepo.findByUserToken.mockResolvedValueOnce(success(mockToken))
      mockRefreshTokenRepo.save.mockResolvedValueOnce(success(mockToken))

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(true)
      expect(mockRefreshTokenRepo.findByUserToken).toHaveBeenCalledWith(
        "user-123",
        "refresh-token-123",
      )
      expect(mockRefreshTokenRepo.save).toHaveBeenCalled()
    })

    it("should return failure when token not found", async () => {
      // Arrange
      const command = new SignOutCommand("user-123", "invalid-token")

      mockRefreshTokenRepo.findByUserToken.mockResolvedValueOnce(success(null))

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeInstanceOf(UnauthorizedException)
        expect(result.error.message).toContain("Invalid refresh token")
      }
      expect(mockRefreshTokenRepo.save).not.toHaveBeenCalled()
    })

    it("should return failure when repository lookup fails", async () => {
      // Arrange
      const command = new SignOutCommand("user-123", "refresh-token-123")

      mockRefreshTokenRepo.findByUserToken.mockResolvedValueOnce(
        failure({ error: ["Database error"] }),
      )

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeInstanceOf(UnauthorizedException)
      }
      expect(mockRefreshTokenRepo.save).not.toHaveBeenCalled()
    })

    it("should return failure when token update fails", async () => {
      // Arrange
      const mockToken = createMockRefreshToken()
      const command = new SignOutCommand("user-123", "refresh-token-123")

      mockRefreshTokenRepo.findByUserToken.mockResolvedValueOnce(success(mockToken))
      mockRefreshTokenRepo.save.mockResolvedValueOnce(
        failure({ error: ["Error deactivating token"] }),
      )

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeInstanceOf(UnauthorizedException)
      }
    })

    it("should handle missing user ID", async () => {
      // Arrange
      const command = new SignOutCommand("", "refresh-token-123")

      mockRefreshTokenRepo.findByUserToken.mockResolvedValueOnce(success(null))

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(false)
      expect(mockRefreshTokenRepo.findByUserToken).toHaveBeenCalledWith("", "refresh-token-123")
    })

    it("should handle missing refresh token", async () => {
      // Arrange
      const command = new SignOutCommand("user-123", "")

      mockRefreshTokenRepo.findByUserToken.mockResolvedValueOnce(success(null))

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(false)
      expect(mockRefreshTokenRepo.findByUserToken).toHaveBeenCalledWith("user-123", "")
    })

    it("should set token status to INACTIVE when signing out", async () => {
      // Arrange
      const mockToken = createMockRefreshToken()
      const command = new SignOutCommand("user-123", "refresh-token-123")

      mockRefreshTokenRepo.findByUserToken.mockResolvedValueOnce(success(mockToken))
      mockRefreshTokenRepo.save.mockResolvedValueOnce(success(mockToken))

      // Act
      await handler.execute(command)

      // Assert
      expect(mockRefreshTokenRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "INACTIVE",
        }),
      )
    })
  })
})
