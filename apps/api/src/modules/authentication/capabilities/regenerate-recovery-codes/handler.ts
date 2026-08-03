import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "@shared/integration/services/prisma.service"
import { TotpService } from "@auth/integration/services/totp.service"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { RegenerateRecoveryCodesCommand } from "./command"

@CommandHandler(RegenerateRecoveryCodesCommand)
export class RegenerateRecoveryCodesHandler implements ICommandHandler<
  RegenerateRecoveryCodesCommand,
  Result<{ recovery_codes: string[] }, HandlerError>
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly totpService: TotpService,
  ) {}

  async execute(
    command: RegenerateRecoveryCodesCommand,
  ): Promise<Result<{ recovery_codes: string[] }, HandlerError>> {
    const user = await this.prisma.user.findUnique({
      where: { id: command.userId },
      select: { id: true, totp_secret: true, totp_enabled: true },
    })

    if (!user) return failure(new NotFoundException("User not found"))
    if (!user.totp_enabled) return failure(new BadRequestException("2FA is not enabled"))

    if (!this.totpService.verifyCode(user.totp_secret!, command.code)) {
      return failure(new BadRequestException("Invalid verification code"))
    }

    // Replace all recovery codes
    await this.prisma.userRecoveryCode.deleteMany({ where: { user_id: command.userId } })

    const plainCodes = this.totpService.generateRecoveryCodes()
    const hashed = await Promise.all(plainCodes.map(c => this.totpService.hashRecoveryCode(c)))

    await this.prisma.userRecoveryCode.createMany({
      data: hashed.map(code_hash => ({ user_id: command.userId, code_hash })),
    })

    return success({ recovery_codes: plainCodes })
  }
}
