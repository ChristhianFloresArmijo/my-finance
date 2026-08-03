import { ICommand } from "@nestjs/cqrs"

export class RevokePermissionFromUserCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly permissionId: string,
  ) {}
}
