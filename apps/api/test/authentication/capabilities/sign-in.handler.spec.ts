import { Test, TestingModule } from "@nestjs/testing"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import { CommandBus, QueryBus } from "@nestjs/cqrs"
import { UnauthorizedException, InternalServerErrorException } from "@nestjs/common"
import { SignInHandler } from "@auth/capabilities/sign-in/handler"
import { SignInCommand } from "@auth/capabilities/sign-in/command"
import { IUserRepository } from "@account/business/repositories"
import { PrismaService } from "@shared/integration/services/prisma.service"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockUser } from "../../helpers/mock-factories"

describe("SignInHandler", () => {
  let handler: SignInHandler
  let mockCommandBus: jest.Mocked<Pick<CommandBus, "execute">>
  let mockQueryBus: jest.Mocked<Pick<QueryBus, "execute">>
  let mockPrismaUser: { update: jest.Mock; findUnique: jest.Mock }

  const TOKEN_PAIR = { access_token: "access-tok", refresh_token: "refresh-tok" }
  const PENDING_TOKEN = "pending-jwt"

  beforeEach(async () => {
    mockCommandBus = { execute: jest.fn() }
    mockQueryBus = { execute: jest.fn() }
    mockPrismaUser = { update: jest.fn().mockResolvedValue({}), findUnique: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignInHandler,
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: QueryBus, useValue: mockQueryBus },
        { provide: IUserRepository, useValue: {} },
        { provide: PrismaService, useValue: { user: mockPrismaUser } },
        { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue(PENDING_TOKEN) } },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue("secret") } },
      ],
    }).compile()

    handler = module.get(SignInHandler)
  })

  afterEach(() => jest.clearAllMocks())

  // ─── Normal sign-in (2FA off) ─────────────────────────────────────────────

  it("returns token pair when credentials valid and 2FA disabled", async () => {
    const user = createMockUser()
    mockQueryBus.execute.mockResolvedValueOnce(success(user))
    mockPrismaUser.findUnique.mockResolvedValueOnce({ totp_enabled: false })
    mockCommandBus.execute.mockResolvedValueOnce(success(TOKEN_PAIR))

    const result = await handler.execute(new SignInCommand("user@example.com", "pass"))

    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.access_token).toBe("access-tok")
      expect("requires_2fa" in result.value).toBe(false)
    }
    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1)
  })

  it("returns failure when credentials are invalid", async () => {
    mockQueryBus.execute.mockResolvedValueOnce(
      failure(new UnauthorizedException("Invalid credentials")),
    )

    const result = await handler.execute(new SignInCommand("bad@example.com", "wrong"))

    expect(result.isOk).toBe(false)
    expect(mockCommandBus.execute).not.toHaveBeenCalled()
  })

  it("returns failure when token generation fails", async () => {
    const user = createMockUser()
    mockQueryBus.execute.mockResolvedValueOnce(success(user))
    mockPrismaUser.findUnique.mockResolvedValueOnce({ totp_enabled: false })
    mockCommandBus.execute.mockResolvedValueOnce(
      failure(new InternalServerErrorException("Token error")),
    )

    const result = await handler.execute(new SignInCommand("user@example.com", "pass"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(InternalServerErrorException)
  })

  it("updates last_login on successful sign-in", async () => {
    const user = createMockUser()
    mockQueryBus.execute.mockResolvedValueOnce(success(user))
    mockPrismaUser.findUnique.mockResolvedValueOnce({ totp_enabled: false })
    mockCommandBus.execute.mockResolvedValueOnce(success(TOKEN_PAIR))

    await handler.execute(new SignInCommand("user@example.com", "pass"))

    expect(mockPrismaUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: expect.objectContaining({ last_login: expect.any(Date) }),
      }),
    )
  })

  it("passes validated user to GenerateTokenPairCommand", async () => {
    const user = createMockUser()
    mockQueryBus.execute.mockResolvedValueOnce(success(user))
    mockPrismaUser.findUnique.mockResolvedValueOnce({ totp_enabled: false })
    mockCommandBus.execute.mockResolvedValueOnce(success(TOKEN_PAIR))

    await handler.execute(new SignInCommand("user@example.com", "pass"))

    expect(mockCommandBus.execute).toHaveBeenCalledWith(expect.objectContaining({ user }))
  })

  // ─── 2FA sign-in path ─────────────────────────────────────────────────────

  it("returns requires_2fa with pending token when TOTP is enabled", async () => {
    const user = createMockUser()
    mockQueryBus.execute.mockResolvedValueOnce(success(user))
    mockPrismaUser.findUnique.mockResolvedValueOnce({ totp_enabled: true })

    const result = await handler.execute(new SignInCommand("user@example.com", "pass"))

    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.requires_2fa).toBe(true)
      expect((result.value as any).totp_pending_token).toBe(PENDING_TOKEN)
      expect("access_token" in result.value).toBe(false)
    }
    // Token pair must NOT be issued yet
    expect(mockCommandBus.execute).not.toHaveBeenCalled()
  })

  it("signs pending token with derived secret so JwtAuthGuard rejects it", async () => {
    const user = createMockUser()
    mockQueryBus.execute.mockResolvedValueOnce(success(user))
    mockPrismaUser.findUnique.mockResolvedValueOnce({ totp_enabled: true })

    const jwtService = handler["jwtService"] as jest.Mocked<JwtService>
    await handler.execute(new SignInCommand("user@example.com", "pass"))

    expect(jwtService.sign).toHaveBeenCalledWith(
      { sub: user.id, type: "totp_pending" },
      expect.objectContaining({ secret: "secret:totp_pending", expiresIn: "5m" }),
    )
  })

  it("does not expose user details in auth failure messages", async () => {
    mockQueryBus.execute.mockResolvedValueOnce(
      failure(new UnauthorizedException("Invalid email or password")),
    )

    const result = await handler.execute(new SignInCommand("user@example.com", "wrong"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error.message).not.toContain("user not found")
      expect(result.error.message).not.toContain("password incorrect")
    }
  })
})
