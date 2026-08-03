import { Global, Module } from "@nestjs/common"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { STORAGE_PROVIDER } from "./business/storage/IStorageProvider"
import { LocalStorageProvider } from "./integration/storage/LocalStorageProvider"
import { S3StorageProvider } from "./integration/storage/S3StorageProvider"

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: (config: ConfigService) => {
        const type = config.get<string>("storage.type") ?? "local"
        if (type === "s3") return new S3StorageProvider(config)
        return new LocalStorageProvider()
      },
      inject: [ConfigService],
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
