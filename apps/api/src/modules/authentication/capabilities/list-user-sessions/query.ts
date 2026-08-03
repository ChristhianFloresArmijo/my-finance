import { IQuery } from "@nestjs/cqrs"

export class ListUserSessionsQuery implements IQuery {
  constructor(public readonly userId: string) {}
}
