import { ICommand } from "@nestjs/cqrs"

export interface AssignRoleToUserData {
  user_id: string
  role_id: string
  assigned_by: string | null // set from session by the controller, never from the request body
  expires_at?: string
}

export class AssignRoleToUserCommand implements ICommand {
  constructor(public readonly data: AssignRoleToUserData) {}
}
