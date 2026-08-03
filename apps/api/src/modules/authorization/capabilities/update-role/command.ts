import { ICommand } from "@nestjs/cqrs"
import { UpdateRoleDto } from "@authorization/presentation/dtos"

export class UpdateRoleCommand implements ICommand {
  constructor(
    public readonly id: string,
    public readonly data: UpdateRoleDto,
  ) {}
}
