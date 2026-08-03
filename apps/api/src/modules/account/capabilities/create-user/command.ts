import { ICommand } from "@nestjs/cqrs"
import { NewUserSerializer } from "@account/presentation/dtos"

export class CreateUserCommand implements ICommand {
  constructor(public readonly data: NewUserSerializer) {}
}
