import { CommandHandler } from "@nestjs/cqrs"
import { EventBus } from "@nestjs/cqrs"
import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { IRoleRepository } from "@authorization/business/repositories"
import { IUserRepository } from "@account/business/repositories"
import { UserRole } from "@authorization/business/entities"
import { AssignRoleToUserCommand } from "./command"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { Status } from "@database/prisma/generated-client"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(AssignRoleToUserCommand)
export class AssignRoleToUserHandler extends AuditableCommandHandler<
  AssignRoleToUserCommand,
  UserRole
> {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly userRepository: IUserRepository,
    eventBus: EventBus,
  ) {
    super(eventBus)
  }

  protected getAction() {
    return "assign-role-to-user"
  }
  protected getEntityType() {
    return "UserRole"
  }
  protected getEntityId(_: AssignRoleToUserCommand, value: UserRole) {
    return value.id
  }
  protected getPerformedBy(command: AssignRoleToUserCommand) {
    return command.data.assigned_by
  }
  protected getSafePayload(command: AssignRoleToUserCommand) {
    return {
      user_id: command.data.user_id,
      role_id: command.data.role_id,
      expires_at: command.data.expires_at ?? null,
    }
  }

  protected async executeCommand(
    command: AssignRoleToUserCommand,
  ): Promise<Result<UserRole, HandlerError>> {
    const userResult = await this.userRepository.findById(command.data.user_id)
    if (!userResult.isOk) {
      return failure(new InternalServerErrorException(userResult.error))
    }
    if (!userResult.value) {
      return failure(new NotFoundException("User not found"))
    }

    const roleResult = await this.roleRepository.findById(command.data.role_id)
    if (!roleResult.isOk) {
      return failure(new InternalServerErrorException(roleResult.error))
    }
    if (!roleResult.value) {
      return failure(new NotFoundException("Role not found"))
    }

    if (command.data.expires_at && new Date(command.data.expires_at) < new Date()) {
      return failure(new ConflictException("Expiration date must be in the future"))
    }

    const userRoleResult = UserRole.instance({
      user_id: command.data.user_id,
      role_id: command.data.role_id,
      assigned_by: command.data.assigned_by || null,
      assigned_at: new Date(),
      expires_at: command.data.expires_at ? new Date(command.data.expires_at) : null,
      status: Status.ACTIVE,
    })

    if (!userRoleResult.isOk) {
      return failure(
        new InternalServerErrorException(userRoleResult.error, "Failed to create user role entity"),
      )
    }

    const assignResult = await this.roleRepository.assignRoleToUser(userRoleResult.value)
    if (!assignResult.isOk) {
      return failure(
        new ConflictException(assignResult.error.assignment?.[0] || "Failed to assign role"),
      )
    }

    return success(assignResult.value)
  }
}
