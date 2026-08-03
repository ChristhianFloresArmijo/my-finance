import { PrismaService, RepositoryService } from "./integration/services"
import { Global, Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { IChangeLogRepository } from "./business/repositories"
import { ChangeLogRepository } from "./integration/repositories"

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RepositoryService,
    PrismaService,
    { provide: IChangeLogRepository, useClass: ChangeLogRepository },
  ],
  exports: [RepositoryService, PrismaService, IChangeLogRepository],
})
export class DatabaseModule {}
