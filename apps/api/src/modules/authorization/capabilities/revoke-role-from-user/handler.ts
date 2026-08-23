import { CommandHandler } from "@nestjs/cqrs"
import { EventBus } from "@nestjs/cqrs"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { IRoleRepository } from "@authorization/business/repositories"
import { IUserRepository } from "@account/business/repositories"
import { UserRole } from "@authorization/business/entities"
import { RevokeRoleFromUserCommand } from "./command"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(RevokeRoleFromUserCommand)
export class RevokeRoleFromUserHandler extends AuditableCommandHandler<
  RevokeRoleFromUserCommand,
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
    return "revoke-role-from-user"
  }
  protected getEntityType() {
    return "UserRole"
  }
  protected getSafePayload(command: RevokeRoleFromUserCommand) {
    return { user_id: command.userId, role_id: command.roleId }
  }

  protected async executeCommand(
    command: RevokeRoleFromUserCommand,
  ): Promise<Result<UserRole, HandlerError>> {
    const userResult = await this.userRepository.findById(command.userId)
    if (!userResult.isOk) {
      return failure(new InternalServerErrorException(userResult.error))
    }
    if (!userResult.value) {
      return failure(new NotFoundException("User not found"))
    }

    const roleResult = await this.roleRepository.findById(command.roleId)
    if (!roleResult.isOk) {
      return failure(new InternalServerErrorException(roleResult.error))
    }
    if (!roleResult.value) {
      return failure(new NotFoundException("Role not found"))
    }

    const userRolesResult = await this.roleRepository.getUserRoles(command.userId)
    if (!userRolesResult.isOk) {
      return failure(new InternalServerErrorException(userRolesResult.error))
    }

    const userRole = userRolesResult.value.find(
      (ur) => ur.role_id === command.roleId && ur.status === "ACTIVE",
    )

    if (!userRole) {
      return failure(new NotFoundException("User does not have this role assigned"))
    }

    const revokeResult = await this.roleRepository.revokeRoleFromUser(userRole)
    if (!revokeResult.isOk) {
      return failure(
        new NotFoundException(revokeResult.error.assignment?.[0] || "Failed to revoke role"),
      )
    }

    return success(revokeResult.value)
  }
}
