import { CommandHandler } from "@nestjs/cqrs"
import { EventBus } from "@nestjs/cqrs"
import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { IRoleRepository } from "@authorization/business/repositories"
import { Role } from "@authorization/business/entities"
import { UpdateRoleCommand } from "./command"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { AuditableCommandHandler } from "@shared/capabilities/handlers"

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler extends AuditableCommandHandler<UpdateRoleCommand, Role> {
  constructor(
    private readonly repository: IRoleRepository,
    eventBus: EventBus,
  ) {
    super(eventBus)
  }

  protected getAction() { return "update-role" }
  protected getEntityType() { return "Role" }
  protected getEntityId(command: UpdateRoleCommand) { return command.id }
  protected getSafePayload(command: UpdateRoleCommand) {
    return { id: command.id, ...command.data }
  }

  protected async executeCommand(command: UpdateRoleCommand): Promise<Result<Role, HandlerError>> {
    const existingRoleResult = await this.repository.findById(command.id)

    if (!existingRoleResult.isOk) {
      return failure(new InternalServerErrorException(existingRoleResult.error))
    }
    if (!existingRoleResult.value) {
      return failure(new NotFoundException("Role not found"))
    }

    const existingRole = existingRoleResult.value

    if (command.data.name && command.data.name !== existingRole.name) {
      const nameCheckResult = await this.repository.find({
        where: { name: command.data.name },
      })

      if (!nameCheckResult.isOk) {
        return failure(new InternalServerErrorException(nameCheckResult.error))
      }

      if (nameCheckResult.value[0] > 0) {
        return failure(new ConflictException("A role with this name already exists"))
      }
    }

    const roleResult = Role.instance({
      ...existingRole,
      name: command.data.name ?? existingRole.name,
      display_name: command.data.display_name ?? existingRole.display_name,
      description: command.data.description !== undefined ? command.data.description : existingRole.description,
      is_system: command.data.is_system ?? existingRole.is_system,
      status: command.data.status ?? existingRole.status,
    })

    if (!roleResult.isOk) {
      return failure(new InternalServerErrorException(roleResult.error))
    }

    const saveResult = await this.repository.save(roleResult.value)
    if (!saveResult.isOk) {
      return failure(new InternalServerErrorException(saveResult.error))
    }

    return success(saveResult.value)
  }
}
