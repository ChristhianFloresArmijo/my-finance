import { ListRolesParams } from "@authorization/presentation/dtos/list-roles.dto"
import { IQuery } from "@nestjs/cqrs"
import { Filter } from "@shared/business/utils/filter"
import { Pagination } from "@shared/business/utils/pagination"

export class ListRolesQuery implements IQuery {
  pagination: Pagination
  filter: Filter

  constructor(public readonly params: ListRolesParams) {
    this.pagination = new Pagination(params)
    this.filter = new Filter(params, [
      ["name", String, "contains", true],
      ["is_system", Boolean, "equals", true],
      ["status", String, "equals", true],
    ])
  }
}
