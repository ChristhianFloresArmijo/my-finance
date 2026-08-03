import { IQuery } from "@nestjs/cqrs"

export class FindPermissionByIdQuery implements IQuery {
  constructor(public readonly id: string) {}
}
