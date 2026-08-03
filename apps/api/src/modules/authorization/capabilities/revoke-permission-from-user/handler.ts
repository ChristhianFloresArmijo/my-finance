import { CommandHandler } from "@nestjs/cqrs"
import { EventBus } from "@nestjs/cqrs"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { IUserPermissionRepository } from "@authorization/business/repositories"
import { IUserRepository } from "@account/business/repositories"
import { UserPermission } from "@authorization/business/entities"
import { RevokePermissionFromUserCommand } from "./command"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(RevokePermissionFromUserCommand)
export class RevokePermissionFromUserHandler extends AuditableCommandHandler<RevokePermissionFromUserCommand, UserPermission> {
  constructor(
    private readonly userPermissionRepository: IUserPermissionRepository,
    private readonly userRepository: IUserRepository,
    eventBus: EventBus,
  ) {
    super(eventBus)
  }

  protected getAction() { return "revoke-permission-from-user" }
  protected getEntityType() { return "UserPermission" }
  protected getSafePayload(command: RevokePermissionFromUserCommand) {
    return { user_id: command.userId, permission_id: command.permissionId }
  }

  protected async executeCommand(command: RevokePermissionFromUserCommand): Promise<Result<UserPermission, HandlerError>> {
    const userResult = await this.userRepository.findById(command.userId)
    if (!userResult.isOk) {
      return failure(new InternalServerErrorException(userResult.error))
    }
    if (!userResult.value) {
      return failure(new NotFoundException("User not found"))
    }

    const revokeResult = await this.userPermissionRepository.revokePermissionFromUser(command.userId, command.permissionId)
    if (!revokeResult.isOk) {
      return failure(new NotFoundException(revokeResult.error.assignment?.[0] || "Assignment not found"))
    }

    return success(revokeResult.value)
  }
}
