import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { GenerateTokenPairCommand, TokenUserPayload } from "./command"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import { IRefreshTokenRepository } from "@auth/business/repositories"
import { ConflictException } from "@nestjs/common"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { RefreshToken } from "@auth/business/entities/refresh-token.entity"
import { ValidationException } from "@shared/business/exceptions"
import { v4 as uuidv4 } from "uuid"

@CommandHandler(GenerateTokenPairCommand)
export class GenerateTokenPairHandler implements ICommandHandler<
  GenerateTokenPairCommand,
  Result<{ access_token: string; refresh_token: string }, HandlerError>
> {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  private generateAccessToken(user: TokenUserPayload): string {
    const payload = { email: user.email, sub: user.id }
    return this.jwtService.sign(payload) // uses default JWT config
  }

  private generateRefreshToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get("jwtRefreshSecretKey"),
        expiresIn: this.configService.get("secretKeyExpiresIn"),
      },
    )
  }

  private async validateAndStoreOldRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<Result<RefreshToken, HandlerError>> {
    const existingToken = await this.refreshTokenRepository.findByUserToken(userId, refreshToken)

    if (!existingToken.isOk) {
      return failure(new ConflictException("Error validating token", "Unexpected Error, try later"))
    }

    if (!existingToken.value) {
      return failure(
        new ConflictException("Invalid refresh token", "Token not found or already used"),
      )
    }

    // Just validate the token is still active
    if (existingToken.value.status !== "ACTIVE") {
      return failure(new ConflictException("Invalid refresh token", "Token has been deactivated"))
    }

    return success(existingToken.value)
  }

  async execute(command: GenerateTokenPairCommand) {
    const { user, currentRefreshToken } = command

    if (!currentRefreshToken) {
      // First login - generate both tokens
      const refresh_token = this.generateRefreshToken(user.id)
      const access_token = this.generateAccessToken(user)

      // Store the new refresh token
      const entity = RefreshToken.instance({
        id: uuidv4(),
        token: refresh_token,
        user_id: user.id,
        status: "ACTIVE",
      })

      if (!entity.isOk) {
        return failure(new ValidationException(entity.error))
      }

      await this.refreshTokenRepository.save(entity.value)

      return success({ access_token, refresh_token })
    }

    // Token refresh - only generate new access token
    const result = await this.validateAndStoreOldRefreshToken(user.id, currentRefreshToken)

    if (!result.isOk) return failure(result.error)

    const access_token = this.generateAccessToken(user)

    return success({ access_token, refresh_token: currentRefreshToken })
  }
}
