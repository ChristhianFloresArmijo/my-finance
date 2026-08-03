import { AccountModule } from "@account/account.module"
import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common"
import { DatabaseModule } from "./modules/shared/database.module"
import { StorageModule } from "./modules/shared/storage.module"
import { MailModule } from "./modules/shared/mail.module"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { APP_INTERCEPTOR, APP_GUARD, APP_FILTER } from "@nestjs/core"
import { ClassSerializerInterceptor } from "@nestjs/common"
import configuration from "@config/EnvConfiguration"
import { AuthenticationModule } from "@auth/authentication.module"
import { AuthorizationModule } from "@authorization/authorization.module"
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler"
import { RequestIdMiddleware } from "./middleware/request-id.middleware"
import { RequestLoggerMiddleware } from "./middleware/request-logger.middleware"
import { GlobalExceptionFilter } from "./filters/global-exception.filter"
import { HealthModule } from "./health/health.module"
import { MetaModule } from "./modules/meta/meta.module"

@Module({
  imports: [
    AccountModule,
    AuthenticationModule,
    AuthorizationModule,
    MetaModule,
    DatabaseModule,
    StorageModule,
    MailModule,
    HealthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        // default — general endpoints: 100 req / 60 s
        {
          name: "default",
          ttl: (config.get<number>("throttlerTtl") ?? 60) * 1000,
          limit: config.get<number>("throttlerLimit") ?? 100,
        },
        // auth — sign-in, 2FA verify, reset-password: 5 req / 60 s
        { name: "auth", ttl: 60_000, limit: 5 },
        // strict — sign-up, forgot-password: 3 req / 60 s
        { name: "strict", ttl: 60_000, limit: 3 },
      ],
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware, RequestLoggerMiddleware).forRoutes("*")
  }
}
