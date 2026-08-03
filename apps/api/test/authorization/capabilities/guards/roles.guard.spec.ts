import { ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { RolesGuard } from "@authorization/capabilities/guards/roles.guard"
import { AuthorizationService } from "@authorization/business/services/authorization.service"
import { REQUIRE_ROLES_KEY } from "@authorization/presentation/decorators/require-role.decorator"

describe("RolesGuard", () => {
  let guard: RolesGuard
  let mockReflector: jest.Mocked<Reflector>
  let mockAuthService: jest.Mocked<AuthorizationService>
  let mockContext: ExecutionContext

  beforeEach(() => {
    // Create mocks
    mockReflector = {
      getAllAndOverride: jest.fn(),
    } as any

    mockAuthService = {
      checkUserRole: jest.fn(),
      checkUserPermission: jest.fn(),
      getUserPermissions: jest.fn(),
      getUserRoles: jest.fn(),
    } as any

    guard = new RolesGuard(mockReflector, mockAuthService)

    // Create mock ExecutionContext
    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { id: "user-123", email: "test@example.com" },
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("should allow access when user has required role", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue(["admin"])
    mockAuthService.checkUserRole.mockResolvedValue(true)

    // Act
    const result = await guard.canActivate(mockContext)

    // Assert
    expect(result).toBe(true)
    expect(mockAuthService.checkUserRole).toHaveBeenCalledWith("user-123", "admin")
  })

  it("should deny access when user lacks role", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue(["admin"])
    mockAuthService.checkUserRole.mockResolvedValue(false)

    // Act & Assert
    await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException)
    await expect(guard.canActivate(mockContext)).rejects.toThrow("Insufficient permissions")
  })

  it("should allow access when no roles required (no decorator)", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue(undefined)

    // Act
    const result = await guard.canActivate(mockContext)

    // Assert
    expect(result).toBe(true)
    expect(mockAuthService.checkUserRole).not.toHaveBeenCalled()
  })

  it("should allow access when empty roles array", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue([])

    // Act
    const result = await guard.canActivate(mockContext)

    // Assert
    expect(result).toBe(true)
    expect(mockAuthService.checkUserRole).not.toHaveBeenCalled()
  })

  it("should throw ForbiddenException when user not authenticated", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue(["admin"])

    mockContext.switchToHttp = jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: null, // No user
      }),
    })

    // Act & Assert
    await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException)
    await expect(guard.canActivate(mockContext)).rejects.toThrow("User not authenticated")
  })

  it("should allow access when user has ANY of multiple required roles", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue(["admin", "moderator"])
    mockAuthService.checkUserRole
      .mockResolvedValueOnce(false) // admin: false
      .mockResolvedValueOnce(true) // moderator: true

    // Act
    const result = await guard.canActivate(mockContext)

    // Assert
    expect(result).toBe(true)
    expect(mockAuthService.checkUserRole).toHaveBeenCalledTimes(2)
    expect(mockAuthService.checkUserRole).toHaveBeenCalledWith("user-123", "admin")
    expect(mockAuthService.checkUserRole).toHaveBeenCalledWith("user-123", "moderator")
  })

  it("should correctly read metadata from decorator", async () => {
    // Arrange
    const handler = jest.fn()
    const controller = jest.fn()
    mockContext.getHandler = jest.fn().mockReturnValue(handler)
    mockContext.getClass = jest.fn().mockReturnValue(controller)

    mockReflector.getAllAndOverride.mockReturnValue(["user"])
    mockAuthService.checkUserRole.mockResolvedValue(true)

    // Act
    await guard.canActivate(mockContext)

    // Assert
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(REQUIRE_ROLES_KEY, [
      handler,
      controller,
    ])
  })

  it("should handle service errors gracefully (deny access)", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue(["admin"])
    mockAuthService.checkUserRole.mockRejectedValue(new Error("Database error"))

    // Act & Assert
    await expect(guard.canActivate(mockContext)).rejects.toThrow(Error)
  })
})
