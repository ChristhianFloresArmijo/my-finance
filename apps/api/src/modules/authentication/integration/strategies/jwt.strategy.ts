import { Inject, Injectable, UnauthorizedException } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { Strategy, ExtractJwt } from "passport-jwt"
import { ConfigService } from "@nestjs/config"
import { IUserRepository } from "@account/business/repositories"
import { JwtPayload } from "jsonwebtoken"
import { Request } from "express"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    @Inject(IUserRepository)
    private userRepository: IUserRepository,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try to extract from cookie first
        (request: Request) => {
          return request?.cookies?.accessToken
        },
        // Fallback to Authorization header (for API clients, Swagger, etc.)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get("jwtSecretKey"),
      passReqToCallback: false,
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findById(payload.sub)
    if (!user.isOk) {
      throw new UnauthorizedException()
    }
    return payload
  }
}
