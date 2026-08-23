import { Test, TestingModule } from "@nestjs/testing"
import { EventBus } from "@nestjs/cqrs"
import { InternalServerErrorException } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { CreateUserHandler } from "@account/capabilities/create-user/handler"
import { CreateUserCommand } from "@account/capabilities/create-user/command"
import {
  IUserRepository,
  IUserProfileRepository,
  IUserPreferencesRepository,
} from "@account/business/repositories"
import { IRoleRepository } from "@authorization/business/repositories"
import { MailService } from "@shared/integration/mail/MailService"
import { Status } from "@database/prisma/generated-client"
import { success, failure } from "@shared/business/utils/error-handling"
import { ValidationException } from "@shared/business/exceptions"
import { createMockUser } from "../../helpers/mock-factories"

const VALID_DATA = {
  first_name: "Alice",
  last_name: "Smith",
  email: "alice@example.com",
  password: "SecurePass123!",
  repassword: "SecurePass123!",
  status: Status.ACTIVE,
}

describe("CreateUserHandler", () => {
  let handler: CreateUserHandler
  let mockUserRepo: jest.Mocked<IUserRepository>
  let mockRoleRepo: jest.Mocked<IRoleRepository>
  let mockProfileRepo: jest.Mocked<IUserProfileRepository>
  let mockPrefsRepo: jest.Mocked<IUserPreferencesRepository>
  let mockMailService: jest.Mocked<MailService>
  let mockEventBus: jest.Mocked<Pick<EventBus, "publish">>

  beforeEach(async () => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      storeVerificationToken: jest.fn().mockResolvedValue(success(undefined)),
    } as any
    mockRoleRepo = {
      findById: jest.fn(),
      findByName: jest.fn(),
      assignRoleToUser: jest.fn(),
    } as any
    mockProfileRepo = { upsert: jest.fn().mockResolvedValue(success({})) } as any
    mockPrefsRepo = { upsert: jest.fn().mockResolvedValue(success({})) } as any
    mockMailService = {
      sendEmailVerification: jest.fn().mockResolvedValue(undefined),
      sendWelcomeWithCredentials: jest.fn().mockResolvedValue(undefined),
    } as any
    mockEventBus = { publish: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserHandler,
        { provide: IUserRepository, useValue: mockUserRepo },
        { provide: IRoleRepository, useValue: mockRoleRepo },
        { provide: IUserProfileRepository, useValue: mockProfileRepo },
        { provide: IUserPreferencesRepository, useValue: mockPrefsRepo },
        { provide: MailService, useValue: mockMailService },
        { provide: EventBus, useValue: mockEventBus },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(null) } },
      ],
    }).compile()

    handler = module.get(CreateUserHandler)
  })

  afterEach(() => jest.clearAllMocks())

  // ─── Happy path ───────────────────────────────────────────────────────────

  it("creates user and returns it when data is valid", async () => {
    const mockUser = createMockUser({ email: VALID_DATA.email })
    mockUserRepo.findByEmail.mockResolvedValueOnce(success(null))
    mockUserRepo.save.mockResolvedValueOnce(success(mockUser))

    const result = await handler.execute(new CreateUserCommand(VALID_DATA))

    expect(result.isOk).toBe(true)
    if (result.isOk) expect(result.value.email).toBe(VALID_DATA.email)
    expect(mockUserRepo.save).toHaveBeenCalledTimes(1)
  })

  it("emits AuditEvent after successful creation", async () => {
    const mockUser = createMockUser({ email: VALID_DATA.email })
    mockUserRepo.findByEmail.mockResolvedValueOnce(success(null))
    mockUserRepo.save.mockResolvedValueOnce(success(mockUser))

    await handler.execute(new CreateUserCommand(VALID_DATA))

    expect(mockEventBus.publish).toHaveBeenCalledTimes(1)
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ action: "create-user", entityType: "User" }),
    )
  })

  it("sends verification email when send_credentials is false", async () => {
    const mockUser = createMockUser({ email: VALID_DATA.email })
    mockUserRepo.findByEmail.mockResolvedValueOnce(success(null))
    mockUserRepo.save.mockResolvedValueOnce(success(mockUser))

    await handler.execute(new CreateUserCommand({ ...VALID_DATA, send_credentials: false }))

    // Fire-and-forget — give the microtask queue a tick
    await Promise.resolve()
    expect(mockMailService.sendEmailVerification).toHaveBeenCalled()
    expect(mockMailService.sendWelcomeWithCredentials).not.toHaveBeenCalled()
  })

  it("sends credentials email when send_credentials is true", async () => {
    const mockUser = createMockUser({ email: VALID_DATA.email })
    mockUserRepo.findByEmail.mockResolvedValueOnce(success(null))
    mockUserRepo.save.mockResolvedValueOnce(success(mockUser))

    await handler.execute(new CreateUserCommand({ ...VALID_DATA, send_credentials: true }))

    await Promise.resolve()
    expect(mockMailService.sendWelcomeWithCredentials).toHaveBeenCalled()
    expect(mockMailService.sendEmailVerification).not.toHaveBeenCalled()
  })

  it("assigns provided role IDs", async () => {
    const mockUser = createMockUser({ id: "user-1", email: VALID_DATA.email })
    const mockRole = { id: "role-1", name: "admin" }
    mockUserRepo.findByEmail.mockResolvedValueOnce(success(null))
    mockUserRepo.save.mockResolvedValueOnce(success(mockUser))
    mockRoleRepo.findById.mockResolvedValueOnce(success(mockRole as any))
    mockRoleRepo.assignRoleToUser.mockResolvedValueOnce(success({} as any))

    await handler.execute(new CreateUserCommand({ ...VALID_DATA, role_ids: ["role-1"] }))

    expect(mockRoleRepo.findById).toHaveBeenCalledWith("role-1")
    expect(mockRoleRepo.assignRoleToUser).toHaveBeenCalledTimes(1)
  })

  // ─── Guard cases ──────────────────────────────────────────────────────────

  it("returns failure when email already exists", async () => {
    mockUserRepo.findByEmail.mockResolvedValueOnce(success(createMockUser()))

    const result = await handler.execute(new CreateUserCommand(VALID_DATA))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(InternalServerErrorException)
    expect(mockUserRepo.save).not.toHaveBeenCalled()
  })

  it("returns failure when entity validation fails (bad password match)", async () => {
    mockUserRepo.findByEmail.mockResolvedValueOnce(success(null))

    const result = await handler.execute(
      new CreateUserCommand({ ...VALID_DATA, repassword: "DifferentPass!" }),
    )

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(ValidationException)
    expect(mockUserRepo.save).not.toHaveBeenCalled()
  })

  it("returns failure when repository save fails", async () => {
    mockUserRepo.findByEmail.mockResolvedValueOnce(success(null))
    mockUserRepo.save.mockResolvedValueOnce(failure({ message: "DB down" } as any))

    const result = await handler.execute(new CreateUserCommand(VALID_DATA))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(InternalServerErrorException)
  })

  it("returns failure when email lookup fails", async () => {
    mockUserRepo.findByEmail.mockResolvedValueOnce(failure({ message: "DB error" } as any))

    const result = await handler.execute(new CreateUserCommand(VALID_DATA))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(InternalServerErrorException)
  })

  it("skips non-existent role but still creates user (best-effort)", async () => {
    const mockUser = createMockUser({ email: VALID_DATA.email })
    mockUserRepo.findByEmail.mockResolvedValueOnce(success(null))
    mockUserRepo.save.mockResolvedValueOnce(success(mockUser))
    mockRoleRepo.findById.mockResolvedValueOnce(success(null))
    jest.spyOn(console, "warn").mockImplementation(() => {})

    const result = await handler.execute(
      new CreateUserCommand({ ...VALID_DATA, role_ids: ["ghost-role"] }),
    )

    expect(result.isOk).toBe(true)
    expect(mockRoleRepo.assignRoleToUser).not.toHaveBeenCalled()
    jest.restoreAllMocks()
  })
})
