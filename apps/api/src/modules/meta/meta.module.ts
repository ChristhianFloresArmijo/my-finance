import { Module } from "@nestjs/common"
import { MetaController } from "./meta.controller"
import { forwardRef } from "@nestjs/common"
import { AuthenticationModule } from "@auth/authentication.module"

@Module({
  imports: [forwardRef(() => AuthenticationModule)],
  controllers: [MetaController],
})
export class MetaModule {}
