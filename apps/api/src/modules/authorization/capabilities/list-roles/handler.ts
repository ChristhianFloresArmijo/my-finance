import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { ListRolesQuery } from "./query"
import { IRoleRepository } from "@authorization/business/repositories"
import { Role } from "@authorization/business/entities"
import { InternalServerErrorException } from "@nestjs/common"
import { failure, Result, success } from "@shared/business/utils/error-handling"
import { PaginatedResults } from "@shared/business/utils/pagination.dto"

@QueryHandler(ListRolesQuery)
export class ListRolesHandler implements IQueryHandler<ListRolesQuery> {
  constructor(private readonly roleRepository: IRoleRepository) {}

  async execute(
    query: ListRolesQuery,
  ): Promise<Result<PaginatedResults<Role[]>, InternalServerErrorException>> {
    const result = await this.roleRepository.find({}, query.pagination, query.filter)

    if (!result.isOk) {
      return failure(new InternalServerErrorException(result.error))
    }

    return success({
      count: result.value[0],
      results: result.value[1],
    })
  }
}
