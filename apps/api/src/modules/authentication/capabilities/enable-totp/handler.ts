import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "@shared/integration/services/prisma.service"
import { TotpService } from "@auth/integration/services/totp.service"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { EnableTotpCommand } from "./command"

export interface EnableTotpResult {
  recovery_codes: string[]
}

@CommandHandler(EnableTotpCommand)
export class EnableTotpHandler implements ICommandHandler<EnableTotpCommand, Result<EnableTotpResult, HandlerError>> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly totpService: TotpService,
  ) {}

  async execute(command: EnableTotpCommand): Promise<Result<EnableTotpResult, HandlerError>> {
    const user = await this.prisma.user.findUnique({
      where: { id: command.userId },
      select: { id: true, totp_secret: true, totp_enabled: true },
    })

    if (!user) return failure(new NotFoundException("User not found"))
    if (user.totp_enabled) return failure(new BadRequestException("2FA is already enabled"))
    if (!user.totp_secret) return failure(new BadRequestException("Call /auth/2fa/setup first"))

    if (!this.totpService.verifyCode(user.totp_secret, command.code)) {
      return failure(new BadRequestException("Invalid verification code"))
    }

    // Enable 2FA
    await this.prisma.user.update({
      where: { id: command.userId },
      data: { totp_enabled: true, totp_enabled_at: new Date() },
    })

    // Generate and store recovery codes (delete any old ones first)
    await this.prisma.userRecoveryCode.deleteMany({ where: { user_id: command.userId } })

    const plainCodes = this.totpService.generateRecoveryCodes()
    const hashed = await Promise.all(plainCodes.map(c => this.totpService.hashRecoveryCode(c)))

    await this.prisma.userRecoveryCode.createMany({
      data: hashed.map(code_hash => ({ user_id: command.userId, code_hash })),
    })

    return success({ recovery_codes: plainCodes })
  }
}
