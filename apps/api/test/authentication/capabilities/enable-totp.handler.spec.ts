import { Test, TestingModule } from "@nestjs/testing"
import { NotFoundException, BadRequestException } from "@nestjs/common"
import { EnableTotpHandler } from "@auth/capabilities/enable-totp/handler"
import { EnableTotpCommand } from "@auth/capabilities/enable-totp/command"
import { TotpService } from "@auth/integration/services/totp.service"
import { PrismaService } from "@shared/integration/services/prisma.service"

const USER_ID = "user-abc"
const TOTP_SECRET = "JBSWY3DPEHPK3PXP"

describe("EnableTotpHandler", () => {
  let handler: EnableTotpHandler
  let mockPrismaUser: { findUnique: jest.Mock; update: jest.Mock }
  let mockPrismaRecovery: { deleteMany: jest.Mock; createMany: jest.Mock }
  let mockTotpService: jest.Mocked<TotpService>

  beforeEach(async () => {
    mockPrismaUser = { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) }
    mockPrismaRecovery = {
      deleteMany: jest.fn().mockResolvedValue({}),
      createMany: jest.fn().mockResolvedValue({}),
    }
    mockTotpService = {
      verifyCode: jest.fn(),
      generateRecoveryCodes: jest.fn().mockReturnValue(["CODE1", "CODE2", "CODE3"]),
      hashRecoveryCode: jest.fn().mockImplementation((c: string) => Promise.resolve(`hashed:${c}`)),
      verifyRecoveryCode: jest.fn(),
      generateSecret: jest.fn(),
      generateUri: jest.fn(),
    } as any

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnableTotpHandler,
        {
          provide: PrismaService,
          useValue: { user: mockPrismaUser, userRecoveryCode: mockPrismaRecovery },
        },
        { provide: TotpService, useValue: mockTotpService },
      ],
    }).compile()

    handler = module.get(EnableTotpHandler)
  })

  afterEach(() => jest.clearAllMocks())

  // ─── Happy path ───────────────────────────────────────────────────────────

  it("enables 2FA and returns recovery codes for valid code", async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce({
      id: USER_ID,
      totp_secret: TOTP_SECRET,
      totp_enabled: false,
    })
    mockTotpService.verifyCode.mockReturnValue(true)

    const result = await handler.execute(new EnableTotpCommand(USER_ID, "123456"))

    expect(result.isOk).toBe(true)
    if (result.isOk) {
      expect(result.value.recovery_codes).toEqual(["CODE1", "CODE2", "CODE3"])
    }
  })

  it("sets totp_enabled=true and totp_enabled_at in DB", async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce({
      id: USER_ID,
      totp_secret: TOTP_SECRET,
      totp_enabled: false,
    })
    mockTotpService.verifyCode.mockReturnValue(true)

    await handler.execute(new EnableTotpCommand(USER_ID, "123456"))

    expect(mockPrismaUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: USER_ID },
        data: { totp_enabled: true, totp_enabled_at: expect.any(Date) },
      }),
    )
  })

  it("clears old recovery codes before creating new ones", async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce({
      id: USER_ID,
      totp_secret: TOTP_SECRET,
      totp_enabled: false,
    })
    mockTotpService.verifyCode.mockReturnValue(true)

    await handler.execute(new EnableTotpCommand(USER_ID, "123456"))

    expect(mockPrismaRecovery.deleteMany).toHaveBeenCalledWith({ where: { user_id: USER_ID } })
    expect(mockPrismaRecovery.createMany).toHaveBeenCalled()
  })

  it("hashes recovery codes before storing them", async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce({
      id: USER_ID,
      totp_secret: TOTP_SECRET,
      totp_enabled: false,
    })
    mockTotpService.verifyCode.mockReturnValue(true)

    await handler.execute(new EnableTotpCommand(USER_ID, "123456"))

    const createManyCall = mockPrismaRecovery.createMany.mock.calls[0]?.[0]
    const storedData: Array<{ code_hash: string }> = createManyCall?.data ?? []
    // Plain codes must not be stored
    storedData.forEach((row) => {
      expect(row.code_hash).not.toBe("CODE1")
      expect(row.code_hash).not.toBe("CODE2")
      expect(row.code_hash).not.toBe("CODE3")
      expect(row.code_hash).toMatch(/^hashed:/)
    })
  })

  // ─── Guard cases ──────────────────────────────────────────────────────────

  it("returns failure when user is not found", async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce(null)

    const result = await handler.execute(new EnableTotpCommand(USER_ID, "123456"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(NotFoundException)
  })

  it("returns failure when 2FA is already enabled", async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce({
      id: USER_ID,
      totp_secret: TOTP_SECRET,
      totp_enabled: true,
    })

    const result = await handler.execute(new EnableTotpCommand(USER_ID, "123456"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(BadRequestException)
    expect(mockPrismaUser.update).not.toHaveBeenCalled()
  })

  it("returns failure when setup has not been called yet (no totp_secret)", async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce({
      id: USER_ID,
      totp_secret: null,
      totp_enabled: false,
    })

    const result = await handler.execute(new EnableTotpCommand(USER_ID, "123456"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) {
      expect(result.error).toBeInstanceOf(BadRequestException)
      expect(result.error.message).toContain("setup")
    }
  })

  it("returns failure when verification code is incorrect", async () => {
    mockPrismaUser.findUnique.mockResolvedValueOnce({
      id: USER_ID,
      totp_secret: TOTP_SECRET,
      totp_enabled: false,
    })
    mockTotpService.verifyCode.mockReturnValue(false)

    const result = await handler.execute(new EnableTotpCommand(USER_ID, "000000"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(BadRequestException)
    expect(mockPrismaUser.update).not.toHaveBeenCalled()
  })
})
