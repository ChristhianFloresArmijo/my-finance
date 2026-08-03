import { ICommand } from "@nestjs/cqrs"

export class RevokeRoleFromUserCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
  ) {}
}
