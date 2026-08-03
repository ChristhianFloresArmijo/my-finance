import { AccountModule } from "@account/account.module"
import { Module, forwardRef } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { AuthenticationController } from "./presentation/restful/authentication.controller"
import { JwtStrategy, JwtRefreshStrategy, LocalStrategy } from "./integration/strategies"
import { CqrsModule } from "@nestjs/cqrs"
import HANDLERS from "./capabilities/handlers"
import { RepositoryService } from "@shared/integration/services"
import { IRefreshTokenRepository } from "./business/repositories"
import { RefreshTokenRepository } from "./integration/repositories"
import { RefreshTokenCleanupScheduler } from "./presentation/schedulers/refresh-token-cleanup.scheduler"
import { ScheduleModule } from "@nestjs/schedule"
import { TotpService } from "./integration/services/totp.service"

@Module({
  imports: [
    forwardRef(() => AccountModule),
    CqrsModule,
    PassportModule,
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET_KEY"),
        signOptions: {
          expiresIn: parseInt(
            configService.getOrThrow<string>("ACCESS_TOKEN_VALIDITY_DURATION_IN_SEC"),
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthenticationController],
  providers: [
    RepositoryService,
    TotpService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    RefreshTokenCleanupScheduler,
    {
      provide: IRefreshTokenRepository,
      useClass: RefreshTokenRepository,
    },
    ...HANDLERS,
  ],
  exports: [JwtModule, IRefreshTokenRepository, TotpService],
})
export class AuthenticationModule {}
