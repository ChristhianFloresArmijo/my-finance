import { CommandHandler } from "@nestjs/cqrs"
import { EventBus } from "@nestjs/cqrs"
import { ForbiddenException, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { IPermissionRepository } from "@authorization/business/repositories"
import { DeletePermissionCommand } from "./command"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { PrismaService } from "@shared/integration/services"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(DeletePermissionCommand)
export class DeletePermissionHandler extends AuditableCommandHandler<
  DeletePermissionCommand,
  boolean
> {
  constructor(
    private readonly permissionRepository: IPermissionRepository,
    private readonly prismaService: PrismaService,
    eventBus: EventBus,
  ) {
    super(eventBus)
  }

  protected getAction() {
    return "delete-permission"
  }
  protected getEntityType() {
    return "Permission"
  }
  protected getEntityId(command: DeletePermissionCommand) {
    return command.id
  }
  protected getSafePayload(command: DeletePermissionCommand) {
    return { id: command.id }
  }

  protected async executeCommand(
    command: DeletePermissionCommand,
  ): Promise<Result<boolean, HandlerError>> {
    const existingPermissionResult = await this.permissionRepository.findById(command.id)

    if (!existingPermissionResult.isOk) {
      return failure(new InternalServerErrorException(existingPermissionResult.error))
    }
    if (!existingPermissionResult.value) {
      return failure(new NotFoundException("Permission not found"))
    }

    if (existingPermissionResult.value.is_system) {
      return failure(new ForbiddenException("Cannot delete system permissions"))
    }

    const rolePermissionsCount = await this.prismaService.rolePermission.count({
      where: { permission_id: command.id, status: "ACTIVE" },
    })

    if (rolePermissionsCount > 0) {
      return failure(
        new ForbiddenException(
          "Cannot delete permission that is assigned to roles. Remove it from all roles first.",
        ),
      )
    }

    const deleteResult = await this.permissionRepository.delete(command.id)
    if (!deleteResult.isOk) {
      return failure(new InternalServerErrorException(deleteResult.error))
    }

    return success(true)
  }
}
