import { CommandHandler } from "@nestjs/cqrs"
import { EventBus } from "@nestjs/cqrs"
import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import {
  IUserPermissionRepository,
  IPermissionRepository,
} from "@authorization/business/repositories"
import { IUserRepository } from "@account/business/repositories"
import { UserPermission } from "@authorization/business/entities"
import { AssignPermissionToUserCommand } from "./command"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { Status } from "@database/prisma/generated-client"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(AssignPermissionToUserCommand)
export class AssignPermissionToUserHandler extends AuditableCommandHandler<
  AssignPermissionToUserCommand,
  UserPermission
> {
  constructor(
    private readonly userPermissionRepository: IUserPermissionRepository,
    private readonly userRepository: IUserRepository,
    private readonly permissionRepository: IPermissionRepository,
    eventBus: EventBus,
  ) {
    super(eventBus)
  }

  protected getAction() {
    return "assign-permission-to-user"
  }
  protected getEntityType() {
    return "UserPermission"
  }
  protected getEntityId(_: AssignPermissionToUserCommand, value: UserPermission) {
    return value.id
  }
  protected getPerformedBy(command: AssignPermissionToUserCommand) {
    return command.data.assigned_by
  }
  protected getSafePayload(command: AssignPermissionToUserCommand) {
    return {
      user_id: command.data.user_id,
      permission_id: command.data.permission_id,
      expires_at: command.data.expires_at ?? null,
    }
  }

  protected async executeCommand(
    command: AssignPermissionToUserCommand,
  ): Promise<Result<UserPermission, HandlerError>> {
    const userResult = await this.userRepository.findById(command.data.user_id)
    if (!userResult.isOk) {
      return failure(new InternalServerErrorException(userResult.error))
    }
    if (!userResult.value) {
      return failure(new NotFoundException("User not found"))
    }

    const permissionResult = await this.permissionRepository.findById(command.data.permission_id)
    if (!permissionResult.isOk) {
      return failure(new InternalServerErrorException(permissionResult.error))
    }
    if (!permissionResult.value) {
      return failure(new NotFoundException("Permission not found"))
    }

    if (command.data.expires_at && new Date(command.data.expires_at) < new Date()) {
      return failure(new ConflictException("Expiration date must be in the future"))
    }

    const userPermissionResult = UserPermission.instance({
      user_id: command.data.user_id,
      permission_id: command.data.permission_id,
      assigned_by: command.data.assigned_by ?? null,
      assigned_at: new Date(),
      expires_at: command.data.expires_at ? new Date(command.data.expires_at) : null,
      status: Status.ACTIVE,
    })

    if (!userPermissionResult.isOk) {
      return failure(
        new InternalServerErrorException(
          userPermissionResult.error,
          "Failed to create user permission entity",
        ),
      )
    }

    const assignResult = await this.userPermissionRepository.assignPermissionToUser(
      userPermissionResult.value,
    )
    if (!assignResult.isOk) {
      return failure(
        new ConflictException(assignResult.error.assignment?.[0] || "Failed to assign permission"),
      )
    }

    return success(assignResult.value)
  }
}
