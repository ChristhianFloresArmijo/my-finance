import { Test, TestingModule } from "@nestjs/testing"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import { CommandBus } from "@nestjs/cqrs"
import { UnauthorizedException } from "@nestjs/common"
import { VerifyTotpLoginHandler } from "@auth/capabilities/verify-totp-login/handler"
import { VerifyTotpLoginCommand } from "@auth/capabilities/verify-totp-login/command"
import { TotpService } from "@auth/integration/services/totp.service"
import { PrismaService } from "@shared/integration/services/prisma.service"
import { success, failure } from "@shared/business/utils/error-handling"

const VALID_USER_ID = "user-123"
const JWT_SECRET = "test-secret"
const PENDING_SECRET = `${JWT_SECRET}:totp_pending`

describe("VerifyTotpLoginHandler", () => {
  let handler: VerifyTotpLoginHandler
  let mockPrismaUser: { findUnique: jest.Mock }
  let mockPrismaRecovery: { findMany: jest.Mock; update: jest.Mock }
  let mockTotpService: jest.Mocked<TotpService>
  let mockJwtService: jest.Mocked<JwtService>
  let mockCommandBus: jest.Mocked<Pick<CommandBus, "execute">>

  const makeValidPayload = () => ({ sub: VALID_USER_ID, type: "totp_pending" })

  beforeEach(async () => {
    mockPrismaUser = { findUnique: jest.fn() }
    mockPrismaRecovery = { findMany: jest.fn(), update: jest.fn().mockResolvedValue({}) }
    mockTotpService = {
      verifyCode: jest.fn(),
      verifyRecoveryCode: jest.fn(),
      generateSecret: jest.fn(),
      generateUri: jest.fn(),
      generateRecoveryCodes: jest.fn(),
      hashRecoveryCode: jest.fn(),
    } as any
    mockJwtService = { verify: jest.fn(), sign: jest.fn() } as any
    mockCommandBus = { execute: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyTotpLoginHandler,
        {
          provide: PrismaService,
          useValue: { user: mockPrismaUser, userRecoveryCode: mockPrismaRecovery },
        },
        { provide: TotpService, useValue: mockTotpService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(JWT_SECRET) } },
        { provide: CommandBus, useValue: mockCommandBus },
      ],
    }).compile()

    handler = module.get(VerifyTotpLoginHandler)
  })

  afterEach(() => jest.clearAllMocks())

  // ─── Pending token validation ─────────────────────────────────────────────

  it("returns failure for invalid pending token", async () => {
    mockJwtService.verify.mockImplementation(() => {
      throw new Error("invalid")
    })

    const result = await handler.execute(new VerifyTotpLoginCommand("bad-token", "123456"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(UnauthorizedException)
  })

  it("returns failure when token type is not totp_pending", async () => {
    mockJwtService.verify.mockReturnValue({ sub: VALID_USER_ID, type: "access" })

    const result = await handler.execute(new VerifyTotpLoginCommand("token", "123456"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(UnauthorizedException)
  })

  it("verifies pending token using the derived secret", async () => {
    mockJwtService.verify.mockImplementation(() => {
      throw new Error("invalid")
    })

    await handler.execute(new VerifyTotpLoginCommand("tok", "123456"))

    expect(mockJwtService.verify).toHaveBeenCalledWith("tok", { secret: PENDING_SECRET })
  })

  // ─── Valid TOTP code path ─────────────────────────────────────────────────

  it("returns token pair when TOTP code is valid", async () => {
    const fullUser = { id: VALID_USER_ID, email: "u@example.com" }
    mockJwtService.verify.mockReturnValue(makeValidPayload())
    mockPrismaUser.findUnique
      .mockResolvedValueOnce({ id: VALID_USER_ID, totp_secret: "SECRET", totp_enabled: true })
      .mockResolvedValueOnce(fullUser)
    mockTotpService.verifyCode.mockReturnValue(true)
    mockCommandBus.execute.mockResolvedValueOnce(
      success({ access_token: "at", refresh_token: "rt" }),
    )

    const result = await handler.execute(new VerifyTotpLoginCommand("pending-tok", "123456"))

    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.access_token).toBe("at")
    }
    expect(mockPrismaRecovery.update).not.toHaveBeenCalled()
  })

  // ─── Recovery code path ───────────────────────────────────────────────────

  it("returns token pair when a valid recovery code is used", async () => {
    const fullUser = { id: VALID_USER_ID }
    const recoveryCodes = [
      { id: "rc-1", code_hash: "hash1" },
      { id: "rc-2", code_hash: "hash2" },
    ]
    mockJwtService.verify.mockReturnValue(makeValidPayload())
    mockPrismaUser.findUnique
      .mockResolvedValueOnce({ id: VALID_USER_ID, totp_secret: "SECRET", totp_enabled: true })
      .mockResolvedValueOnce(fullUser)
    mockTotpService.verifyCode.mockReturnValue(false)
    mockPrismaRecovery.findMany.mockResolvedValueOnce(recoveryCodes)
    mockTotpService.verifyRecoveryCode
      .mockResolvedValueOnce(false) // rc-1 doesn't match
      .mockResolvedValueOnce(true) // rc-2 matches
    mockCommandBus.execute.mockResolvedValueOnce(
      success({ access_token: "at", refresh_token: "rt" }),
    )

    const result = await handler.execute(new VerifyTotpLoginCommand("pending-tok", "ABCDE12345"))

    expect(result.isOk).toBe(true)
    // Must mark the matched recovery code as used (not delete it)
    expect(mockPrismaRecovery.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "rc-2" }, data: { used_at: expect.any(Date) } }),
    )
  })

  it("returns failure when TOTP and all recovery codes are wrong", async () => {
    mockJwtService.verify.mockReturnValue(makeValidPayload())
    mockPrismaUser.findUnique.mockResolvedValueOnce({
      id: VALID_USER_ID,
      totp_secret: "SECRET",
      totp_enabled: true,
    })
    mockTotpService.verifyCode.mockReturnValue(false)
    mockPrismaRecovery.findMany.mockResolvedValueOnce([{ id: "rc-1", code_hash: "hash1" }])
    mockTotpService.verifyRecoveryCode.mockResolvedValueOnce(false)

    const result = await handler.execute(new VerifyTotpLoginCommand("pending-tok", "WRONG"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(UnauthorizedException)
    expect(mockCommandBus.execute).not.toHaveBeenCalled()
  })

  // ─── Edge cases ───────────────────────────────────────────────────────────

  it("returns failure when 2FA is not configured on the user", async () => {
    mockJwtService.verify.mockReturnValue(makeValidPayload())
    mockPrismaUser.findUnique.mockResolvedValueOnce({
      id: VALID_USER_ID,
      totp_secret: null,
      totp_enabled: false,
    })

    const result = await handler.execute(new VerifyTotpLoginCommand("pending-tok", "123456"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(UnauthorizedException)
  })

  it("returns failure when user is not found", async () => {
    mockJwtService.verify.mockReturnValue(makeValidPayload())
    mockPrismaUser.findUnique.mockResolvedValueOnce(null)

    const result = await handler.execute(new VerifyTotpLoginCommand("pending-tok", "123456"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(UnauthorizedException)
  })
})
