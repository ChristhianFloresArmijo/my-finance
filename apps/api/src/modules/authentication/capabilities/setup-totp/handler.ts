import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "@shared/integration/services/prisma.service"
import { TotpService } from "@auth/integration/services/totp.service"
import { ConfigService } from "@nestjs/config"
import { failure, HandlerError, Result, success } from "@shared/business/utils/error-handling"
import { SetupTotpCommand } from "./command"

export interface SetupTotpResult {
  uri: string
}

@CommandHandler(SetupTotpCommand)
export class SetupTotpHandler implements ICommandHandler<
  SetupTotpCommand,
  Result<SetupTotpResult, HandlerError>
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly totpService: TotpService,
    private readonly configService: ConfigService,
  ) {}

  async execute(command: SetupTotpCommand): Promise<Result<SetupTotpResult, HandlerError>> {
    const user = await this.prisma.user.findUnique({
      where: { id: command.userId },
      select: { id: true, email: true, totp_enabled: true },
    })

    if (!user) return failure(new NotFoundException("User not found"))
    if (user.totp_enabled) return failure(new BadRequestException("2FA is already enabled"))

    const secret = this.totpService.generateSecret()

    // Store the secret (not yet active — totp_enabled remains false)
    await this.prisma.user.update({
      where: { id: command.userId },
      data: { totp_secret: secret },
    })

    const issuer = this.configService.get<string>("appName") ?? "App"
    const uri = this.totpService.generateUri(user.email, secret, issuer)

    return success({ uri })
  }
}
