import { PaginationParam } from "@shared/business/utils/pagination.dto"

export class Pagination {
  public limit: number = 0
  public offset: number = 0

  constructor(obj?: PaginationParam) {
    this.limit = Number(obj?.limit || 1000)
    this.offset = Number(obj?.offset || 0)
  }
}
