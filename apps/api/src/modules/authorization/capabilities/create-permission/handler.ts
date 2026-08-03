import { CommandHandler } from "@nestjs/cqrs"
import { EventBus } from "@nestjs/cqrs"
import { ConflictException, InternalServerErrorException } from "@nestjs/common"
import { IPermissionRepository } from "@authorization/business/repositories"
import { Permission } from "@authorization/business/entities"
import { CreatePermissionCommand } from "./command"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"
import { PermissionScope } from "@authorization/business/entities"

@CommandHandler(CreatePermissionCommand)
export class CreatePermissionHandler extends AuditableCommandHandler<
  CreatePermissionCommand,
  Permission
> {
  constructor(
    private readonly repository: IPermissionRepository,
    eventBus: EventBus,
  ) {
    super(eventBus)
  }

  protected getAction() {
    return "create-permission"
  }
  protected getEntityType() {
    return "Permission"
  }
  protected getEntityId(_: CreatePermissionCommand, value: Permission) {
    return value.id
  }
  protected getSafePayload(command: CreatePermissionCommand) {
    return { resource: command.data.resource, action: command.data.action, scope: command.data.scope ?? PermissionScope.ALL }
  }

  protected async executeCommand(
    command: CreatePermissionCommand,
  ): Promise<Result<Permission, HandlerError>> {
    const scope = command.data.scope ?? PermissionScope.ALL

    const existingPermissions = await this.repository.find({
      where: { resource: command.data.resource, action: command.data.action, scope },
    })

    if (!existingPermissions.isOk) {
      return failure(
        new InternalServerErrorException(
          existingPermissions.error,
          "Failed to check existing permissions",
        ),
      )
    }

    if (existingPermissions.value[0] > 0) {
      return failure(
        new ConflictException(
          `A permission '${command.data.resource}:${command.data.action}' with scope '${scope}' already exists`,
        ),
      )
    }

    const permissionResult = Permission.instance({
      resource: command.data.resource,
      action: command.data.action,
      scope,
      description: command.data.description || null,
      is_system: command.data.is_system || false,
      status: "ACTIVE" as const,
    })

    if (!permissionResult.isOk) {
      return failure(
        new InternalServerErrorException(
          permissionResult.error,
          "Failed to create permission entity",
        ),
      )
    }

    const saveResult = await this.repository.save(permissionResult.value)
    if (!saveResult.isOk) {
      return failure(
        new InternalServerErrorException(saveResult.error, "Failed to save permission"),
      )
    }

    return success(saveResult.value)
  }
}
