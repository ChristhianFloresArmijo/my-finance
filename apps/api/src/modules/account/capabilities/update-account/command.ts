import { ICommand } from "@nestjs/cqrs"
import { UpdateAccountDto } from "@account/presentation/dtos"

export class UpdateAccountCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly dto: UpdateAccountDto,
  ) {}
}
