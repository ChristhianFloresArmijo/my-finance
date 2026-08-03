import { ICommand } from "@nestjs/cqrs"

export class RevokePermissionFromRoleCommand implements ICommand {
  constructor(
    public readonly roleId: string,
    public readonly permissionId: string,
  ) {}
}
