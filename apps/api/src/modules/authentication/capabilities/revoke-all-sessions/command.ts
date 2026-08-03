import { ICommand } from "@nestjs/cqrs"

export class RevokeAllSessionsCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly currentToken: string | undefined, // keep this one active
  ) {}
}
