import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { GetCurrentUserQuery } from "./query"
import { failure, HandlerError, Result } from "@shared/business/utils/error-handling"
import { IUserRepository } from "@account/business/repositories"
import { UnauthorizedException } from "@nestjs/common"
import { CurrentUserDto } from "@auth/presentation/dtos"

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler implements IQueryHandler<
  GetCurrentUserQuery,
  Result<CurrentUserDto, HandlerError>
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(query: GetCurrentUserQuery): Promise<Result<CurrentUserDto, HandlerError>> {
    const result = await this.userRepository.findCurrent(query.userId)

    if (!result.isOk || !result.value) {
      return failure(new UnauthorizedException("User not found"))
    }

    return result
  }
}
