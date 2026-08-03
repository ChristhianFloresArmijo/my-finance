import { ICommand } from "@nestjs/cqrs"
import { UpdateProfileDto } from "@account/presentation/dtos"

export class UpdateProfileCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly dto: UpdateProfileDto,
  ) {}
}
