import { Global, Module } from "@nestjs/common"
import { MailService } from "./integration/mail/MailService"

@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
