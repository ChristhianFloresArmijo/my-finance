import { ICommand } from "@nestjs/cqrs"
import { ChangePasswordDto } from "@account/presentation/dtos"

export class ChangePasswordCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly dto: ChangePasswordDto,
  ) {}
}
