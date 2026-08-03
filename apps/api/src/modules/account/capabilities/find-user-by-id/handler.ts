import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { FindUserByIdQuery } from "./query"
import { IUserRepository } from "@account/business/repositories"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"
import { failure, Result } from "@shared/business/utils/error-handling"
import { CurrentUserDto } from "@auth/presentation/dtos"

@QueryHandler(FindUserByIdQuery)
export class FindUserByIdHandler implements IQueryHandler<FindUserByIdQuery> {
  constructor(private readonly repository: IUserRepository) {}

  async execute(
    query: FindUserByIdQuery,
  ): Promise<Result<CurrentUserDto, InternalServerErrorException | NotFoundException>> {
    const result = await this.repository.findCurrent(query.id)

    if (!result.isOk) {
      return failure(new InternalServerErrorException(result.error))
    }

    if (!result.value) {
      return failure(new NotFoundException(`User ${query.id} not found`))
    }

    return result as Result<CurrentUserDto, never>
  }
}
