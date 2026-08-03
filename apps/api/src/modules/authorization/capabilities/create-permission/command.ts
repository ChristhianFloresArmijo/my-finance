import { ICommand } from "@nestjs/cqrs"
import { CreatePermissionDto } from "@authorization/presentation/dtos"

export class CreatePermissionCommand implements ICommand {
  constructor(public readonly data: CreatePermissionDto) {}
}
