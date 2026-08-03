import { ICommand } from "@nestjs/cqrs"

export interface AssignPermissionToRoleData {
  role_id: string
  permission_id: string
}

export class AssignPermissionToRoleCommand implements ICommand {
  constructor(public readonly data: AssignPermissionToRoleData) {}
}
