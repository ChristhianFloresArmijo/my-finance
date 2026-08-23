import { CommandHandler, EventBus } from "@nestjs/cqrs"
import { ForbiddenException, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { DeleteAccountCommand } from "./command"
import { IUserRepository } from "@account/business/repositories"
import { IRefreshTokenRepository } from "@auth/business/repositories"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(DeleteAccountCommand)
export class DeleteAccountHandler extends AuditableCommandHandler<DeleteAccountCommand, true> {
  constructor(
    private readonly repository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    eventBus: EventBus,
  ) {
    super(eventBus)
  }

  protected getAction() {
    return "delete-account"
  }
  protected getEntityType() {
    return "User"
  }
  protected getEntityId(command: DeleteAccountCommand) {
    return command.userId
  }
  protected getPerformedBy(command: DeleteAccountCommand) {
    return command.userId
  }

  protected async executeCommand(
    command: DeleteAccountCommand,
  ): Promise<Result<true, HandlerError>> {
    // 1. Load user entity (needed for comparePassword)
    const userResult = await this.repository.findById(command.userId)
    if (!userResult.isOk) return failure(new InternalServerErrorException(userResult.error))
    if (!userResult.value) return failure(new NotFoundException("User not found"))

    // 2. Verify password
    if (!userResult.value.comparePassword(command.password)) {
      return failure(new ForbiddenException("Incorrect password"))
    }

    // 3. Soft-delete user
    const deleteResult = await this.repository.softDelete(command.userId)
    if (!deleteResult.isOk) return failure(new InternalServerErrorException(deleteResult.error))

    // 4. Revoke all active sessions
    const revokeResult = await this.refreshTokenRepository.revokeAllForUser(command.userId)
    if (!revokeResult.isOk) return failure(new InternalServerErrorException(revokeResult.error))

    return success(true)
  }
}
