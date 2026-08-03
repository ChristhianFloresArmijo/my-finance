import { ICommand } from "@nestjs/cqrs"
import { UpdatePermissionDto } from "@authorization/presentation/dtos"

export class UpdatePermissionCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdatePermissionDto,
  ) {}
}
