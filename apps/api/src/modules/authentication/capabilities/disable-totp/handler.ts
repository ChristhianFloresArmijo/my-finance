import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "@shared/integration/services/prisma.service"
import { TotpService } from "@auth/integration/services/totp.service"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { DisableTotpCommand } from "./command"

@CommandHandler(DisableTotpCommand)
export class DisableTotpHandler implements ICommandHandler<DisableTotpCommand, Result<true, HandlerError>> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly totpService: TotpService,
  ) {}

  async execute(command: DisableTotpCommand): Promise<Result<true, HandlerError>> {
    const user = await this.prisma.user.findUnique({
      where: { id: command.userId },
      include: { recovery_codes: true },
    })

    if (!user) return failure(new NotFoundException("User not found"))
    if (!user.totp_enabled) return failure(new BadRequestException("2FA is not enabled"))

    // Accept either a current TOTP code or a recovery code
    const codeValid = this.totpService.verifyCode(user.totp_secret!, command.code)

    let recoveryValid = false
    if (!codeValid && user.recovery_codes?.length) {
      for (const rc of user.recovery_codes) {
        if (await this.totpService.verifyRecoveryCode(command.code, rc.code_hash)) {
          recoveryValid = true
          break
        }
      }
    }

    if (!codeValid && !recoveryValid) {
      return failure(new BadRequestException("Invalid code"))
    }

    // Disable and clean up
    await this.prisma.user.update({
      where: { id: command.userId },
      data: { totp_enabled: false, totp_secret: null, totp_enabled_at: null },
    })
    await this.prisma.userRecoveryCode.deleteMany({ where: { user_id: command.userId } })

    return success(true)
  }
}
