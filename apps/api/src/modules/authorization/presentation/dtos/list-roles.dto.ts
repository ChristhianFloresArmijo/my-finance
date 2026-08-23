import { PaginationParam } from "@shared/business/utils/pagination.dto"
import { IsOptional, IsString } from "class-validator"
import { Status } from "@database/prisma/generated-client"

export class ListRolesParams extends PaginationParam {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  is_system?: boolean

  @IsOptional()
  @IsString()
  status?: Status
}
