import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { FindPermissionByIdQuery } from "./query"
import { Permission } from "@authorization/business/entities"
import { IPermissionRepository } from "@authorization/business/repositories"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { failure, Result } from "@shared/business/utils/error-handling"

@QueryHandler(FindPermissionByIdQuery)
export class FindPermissionByIdHandler implements IQueryHandler<FindPermissionByIdQuery> {
  constructor(private readonly repository: IPermissionRepository) {}

  async execute(
    query: FindPermissionByIdQuery,
  ): Promise<Result<Permission, InternalServerErrorException | NotFoundException>> {
    const result = await this.repository.findById(query.id)

    if (!result.isOk) {
      return failure(new InternalServerErrorException(result.error))
    }

    if (!result.value) {
      return failure(new NotFoundException("Permission not found"))
    }

    return result
  }
}
