import { IQuery } from "@nestjs/cqrs"
import { PaginationParam } from "@shared/business/utils/pagination.dto"
import { Pagination } from "@shared/business/value-object/pagination"

export class ListUsersQuery implements IQuery {
  pagination: Pagination
  search?: string
  status?: string
  role?: string

  constructor(
    public readonly params: PaginationParam & {
      search?: string
      status?: string
      role?: string
    },
  ) {
    this.pagination = new Pagination(params)
    this.search = params.search
    this.status = params.status
    this.role = params.role
  }
}
