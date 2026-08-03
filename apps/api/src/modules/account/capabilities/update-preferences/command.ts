import { ICommand } from "@nestjs/cqrs"
import { UpdatePreferencesDto } from "@account/presentation/dtos"

export class UpdatePreferencesCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly dto: UpdatePreferencesDto,
  ) {}
}
