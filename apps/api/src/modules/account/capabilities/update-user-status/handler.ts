import { CommandHandler, EventBus } from "@nestjs/cqrs"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { UpdateUserStatusCommand } from "./command"
import { IUserRepository } from "@account/business/repositories"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(UpdateUserStatusCommand)
export class UpdateUserStatusHandler extends AuditableCommandHandler<
  UpdateUserStatusCommand,
  true
> {
  constructor(
    private readonly repository: IUserRepository,
    eventBus: EventBus,
  ) {
    super(eventBus)
  }

  protected getAction() {
    return "update-user-status"
  }
  protected getEntityType() {
    return "User"
  }
  protected getEntityId(command: UpdateUserStatusCommand) {
    return command.userId
  }
  protected getSafePayload(command: UpdateUserStatusCommand) {
    return { status: command.status }
  }

  protected async executeCommand(
    command: UpdateUserStatusCommand,
  ): Promise<Result<true, HandlerError>> {
    const userResult = await this.repository.findById(command.userId)
    if (!userResult.isOk) return failure(new InternalServerErrorException(userResult.error))
    if (!userResult.value) return failure(new NotFoundException("User not found"))

    const updateResult = await this.repository.updateStatus(command.userId, command.status)
    if (!updateResult.isOk) return failure(new InternalServerErrorException(updateResult.error))

    return success(true)
  }
}
