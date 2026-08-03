import { Injectable, UnauthorizedException } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { Strategy } from "passport-local"
// import { AuthenticationService } from "../authentication.service"
import { User } from "@account/business/entities"
import { QueryBus } from "@nestjs/cqrs"
import { SignInValidationQuery } from "@auth/capabilities/sign-in-validation"

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, "local") {
  constructor(private readonly queryBus: QueryBus) {
    super({
      usernameField: "email",
    })
  }

  async validate(email: string, password: string): Promise<User> {
    const result = await this.queryBus.execute(new SignInValidationQuery(email, password))

    if (!result.isOk || !result.value) {
      throw new UnauthorizedException("Invalid email or password")
    }
    return result.value
  }
}
