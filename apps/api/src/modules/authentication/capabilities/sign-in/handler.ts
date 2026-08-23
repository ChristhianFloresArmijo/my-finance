import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { CommandBus, QueryBus } from "@nestjs/cqrs"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import { SignInCommand } from "./command"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { GenerateTokenPairCommand } from "../generate-token-pair/command"
import { SignInValidationQuery } from "../sign-in-validation/query"
import { IUserRepository } from "@account/business/repositories"
import { PrismaService } from "@shared/integration/services/prisma.service"

export type SignInResult =
  | { access_token: string; refresh_token: string; requires_2fa?: never }
  | { requires_2fa: true; totp_pending_token: string; access_token?: never; refresh_token?: never }

@CommandHandler(SignInCommand)
export class SignInHandler implements ICommandHandler<
  SignInCommand,
  Result<SignInResult, HandlerError>
> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly userRepository: IUserRepository,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: SignInCommand): Promise<Result<SignInResult, HandlerError>> {
    const validationResult = await this.queryBus.execute(
      new SignInValidationQuery(command.email, command.password),
    )

    if (!validationResult.isOk) {
      return failure(validationResult.error)
    }

    const user = validationResult.value

    // Update last_login only — targeted update avoids spreading stale entity fields back to DB
    this.prisma.user
      .update({ where: { id: user.id }, data: { last_login: new Date() } })
      .catch(() => {})

    const freshUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { totp_enabled: true },
    })

    if (freshUser?.totp_enabled) {
      // Issue a short-lived pending token (5 min) — no cookies yet
      // Sign with a derived secret so JwtAuthGuard (which uses the base secret) rejects this token
      const pendingToken = this.jwtService.sign(
        { sub: user.id, type: "totp_pending" },
        {
          secret: `${this.configService.get<string>("jwtSecretKey")}:totp_pending`,
          expiresIn: "5m",
        },
      )
      return success({ requires_2fa: true, totp_pending_token: pendingToken })
    }

    const tokenPair = await this.commandBus.execute(new GenerateTokenPairCommand(user))
    if (!tokenPair.isOk) return failure(tokenPair.error)

    return success(tokenPair.value)
  }
}
