import { CommandHandler } from "@nestjs/cqrs"
import { EventBus } from "@nestjs/cqrs"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { IRoleRepository, IPermissionRepository } from "@authorization/business/repositories"
import { RolePermission } from "@authorization/business/entities"
import { RevokePermissionFromRoleCommand } from "./command"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(RevokePermissionFromRoleCommand)
export class RevokePermissionFromRoleHandler extends AuditableCommandHandler<
  RevokePermissionFromRoleCommand,
  RolePermission
> {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly permissionRepository: IPermissionRepository,
    eventBus: EventBus,
  ) {
    super(eventBus)
  }

  protected getAction() {
    return "revoke-permission-from-role"
  }
  protected getEntityType() {
    return "RolePermission"
  }
  protected getSafePayload(command: RevokePermissionFromRoleCommand) {
    return { role_id: command.roleId, permission_id: command.permissionId }
  }

  protected async executeCommand(
    command: RevokePermissionFromRoleCommand,
  ): Promise<Result<RolePermission, HandlerError>> {
    const roleResult = await this.roleRepository.findById(command.roleId)
    if (!roleResult.isOk) {
      return failure(new InternalServerErrorException(roleResult.error))
    }
    if (!roleResult.value) {
      return failure(new NotFoundException("Role not found"))
    }

    const permissionResult = await this.permissionRepository.findById(command.permissionId)
    if (!permissionResult.isOk) {
      return failure(new InternalServerErrorException(permissionResult.error))
    }
    if (!permissionResult.value) {
      return failure(new NotFoundException("Permission not found"))
    }

    const revokeResult = await this.roleRepository.revokePermissionFromRole(
      command.roleId,
      command.permissionId,
    )
    if (!revokeResult.isOk) {
      return failure(
        new NotFoundException(
          revokeResult.error.assignment?.[0] || "Permission assignment not found",
        ),
      )
    }

    return success(revokeResult.value)
  }
}
