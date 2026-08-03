import { IQuery } from "@nestjs/cqrs"

export class FindRoleByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}
