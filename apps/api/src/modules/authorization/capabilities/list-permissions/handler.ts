import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { ListPermissionsQuery } from "./query"
import { IPermissionRepository } from "@authorization/business/repositories"
import { Permission } from "@authorization/business/entities"
import { InternalServerErrorException } from "@nestjs/common"
import { failure, Result, success } from "@shared/business/utils/error-handling"
import { PaginatedResults } from "@shared/business/utils/pagination.dto"

@QueryHandler(ListPermissionsQuery)
export class ListPermissionsHandler implements IQueryHandler<ListPermissionsQuery> {
  constructor(private readonly permissionRepository: IPermissionRepository) {}

  async execute(
    query: ListPermissionsQuery,
  ): Promise<Result<PaginatedResults<Permission[]>, InternalServerErrorException>> {
    const result = await this.permissionRepository.find({}, query.pagination, query.filter)

    if (!result.isOk) {
      return failure(new InternalServerErrorException(result.error))
    }

    return success({
      count: result.value[0],
      results: result.value[1],
    })
  }
}
