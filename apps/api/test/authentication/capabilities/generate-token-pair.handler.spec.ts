import { Test, TestingModule } from "@nestjs/testing"
import { GenerateTokenPairHandler } from "@auth/capabilities/generate-token-pair/handler"
import { GenerateTokenPairCommand } from "@auth/capabilities/generate-token-pair/command"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import { IRefreshTokenRepository } from "@auth/business/repositories"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockUser } from "../../helpers/mock-factories/user.factory"
import { createMockRefreshToken } from "../../helpers/mock-factories/refresh-token.factory"
import { ConflictException } from "@nestjs/common"
import { Status } from '@database/prisma/generated-client'

/**
 * GenerateTokenPairHandler Unit Tests
 *
 * Tests the token generation handler which creates JWT access and refresh tokens.
 */

describe("GenerateTokenPairHandler", () => {
  let handler: GenerateTokenPairHandler
  let mockJwtService: jest.Mocked<JwtService>
  let mockConfigService: jest.Mocked<ConfigService>
  let mockRefreshTokenRepo: jest.Mocked<IRefreshTokenRepository>

  beforeEach(async () => {
    // Create mock services
    mockJwtService = {
      sign: jest.fn(),
    } as any

    mockConfigService = {
      get: jest.fn(),
    } as any

    mockRefreshTokenRepo = {
      findByUserToken: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByUser: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateTokenPairHandler,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: IRefreshTokenRepository,
          useValue: mockRefreshTokenRepo,
        },
      ],
    }).compile()

    handler = module.get<GenerateTokenPairHandler>(GenerateTokenPairHandler)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("execute - First Login", () => {
    it("should generate both access and refresh tokens for first login", async () => {
      // Arrange
      const mockUser = createMockUser()
      const command = new GenerateTokenPairCommand(mockUser)

      // Handler calls: 1) generateRefreshToken 2) generateAccessToken
      mockJwtService.sign
        .mockReturnValueOnce("mock-refresh-token")
        .mockReturnValueOnce("mock-access-token")
      mockConfigService.get.mockReturnValueOnce("refresh-secret").mockReturnValueOnce("604800")
      mockRefreshTokenRepo.save.mockResolvedValueOnce(
        success(
          createMockRefreshToken({
            id: "mock-refresh-token",
            user_id: mockUser.id,
          }),
        ),
      )

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.access_token).toBe("mock-access-token")
        expect(result.value.refresh_token).toBe("mock-refresh-token")
      }
      expect(mockJwtService.sign).toHaveBeenCalledTimes(2)
      expect(mockRefreshTokenRepo.save).toHaveBeenCalled()
    })

    it("should include user email and id in access token payload", async () => {
      // Arrange
      const mockUser = createMockUser({
        email: "test@example.com",
      })
      const command = new GenerateTokenPairCommand(mockUser)

      mockJwtService.sign.mockReturnValue("mock-token")
      mockConfigService.get.mockReturnValue("secret")
      mockRefreshTokenRepo.save.mockResolvedValueOnce(success(createMockRefreshToken()))

      // Act
      await handler.execute(command)

      // Assert
      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
          sub: mockUser.id,
        }),
      )
    })

    it("should store refresh token in repository", async () => {
      // Arrange
      const mockUser = createMockUser()
      const command = new GenerateTokenPairCommand(mockUser)

      mockJwtService.sign.mockReturnValue("mock-token")
      mockConfigService.get.mockReturnValue("secret")
      mockRefreshTokenRepo.save.mockResolvedValueOnce(success(createMockRefreshToken()))

      // Act
      await handler.execute(command)

      // Assert
      expect(mockRefreshTokenRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          status: Status.ACTIVE,
        }),
      )
    })

    it("should call save to store refresh token in repository", async () => {
      // Arrange
      const mockUser = createMockUser()
      const command = new GenerateTokenPairCommand(mockUser)

      mockJwtService.sign.mockReturnValue("mock-token")
      mockConfigService.get.mockReturnValue("secret")
      mockRefreshTokenRepo.save.mockResolvedValueOnce(success(createMockRefreshToken()))

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(true)
      expect(mockRefreshTokenRepo.save).toHaveBeenCalled()
    })
  })

  describe("execute - Token Refresh", () => {
    it("should generate new access token and reuse refresh token", async () => {
      // Arrange
      const mockUser = createMockUser()
      const existingRefreshToken = "existing-refresh-token"
      const command = new GenerateTokenPairCommand(mockUser, existingRefreshToken)

      mockJwtService.sign.mockReturnValueOnce("new-access-token")
      mockRefreshTokenRepo.findByUserToken.mockResolvedValueOnce(
        success(
          createMockRefreshToken({
            id: existingRefreshToken,
            user_id: mockUser.id,
            status: Status.ACTIVE,
          }),
        ),
      )

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(true)
      if (result.isOk) {
        expect(result.value.access_token).toBe("new-access-token")
        expect(result.value.refresh_token).toBe(existingRefreshToken)
      }
      expect(mockJwtService.sign).toHaveBeenCalledTimes(1) // Only access token
    })

    it("should return failure when refresh token not found", async () => {
      // Arrange
      const mockUser = createMockUser()
      const command = new GenerateTokenPairCommand(mockUser, "invalid-token")

      mockRefreshTokenRepo.findByUserToken.mockResolvedValueOnce(success(null))

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeInstanceOf(ConflictException)
      }
    })

    it("should return failure when refresh token is inactive", async () => {
      // Arrange
      const mockUser = createMockUser()
      const command = new GenerateTokenPairCommand(mockUser, "inactive-refresh-token")

      mockRefreshTokenRepo.findByUserToken.mockResolvedValueOnce(
        success(
          createMockRefreshToken({
            status: Status.INACTIVE,
          }),
        ),
      )

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeInstanceOf(ConflictException)
      }
    })

    it("should return failure when repository lookup fails", async () => {
      // Arrange
      const mockUser = createMockUser()
      const command = new GenerateTokenPairCommand(mockUser, "some-token")

      mockRefreshTokenRepo.findByUserToken.mockResolvedValueOnce(
        failure({ error: ["Database error"] }),
      )

      // Act
      const result = await handler.execute(command)

      // Assert
      expect(result.isOk).toBe(false)
      if (!result.isOk) {
        expect(result.error).toBeInstanceOf(ConflictException)
      }
    })
  })

  describe("Token Configuration", () => {
    it("should use correct JWT config for refresh token", async () => {
      // Arrange
      const mockUser = createMockUser()
      const command = new GenerateTokenPairCommand(mockUser)

      mockJwtService.sign.mockReturnValue("mock-token")
      mockConfigService.get.mockReturnValueOnce("refresh-secret-key").mockReturnValueOnce("604800")
      mockRefreshTokenRepo.save.mockResolvedValueOnce(success(createMockRefreshToken()))

      // Act
      await handler.execute(command)

      // Assert
      expect(mockConfigService.get).toHaveBeenCalledWith("jwtRefreshSecretKey")
      expect(mockConfigService.get).toHaveBeenCalledWith("secretKeyExpiresIn")
    })
  })
})
