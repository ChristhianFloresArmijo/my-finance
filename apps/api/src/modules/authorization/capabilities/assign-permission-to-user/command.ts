import { ICommand } from "@nestjs/cqrs"

export interface AssignPermissionToUserData {
  user_id: string
  permission_id: string
  assigned_by: string | null  // set from session by the controller, never from the request body
  expires_at?: string
}

export class AssignPermissionToUserCommand implements ICommand {
  constructor(public readonly data: AssignPermissionToUserData) {}
}
