import { ICommand } from "@nestjs/cqrs"

export class RevokeSessionCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly tokenId: string,
  ) {}
}
