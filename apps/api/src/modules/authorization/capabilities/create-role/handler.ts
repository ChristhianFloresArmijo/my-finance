import { CommandHandler } from "@nestjs/cqrs"
import { EventBus } from "@nestjs/cqrs"
import { ConflictException, InternalServerErrorException } from "@nestjs/common"
import { IRoleRepository } from "@authorization/business/repositories"
import { Role } from "@authorization/business/entities"
import { CreateRoleCommand } from "./command"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler extends AuditableCommandHandler<CreateRoleCommand, Role> {
  constructor(
    private readonly repository: IRoleRepository,
    eventBus: EventBus,
  ) {
    super(eventBus)
  }

  protected getAction() {
    return "create-role"
  }
  protected getEntityType() {
    return "Role"
  }
  protected getEntityId(_: CreateRoleCommand, value: Role) {
    return value.id
  }
  protected getSafePayload(command: CreateRoleCommand) {
    return { name: command.data.name, display_name: command.data.display_name }
  }

  protected async executeCommand(command: CreateRoleCommand): Promise<Result<Role, HandlerError>> {
    const existingRoles = await this.repository.find({
      where: { name: command.data.name },
    })

    if (!existingRoles.isOk) {
      return failure(
        new InternalServerErrorException(existingRoles.error, "Failed to check existing roles"),
      )
    }

    if (existingRoles.value[0] > 0) {
      return failure(new ConflictException("A role with this name already exists"))
    }

    const roleResult = Role.instance({
      name: command.data.name,
      display_name: command.data.display_name,
      description: command.data.description || null,
      is_system: command.data.is_system || false,
      status: command.data.status || "ACTIVE",
    })

    if (!roleResult.isOk) {
      return failure(
        new InternalServerErrorException(roleResult.error, "Failed to create role entity"),
      )
    }

    const saveResult = await this.repository.save(roleResult.value)
    if (!saveResult.isOk) {
      return failure(new InternalServerErrorException(saveResult.error, "Failed to save role"))
    }

    return success(saveResult.value)
  }
}
