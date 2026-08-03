import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { UnauthorizedException } from "@nestjs/common"
import { CommandBus } from "@nestjs/cqrs"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import { PrismaService } from "@shared/integration/services/prisma.service"
import { TotpService } from "@auth/integration/services/totp.service"
import { failure, HandlerError, Result } from "@shared/business/utils/error-handling"
import { GenerateTokenPairCommand } from "../generate-token-pair/command"
import { VerifyTotpLoginCommand } from "./command"

@CommandHandler(VerifyTotpLoginCommand)
export class VerifyTotpLoginHandler implements ICommandHandler<
  VerifyTotpLoginCommand,
  Result<{ access_token: string; refresh_token: string }, HandlerError>
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly totpService: TotpService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(
    command: VerifyTotpLoginCommand,
  ): Promise<Result<{ access_token: string; refresh_token: string }, HandlerError>> {
    // 1. Verify the pending JWT
    let payload: any
    try {
      payload = this.jwtService.verify(command.pendingToken, {
        secret: `${this.configService.get<string>("jwtSecretKey")}:totp_pending`,
      })
    } catch {
      return failure(new UnauthorizedException("Invalid or expired pending token"))
    }

    if (payload?.type !== "totp_pending") {
      return failure(new UnauthorizedException("Invalid token type"))
    }

    const userId: string = payload.sub

    // 2. Fetch user's TOTP data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, totp_secret: true, totp_enabled: true },
    })

    if (!user || !user.totp_enabled || !user.totp_secret) {
      return failure(new UnauthorizedException("2FA not configured"))
    }

    // 3. Try TOTP code first, then recovery codes
    const totpValid = this.totpService.verifyCode(user.totp_secret, command.code)

    if (!totpValid) {
      // Try recovery codes
      const recoveryCodes = await this.prisma.userRecoveryCode.findMany({
        where: { user_id: userId, used_at: null },
      })

      let recoveryId: string | null = null
      for (const rc of recoveryCodes) {
        if (await this.totpService.verifyRecoveryCode(command.code, rc.code_hash)) {
          recoveryId = rc.id
          break
        }
      }

      if (!recoveryId) {
        return failure(new UnauthorizedException("Invalid 2FA code"))
      }

      // Mark recovery code as used (not deleted — audit trail)
      await this.prisma.userRecoveryCode.update({
        where: { id: recoveryId },
        data: { used_at: new Date() },
      })
    }

    // 4. Fetch full user for token generation
    const fullUser = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!fullUser) return failure(new UnauthorizedException("User not found"))

    return this.commandBus.execute(new GenerateTokenPairCommand(fullUser))
  }
}
