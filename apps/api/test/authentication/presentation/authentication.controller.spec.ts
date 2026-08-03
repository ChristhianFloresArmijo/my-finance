import { Test, TestingModule } from "@nestjs/testing"
import { CommandBus, QueryBus } from "@nestjs/cqrs"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import { AuthenticationController } from "@auth/presentation/restful/authentication.controller"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockUser } from "../../helpers/mock-factories/user.factory"
import { UnauthorizedException } from "@nestjs/common"

/**
 * AuthenticationController Unit Tests
 *
 * Tests the authentication REST controller endpoints using HTTP-only cookies.
 */

describe("AuthenticationController", () => {
  let controller: AuthenticationController
  let mockCommandBus: jest.Mocked<CommandBus>
  let mockQueryBus: jest.Mocked<QueryBus>
  let mockJwtService: jest.Mocked<JwtService>
  let mockConfigService: jest.Mocked<ConfigService>

  beforeEach(async () => {
    // Create mock services
    mockCommandBus = {
      execute: jest.fn(),
    } as any

    mockQueryBus = {
      execute: jest.fn(),
    } as any

    mockJwtService = {
      verify: jest.fn(),
      sign: jest.fn(),
    } as any

    mockConfigService = {
      get: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        {
          provide: CommandBus,
          useValue: mockCommandBus,
        },
        {
          provide: QueryBus,
          useValue: mockQueryBus,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    controller = module.get<AuthenticationController>(AuthenticationController)

    // Setup default config values
    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, any> = {
        nodeEnv: "test",
        cookieSecure: false,
        cookieSameSite: "lax",
        cookieDomain: undefined,
        jwtRefreshSecretKey: "test-refresh-secret",
      }
      return config[key]
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("signIn", () => {
    it("should successfully sign in and set HTTP-only cookies", async () => {
      // Arrange
      const signInDto = {
        email: "john@example.com",
        password: "SecurePassword123!",
      }
      const mockTokens = {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
      }
      const mockResponse = {
        cookie: jest.fn(),
      } as any

      mockCommandBus.execute.mockResolvedValueOnce(success(mockTokens))

      // Act
      const result = await controller.signIn(signInDto, mockResponse)

      // Assert
      expect(result).toEqual({ message: "Signed in successfully" })
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2)
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "accessToken",
        "mock-access-token",
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: "lax",
        }),
      )
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "mock-refresh-token",
        expect.objectContaining({
          httpOnly: true,
        }),
      )
    })

    it("should throw error when credentials are invalid", async () => {
      // Arrange
      const signInDto = {
        email: "wrong@example.com",
        password: "wrongpassword",
      }
      const mockResponse = {} as any

      mockCommandBus.execute.mockResolvedValueOnce(
        failure(new UnauthorizedException("Invalid credentials")),
      )

      // Act & Assert
      await expect(controller.signIn(signInDto, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })

  describe("refresh", () => {
    it("should generate new tokens with valid refresh token", async () => {
      // Arrange
      const mockUser = createMockUser({ id: "user-123" })
      const mockRequest = {
        cookies: { refreshToken: "valid-refresh-token" },
      } as any
      const mockResponse = {
        cookie: jest.fn(),
      } as any

      mockJwtService.verify.mockReturnValueOnce({ sub: "user-123" })
      mockQueryBus.execute.mockResolvedValueOnce(success(mockUser))
      mockCommandBus.execute.mockResolvedValueOnce(
        success({
          access_token: "new-access-token",
          refresh_token: "new-refresh-token",
        }),
      )

      // Act
      const result = await controller.refresh(mockRequest, mockResponse)

      // Assert
      expect(result).toEqual({ message: "Tokens refreshed successfully" })
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2)
    })

    it("should throw error when refresh token is missing", async () => {
      // Arrange
      const mockRequest = {
        cookies: {},
      } as any
      const mockResponse = {} as any

      // Act & Assert
      await expect(controller.refresh(mockRequest, mockResponse)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it("should throw error when refresh token is invalid", async () => {
      // Arrange
      const mockRequest = {
        cookies: { refreshToken: "invalid-token" },
      } as any
      const mockResponse = {} as any

      mockJwtService.verify.mockImplementationOnce(() => {
        throw new Error("Invalid token")
      })

      // Act & Assert
      await expect(controller.refresh(mockRequest, mockResponse)).rejects.toThrow()
    })
  })

  describe("getCurrentUser", () => {
    it("should return current user information", async () => {
      // Arrange
      const mockUser = createMockUser({
        id: "user-123",
        email: "john@example.com",
      })
      const currentUser = { sub: "user-123" }

      mockQueryBus.execute.mockResolvedValueOnce(success(mockUser))

      // Act
      const result = await controller.getCurrentUser(currentUser)

      // Assert
      expect(result).toBe(mockUser)
      expect(result.email).toBe("john@example.com")
    })

    it("should throw error when user not found", async () => {
      // Arrange
      const currentUser = { sub: "nonexistent-user" }

      mockQueryBus.execute.mockResolvedValueOnce(
        failure(new UnauthorizedException("User not found")),
      )

      // Act & Assert
      await expect(controller.getCurrentUser(currentUser)).rejects.toThrow(UnauthorizedException)
    })
  })

  describe("signOut", () => {
    it("should successfully sign out and clear cookies", async () => {
      // Arrange
      const mockRequest = {
        cookies: { refreshToken: "valid-refresh-token" },
      } as any
      const mockResponse = {
        clearCookie: jest.fn(),
      } as any
      const currentUser = { sub: "user-123" }

      mockCommandBus.execute.mockResolvedValueOnce(success(undefined))

      // Act
      const result = await controller.signOut(mockRequest, mockResponse, currentUser)

      // Assert
      expect(result).toEqual({ message: "Signed out successfully" })
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2)
      expect(mockResponse.clearCookie).toHaveBeenCalledWith("accessToken", expect.any(Object))
      expect(mockResponse.clearCookie).toHaveBeenCalledWith("refreshToken", expect.any(Object))
    })

    it("should throw error when refresh token is missing", async () => {
      // Arrange
      const mockRequest = {
        cookies: {},
      } as any
      const mockResponse = {} as any
      const currentUser = { sub: "user-123" }

      // Act & Assert
      await expect(controller.signOut(mockRequest, mockResponse, currentUser)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it("should throw error when sign out fails", async () => {
      // Arrange
      const mockRequest = {
        cookies: { refreshToken: "invalid-token" },
      } as any
      const mockResponse = {} as any
      const currentUser = { sub: "user-123" }

      mockCommandBus.execute.mockResolvedValueOnce(
        failure(new UnauthorizedException("Invalid token")),
      )

      // Act & Assert
      await expect(controller.signOut(mockRequest, mockResponse, currentUser)).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })
})
