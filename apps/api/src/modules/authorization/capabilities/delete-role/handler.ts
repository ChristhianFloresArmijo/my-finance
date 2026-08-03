import { CommandHandler } from "@nestjs/cqrs"
import { EventBus } from "@nestjs/cqrs"
import { InternalServerErrorException, NotFoundException, ForbiddenException } from "@nestjs/common"
import { IRoleRepository } from "@authorization/business/repositories"
import { DeleteRoleCommand } from "./command"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler extends AuditableCommandHandler<DeleteRoleCommand, boolean> {
  constructor(
    private readonly repository: IRoleRepository,
    eventBus: EventBus,
  ) {
    super(eventBus)
  }

  protected getAction() {
    return "delete-role"
  }
  protected getEntityType() {
    return "Role"
  }
  protected getEntityId(command: DeleteRoleCommand) {
    return command.id
  }
  protected getSafePayload(command: DeleteRoleCommand) {
    return { id: command.id }
  }

  protected async executeCommand(
    command: DeleteRoleCommand,
  ): Promise<Result<boolean, HandlerError>> {
    const existingRoleResult = await this.repository.findById(command.id)

    if (!existingRoleResult.isOk) {
      return failure(new InternalServerErrorException(existingRoleResult.error))
    }
    if (!existingRoleResult.value) {
      return failure(new NotFoundException("Role not found"))
    }

    if (existingRoleResult.value.is_system) {
      return failure(new ForbiddenException("Cannot delete system roles"))
    }

    const roleUsersResult = await this.repository.getRoleUsers(command.id)
    if (!roleUsersResult.isOk) {
      return failure(new InternalServerErrorException(roleUsersResult.error))
    }
    if (roleUsersResult.value.length > 0) {
      return failure(
        new ForbiddenException("Cannot delete a role that is assigned to active users"),
      )
    }

    const deleteResult = await this.repository.delete(command.id)
    if (!deleteResult.isOk) {
      return failure(new InternalServerErrorException(deleteResult.error))
    }

    return success(true)
  }
}
