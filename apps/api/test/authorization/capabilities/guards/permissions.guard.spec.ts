import { ExecutionContext, ForbiddenException } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { PermissionsGuard } from "@authorization/capabilities/guards/permissions.guard"
import { AuthorizationService } from "@authorization/business/services/authorization.service"
import { REQUIRE_PERMISSIONS_KEY } from "@authorization/presentation/decorators/require-permission.decorator"

describe("PermissionsGuard", () => {
  let guard: PermissionsGuard
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

    guard = new PermissionsGuard(mockReflector, mockAuthService)

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

  it("should allow access when user has required permission", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue(["users:read"])
    mockAuthService.checkUserPermission.mockResolvedValue(true)

    // Act
    const result = await guard.canActivate(mockContext)

    // Assert
    expect(result).toBe(true)
    expect(mockAuthService.checkUserPermission).toHaveBeenCalledWith("user-123", "users", "read")
  })

  it("should deny access when user lacks permission", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue(["users:delete"])
    mockAuthService.checkUserPermission.mockResolvedValue(false)

    // Act & Assert
    await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException)
    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      "Missing required permission: users:delete",
    )
  })

  it("should allow access when no permissions required (no decorator)", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue(undefined)

    // Act
    const result = await guard.canActivate(mockContext)

    // Assert
    expect(result).toBe(true)
    expect(mockAuthService.checkUserPermission).not.toHaveBeenCalled()
  })

  it("should allow access when empty permissions array", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue([])

    // Act
    const result = await guard.canActivate(mockContext)

    // Assert
    expect(result).toBe(true)
    expect(mockAuthService.checkUserPermission).not.toHaveBeenCalled()
  })

  it("should throw ForbiddenException when user not authenticated", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue(["users:read"])

    mockContext.switchToHttp = jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        user: null, // No user
      }),
    })

    // Act & Assert
    await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException)
    await expect(guard.canActivate(mockContext)).rejects.toThrow("User not authenticated")
  })

  it("should require ALL permissions when multiple are specified", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue(["users:read", "users:write"])
    mockAuthService.checkUserPermission.mockResolvedValue(true)

    // Act
    const result = await guard.canActivate(mockContext)

    // Assert
    expect(result).toBe(true)
    expect(mockAuthService.checkUserPermission).toHaveBeenCalledTimes(2)
    expect(mockAuthService.checkUserPermission).toHaveBeenCalledWith("user-123", "users", "read")
    expect(mockAuthService.checkUserPermission).toHaveBeenCalledWith("user-123", "users", "write")
  })

  it("should correctly read metadata from decorator", async () => {
    // Arrange
    const handler = jest.fn()
    const controller = jest.fn()
    mockContext.getHandler = jest.fn().mockReturnValue(handler)
    mockContext.getClass = jest.fn().mockReturnValue(controller)

    mockReflector.getAllAndOverride.mockReturnValue(["posts:create"])
    mockAuthService.checkUserPermission.mockResolvedValue(true)

    // Act
    await guard.canActivate(mockContext)

    // Assert
    expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(REQUIRE_PERMISSIONS_KEY, [
      handler,
      controller,
    ])
  })

  it("should skip invalid permission format (no colon separator)", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue(["invalidformat", "users:read"])
    mockAuthService.checkUserPermission.mockResolvedValue(true)

    // Act
    const result = await guard.canActivate(mockContext)

    // Assert
    expect(result).toBe(true)
    // Should only check the valid permission
    expect(mockAuthService.checkUserPermission).toHaveBeenCalledTimes(1)
    expect(mockAuthService.checkUserPermission).toHaveBeenCalledWith("user-123", "users", "read")
  })

  it("should handle service errors by propagating them", async () => {
    // Arrange
    mockReflector.getAllAndOverride.mockReturnValue(["users:read"])
    mockAuthService.checkUserPermission.mockRejectedValue(new Error("Database error"))

    // Act & Assert
    await expect(guard.canActivate(mockContext)).rejects.toThrow(Error)
  })
})
