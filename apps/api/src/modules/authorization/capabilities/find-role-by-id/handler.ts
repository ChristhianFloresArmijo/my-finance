import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { FindRoleByIdQuery } from "./query"
import { Role } from "@authorization/business/entities"
import { IRoleRepository } from "@authorization/business/repositories"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { failure, Result } from "@shared/business/utils/error-handling"

@QueryHandler(FindRoleByIdQuery)
export class FindRoleByIdHandler implements IQueryHandler<FindRoleByIdQuery> {
  constructor(private readonly repository: IRoleRepository) {}

  async execute(
    query: FindRoleByIdQuery,
  ): Promise<Result<Role, InternalServerErrorException | NotFoundException>> {
    const result = await this.repository.findById(query.id)

    if (!result.isOk) {
      return failure(new InternalServerErrorException(result.error))
    }

    if (!result.value) {
      return failure(new NotFoundException("Role not found"))
    }

    return result
  }
}
