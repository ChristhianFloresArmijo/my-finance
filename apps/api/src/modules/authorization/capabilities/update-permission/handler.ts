import { CommandHandler } from "@nestjs/cqrs"
import { EventBus } from "@nestjs/cqrs"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { IPermissionRepository } from "@authorization/business/repositories"
import { Permission } from "@authorization/business/entities"
import { UpdatePermissionCommand } from "./command"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(UpdatePermissionCommand)
export class UpdatePermissionHandler extends AuditableCommandHandler<UpdatePermissionCommand, Permission> {
  constructor(
    private readonly repository: IPermissionRepository,
    eventBus: EventBus,
  ) {
    super(eventBus)
  }

  protected getAction() { return "update-permission" }
  protected getEntityType() { return "Permission" }
  protected getEntityId(command: UpdatePermissionCommand) { return command.id }
  protected getSafePayload(command: UpdatePermissionCommand) {
    return { id: command.id, ...command.data }
  }

  protected async executeCommand(command: UpdatePermissionCommand): Promise<Result<Permission, HandlerError>> {
    const existingPermissionResult = await this.repository.findById(command.id)

    if (!existingPermissionResult.isOk) {
      return failure(new InternalServerErrorException(existingPermissionResult.error))
    }
    if (!existingPermissionResult.value) {
      return failure(new NotFoundException("Permission not found"))
    }

    const existingPermission = existingPermissionResult.value

    const permissionResult = Permission.instance({
      ...existingPermission,
      description: command.data.description !== undefined ? command.data.description : existingPermission.description,
      status: command.data.status ?? existingPermission.status,
      is_system: command.data.is_system ?? existingPermission.is_system,
    })

    if (!permissionResult.isOk) {
      return failure(new InternalServerErrorException(permissionResult.error))
    }

    const saveResult = await this.repository.save(permissionResult.value)
    if (!saveResult.isOk) {
      return failure(new InternalServerErrorException(saveResult.error))
    }

    return success(saveResult.value)
  }
}
