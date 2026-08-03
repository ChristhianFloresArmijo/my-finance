import { ICommand } from "@nestjs/cqrs"
import { CreateRoleDto } from "@authorization/presentation/dtos"

export class CreateRoleCommand implements ICommand {
  constructor(public readonly data: CreateRoleDto) {}
}
