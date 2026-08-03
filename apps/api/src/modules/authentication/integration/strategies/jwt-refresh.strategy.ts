import { Injectable, UnauthorizedException } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { Strategy, ExtractJwt } from "passport-jwt"
import { ConfigService } from "@nestjs/config"
import { IUserRepository } from "@account/business/repositories"
import { JwtPayload } from "jsonwebtoken"

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get("JWT_REFRESH_SECRET_KEY"),
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.userRepository.findById(payload.sub)
    if (!user.isOk) {
      throw new UnauthorizedException()
    }
    return {
      attributes: user.value,
      refreshTokenExpiresAt: new Date(payload.exp * 1000),
    }
  }
}
