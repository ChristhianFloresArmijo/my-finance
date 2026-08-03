import { IRefreshTokenRepository } from "@auth/business/repositories"
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { SignOutCommand } from "./command"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { RefreshToken } from "@auth/business/entities/refresh-token.entity"
import { ValidationException } from "@shared/business/exceptions"
import { UnauthorizedException } from "@nestjs/common"

@CommandHandler(SignOutCommand)
export class SignOutHandler implements ICommandHandler<SignOutCommand, Result<void, HandlerError>> {
  constructor(private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(command: SignOutCommand): Promise<Result<void, HandlerError>> {
    const { userId, refreshToken } = command

    const tokenResult = await this.refreshTokenRepository.findByUserToken(userId, refreshToken)

    if (!tokenResult.isOk) {
      return failure(new UnauthorizedException("Error finding refresh token"))
    }

    if (!tokenResult.value) {
      return failure(new UnauthorizedException("Invalid refresh token"))
    }

    const entity = RefreshToken.instance({
      id: tokenResult.value.id,
      token: tokenResult.value.token,
      user_id: userId,
      status: "INACTIVE",
    })

    if (!entity.isOk) {
      return failure(new ValidationException(entity.error))
    }

    const saveResult = await this.refreshTokenRepository.save(entity.value)

    if (!saveResult.isOk) {
      return failure(new UnauthorizedException("Error deactivating token"))
    }

    return success(undefined)
  }
}
