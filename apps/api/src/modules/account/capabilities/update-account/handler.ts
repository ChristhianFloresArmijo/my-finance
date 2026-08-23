import { CommandHandler, EventBus } from "@nestjs/cqrs"
import { InternalServerErrorException } from "@nestjs/common"
import { UpdateAccountCommand } from "./command"
import { IUserRepository } from "@account/business/repositories"
import { failure, HandlerError, Result } from "@shared/business/utils/error-handling"
import { User } from "@account/business/entities"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(UpdateAccountCommand)
export class UpdateAccountHandler extends AuditableCommandHandler<UpdateAccountCommand, User> {
  constructor(
    private readonly repository: IUserRepository,
    eventBus: EventBus,
  ) {
    super(eventBus)
  }

  protected getAction() {
    return "update-account"
  }
  protected getEntityType() {
    return "User"
  }
  protected getEntityId(command: UpdateAccountCommand) {
    return command.userId
  }
  protected getPerformedBy(command: UpdateAccountCommand) {
    return command.userId
  }
  protected getSafePayload(command: UpdateAccountCommand) {
    const { first_name, last_name, email } = command.dto
    return { first_name, last_name, email: email ? "updated" : undefined }
  }

  protected async executeCommand(
    command: UpdateAccountCommand,
  ): Promise<Result<User, HandlerError>> {
    const data: Partial<Pick<User, "first_name" | "last_name" | "email">> = {}
    if (command.dto.first_name) data.first_name = command.dto.first_name
    if (command.dto.last_name) data.last_name = command.dto.last_name
    if (command.dto.email) data.email = command.dto.email.toLowerCase()

    const result = await this.repository.updateIdentity(command.userId, data)
    if (!result.isOk) return failure(new InternalServerErrorException(result.error))

    return result
  }
}
