import { CommandHandler, EventBus } from "@nestjs/cqrs"
import { ForbiddenException, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { ChangePasswordCommand } from "./command"
import { IUserRepository } from "@account/business/repositories"
import { User } from "@account/business/entities"
import { ValidationException } from "@shared/business/exceptions"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler extends AuditableCommandHandler<ChangePasswordCommand, true> {
  constructor(
    private readonly repository: IUserRepository,
    eventBus: EventBus,
  ) {
    super(eventBus)
  }

  protected getAction() {
    return "change-password"
  }
  protected getEntityType() {
    return "User"
  }
  protected getEntityId(command: ChangePasswordCommand) {
    return command.userId
  }
  protected getPerformedBy(command: ChangePasswordCommand) {
    return command.userId
  }

  protected async executeCommand(
    command: ChangePasswordCommand,
  ): Promise<Result<true, HandlerError>> {
    // 1. Load user entity (needed for comparePassword)
    const userResult = await this.repository.findById(command.userId)
    if (!userResult.isOk) return failure(new InternalServerErrorException(userResult.error))
    if (!userResult.value) return failure(new NotFoundException("User not found"))

    const user = userResult.value

    // 2. Verify current password
    if (!user.comparePassword(command.dto.current_password)) {
      return failure(new ForbiddenException("Current password is incorrect"))
    }

    // 3. Re-create entity with new password (User.instance handles bcrypt hashing + confirm check)
    const updated = User.instance(
      { ...user, password: command.dto.new_password },
      command.dto.repassword,
    )
    if (!updated.isOk) return failure(new ValidationException(updated.error))

    // 4. Persist
    const saveResult = await this.repository.save(updated.value)
    if (!saveResult.isOk) return failure(new InternalServerErrorException(saveResult.error))

    return success(true)
  }
}
