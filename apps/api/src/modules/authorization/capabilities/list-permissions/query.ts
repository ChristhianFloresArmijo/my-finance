import { ListPermissionsParams } from "@authorization/presentation/dtos/list-permissions.dto"
import { IQuery } from "@nestjs/cqrs"
import { Filter } from "@shared/business/utils/filter"
import { Pagination } from "@shared/business/utils/pagination"

export class ListPermissionsQuery implements IQuery {
  pagination: Pagination
  filter: Filter

  constructor(public readonly params: ListPermissionsParams) {
    this.pagination = new Pagination(params)
    this.filter = new Filter(params, [
      ["resource", String, "contains", true],
      ["action", String, "contains", true],
      ["is_system", Boolean, "equals", true],
      ["status", String, "equals", true],
    ])
  }
}
