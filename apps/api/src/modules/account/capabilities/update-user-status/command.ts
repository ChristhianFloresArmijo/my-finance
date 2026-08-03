import { ICommand } from "@nestjs/cqrs"

export class UpdateUserStatusCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly status: "ACTIVE" | "SUSPENDED",
  ) {}
}
