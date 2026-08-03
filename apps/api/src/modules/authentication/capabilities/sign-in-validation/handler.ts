import { IQueryHandler, QueryHandler } from "@nestjs/cqrs"
import { SignInValidationQuery } from "./query"
import { User } from "@account/business/entities"
import { failure, HandlerError, Result } from "@shared/business/utils/error-handling"
import { IUserRepository } from "@account/business/repositories"
import { InternalServerErrorException, NotFoundException } from "@nestjs/common"

@QueryHandler(SignInValidationQuery)
export class SignInValidationHandler implements IQueryHandler<
  SignInValidationQuery,
  Result<User, HandlerError>
> {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(command: SignInValidationQuery): Promise<Result<User, HandlerError>> {
    const userResult = await this.userRepository.findByEmail(command.email)

    if (!userResult.isOk) {
      return failure(
        new InternalServerErrorException(userResult.error, "Unexpected Error, try later"),
      )
    }

    if (!userResult.value) {
      return failure(new NotFoundException("Invalid email or password"))
    }

    const isValidPassword: boolean = userResult.value.comparePassword(command.password)

    if (!isValidPassword) {
      return failure(new NotFoundException("Invalid email or password"))
    }

    return userResult
  }
}
