import { IsOptional } from "class-validator"
import { Type } from "class-transformer"

export class PaginationParam {
  @IsOptional()
  @Type(() => Number)
  limit?: number

  @IsOptional()
  @Type(() => Number)
  offset?: number
}

export interface PaginatedResults<TResults> {
  count: number
  results: TResults
}
