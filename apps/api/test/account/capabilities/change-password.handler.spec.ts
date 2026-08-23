import { Test, TestingModule } from "@nestjs/testing"
import { EventBus } from "@nestjs/cqrs"
import { ForbiddenException, NotFoundException, InternalServerErrorException } from "@nestjs/common"
import { ChangePasswordHandler } from "@account/capabilities/change-password/handler"
import { ChangePasswordCommand } from "@account/capabilities/change-password/command"
import { IUserRepository } from "@account/business/repositories"
import { success, failure } from "@shared/business/utils/error-handling"
import { createMockUser } from "../../helpers/mock-factories"

const USER_ID = "user-123"

describe("ChangePasswordHandler", () => {
  let handler: ChangePasswordHandler
  let mockUserRepo: jest.Mocked<IUserRepository>
  let mockEventBus: jest.Mocked<Pick<EventBus, "publish">>

  const makeCommand = (current: string, next: string, confirm = next) =>
    new ChangePasswordCommand(USER_ID, {
      current_password: current,
      new_password: next,
      repassword: confirm,
    })

  beforeEach(async () => {
    mockUserRepo = {
      findById: jest.fn(),
      save: jest.fn(),
    } as any
    mockEventBus = { publish: jest.fn() }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangePasswordHandler,
        { provide: IUserRepository, useValue: mockUserRepo },
        { provide: EventBus, useValue: mockEventBus },
      ],
    }).compile()

    handler = module.get(ChangePasswordHandler)
  })

  afterEach(() => jest.clearAllMocks())

  // ─── Happy path ───────────────────────────────────────────────────────────

  it("returns success when current password is correct and new passwords match", async () => {
    const user = createMockUser({ id: USER_ID })
    // comparePassword is on the entity — mock it to return true
    jest.spyOn(user, "comparePassword").mockReturnValue(true)
    mockUserRepo.findById.mockResolvedValueOnce(success(user))
    mockUserRepo.save.mockResolvedValueOnce(success(user))

    const result = await handler.execute(makeCommand("OldPass1!", "NewPass1!"))

    expect(result.isOk).toBe(true)
  })

  it("emits AuditEvent on success", async () => {
    const user = createMockUser({ id: USER_ID })
    jest.spyOn(user, "comparePassword").mockReturnValue(true)
    mockUserRepo.findById.mockResolvedValueOnce(success(user))
    mockUserRepo.save.mockResolvedValueOnce(success(user))

    await handler.execute(makeCommand("OldPass1!", "NewPass1!"))

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ action: "change-password", entityType: "User" }),
    )
  })

  // ─── Guard cases ──────────────────────────────────────────────────────────

  it("returns failure when user is not found", async () => {
    mockUserRepo.findById.mockResolvedValueOnce(success(null))

    const result = await handler.execute(makeCommand("OldPass1!", "NewPass1!"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(NotFoundException)
  })

  it("returns failure when current password is wrong", async () => {
    const user = createMockUser({ id: USER_ID })
    jest.spyOn(user, "comparePassword").mockReturnValue(false)
    mockUserRepo.findById.mockResolvedValueOnce(success(user))

    const result = await handler.execute(makeCommand("WrongPass!", "NewPass1!"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(ForbiddenException)
    expect(mockUserRepo.save).not.toHaveBeenCalled()
  })

  it("returns failure when new password and confirm do not match", async () => {
    const user = createMockUser({ id: USER_ID })
    jest.spyOn(user, "comparePassword").mockReturnValue(true)
    mockUserRepo.findById.mockResolvedValueOnce(success(user))

    const result = await handler.execute(makeCommand("OldPass1!", "NewPass1!", "Mismatch1!"))

    expect(result.isOk).toBe(false)
    expect(mockUserRepo.save).not.toHaveBeenCalled()
  })

  it("returns failure when repository lookup errors", async () => {
    mockUserRepo.findById.mockResolvedValueOnce(failure({ message: "DB error" } as any))

    const result = await handler.execute(makeCommand("OldPass1!", "NewPass1!"))

    expect(result.isOk).toBe(false)
    if (!result.isOk) expect(result.error).toBeInstanceOf(InternalServerErrorException)
  })

  it("does not emit audit event on failure", async () => {
    mockUserRepo.findById.mockResolvedValueOnce(success(null))

    await handler.execute(makeCommand("OldPass1!", "NewPass1!"))

    expect(mockEventBus.publish).not.toHaveBeenCalled()
  })
})
