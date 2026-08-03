import { CommandHandler } from "@nestjs/cqrs"
import { EventBus } from "@nestjs/cqrs"
import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { IRoleRepository, IPermissionRepository } from "@authorization/business/repositories"
import { RolePermission } from "@authorization/business/entities"
import { AssignPermissionToRoleCommand } from "./command"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(AssignPermissionToRoleCommand)
export class AssignPermissionToRoleHandler extends AuditableCommandHandler<
  AssignPermissionToRoleCommand,
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
    return "assign-permission-to-role"
  }
  protected getEntityType() {
    return "RolePermission"
  }
  protected getEntityId(_: AssignPermissionToRoleCommand, value: RolePermission) {
    return value.id
  }
  protected getSafePayload(command: AssignPermissionToRoleCommand) {
    return { role_id: command.data.role_id, permission_id: command.data.permission_id }
  }

  protected async executeCommand(
    command: AssignPermissionToRoleCommand,
  ): Promise<Result<RolePermission, HandlerError>> {
    const roleResult = await this.roleRepository.findById(command.data.role_id)
    if (!roleResult.isOk) {
      return failure(new InternalServerErrorException(roleResult.error))
    }
    if (!roleResult.value) {
      return failure(new NotFoundException("Role not found"))
    }

    const permissionResult = await this.permissionRepository.findById(command.data.permission_id)
    if (!permissionResult.isOk) {
      return failure(new InternalServerErrorException(permissionResult.error))
    }
    if (!permissionResult.value) {
      return failure(new NotFoundException("Permission not found"))
    }

    const existingPermissionsResult = await this.roleRepository.getRolePermissions(
      command.data.role_id,
    )
    if (existingPermissionsResult.isOk) {
      const existingAssignment = existingPermissionsResult.value.find(
        (rp) => rp.permission_id === command.data.permission_id && rp.status === "ACTIVE",
      )
      if (existingAssignment) {
        return failure(new ConflictException("This permission is already assigned to the role"))
      }
    }

    const rolePermissionResult = RolePermission.instance({
      role_id: command.data.role_id,
      permission_id: command.data.permission_id,
      status: "ACTIVE" as const,
    })

    if (!rolePermissionResult.isOk) {
      return failure(
        new InternalServerErrorException(
          rolePermissionResult.error,
          "Failed to create role permission entity",
        ),
      )
    }

    const assignResult = await this.roleRepository.assignPermissionToRole(
      rolePermissionResult.value,
    )
    if (!assignResult.isOk) {
      return failure(
        new ConflictException(assignResult.error.assignment?.[0] || "Failed to assign permission"),
      )
    }

    return success(assignResult.value)
  }
}
