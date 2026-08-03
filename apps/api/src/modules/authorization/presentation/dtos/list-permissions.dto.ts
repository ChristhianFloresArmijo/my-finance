import { PaginationParam } from "@shared/business/utils/pagination.dto"
import { IsOptional, IsString } from "class-validator"
import { Status } from '@database/prisma/generated-client'

export class ListPermissionsParams extends PaginationParam {
  @IsOptional()
  @IsString()
  resource?: string

  @IsOptional()
  @IsString()
  action?: string

  @IsOptional()
  @IsString()
  is_system?: boolean

  @IsOptional()
  @IsString()
  status?: Status
}
