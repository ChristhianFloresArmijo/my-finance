import { IQuery } from "@nestjs/cqrs"

export class GetUserDirectPermissionsQuery implements IQuery {
  constructor(public readonly userId: string) {}
}
