import { Public, CurrentUser } from "@auth/presentation/decorators"
import {
  Body, Controller, Delete, Get, Param, Post, Req, Res, UseGuards, UsePipes, ValidationPipe,
  UnauthorizedException, HttpCode,
} from "@nestjs/common"
import { CommandBus, QueryBus } from "@nestjs/cqrs"
import { ApiBody, ApiTags, ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { SkipThrottle, Throttle } from "@nestjs/throttler"
import { LocalAuthGuard, JwtAuthGuard } from "@auth/capabilities/guards"
import {
  SignInDto, SignUpDto, CurrentUserDto,
  VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto,
  TotpCodeDto, TotpVerifyLoginDto, TotpSetupResponseDto, TotpEnableResponseDto, TotpStatusDto,
} from "@auth/presentation/dtos"
import {
  SignInCommand, GenerateTokenPairCommand, SignOutCommand,
  VerifyEmailCommand, ForgotPasswordCommand, ResetPasswordCommand,
  RevokeSessionCommand, RevokeAllSessionsCommand,
  SetupTotpCommand, EnableTotpCommand, DisableTotpCommand,
  VerifyTotpLoginCommand, RegenerateRecoveryCodesCommand,
} from "@auth/capabilities/commands"
import { GetCurrentUserQuery, ListUserSessionsQuery } from "@auth/capabilities/queries"
import { CreateUserCommand } from "@account/capabilities/commands"
import { Status } from "@database/prisma/generated-client"
import { FindUserByIdQuery } from "@account/capabilities/find-user-by-id"
import { JwtService } from "@nestjs/jwt"
import { ConfigService } from "@nestjs/config"
import { PrismaService } from "@shared/integration/services/prisma.service"
import { Response, Request } from "express"

@ApiTags("auth")
@Controller("auth")
export class AuthenticationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private setCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProduction = this.configService.get("nodeEnv") === "production"
    const cookieSecure = this.configService.get<boolean>("cookieSecure") ?? isProduction
    const cookieSameSite = (this.configService.get<string>("cookieSameSite") || "lax") as "strict" | "lax" | "none"
    const cookieDomain = this.configService.get<string>("cookieDomain") || undefined
    const domainOpt = cookieDomain ? { domain: cookieDomain } : {}

    res.cookie("accessToken", accessToken, {
      httpOnly: true, secure: cookieSecure, sameSite: cookieSameSite, ...domainOpt,
      maxAge: 15 * 60 * 1000, path: "/",
    })
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true, secure: cookieSecure, sameSite: cookieSameSite, ...domainOpt,
      maxAge: 60 * 24 * 60 * 60 * 1000, path: "/",
    })
  }

  private clearCookies(res: Response) {
    const cookieDomain = this.configService.get<string>("cookieDomain") || undefined
    const domainOpt = cookieDomain ? { domain: cookieDomain } : {}
    res.clearCookie("accessToken", { path: "/", ...domainOpt })
    res.clearCookie("refreshToken", { path: "/", ...domainOpt })
  }

  // ─── POST /auth/sign-up ─────────────────────────────────────────────────────
  @ApiOperation({ summary: "Sign up", description: "Create account, set cookies, return full user DTO." })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({ status: 201, type: CurrentUserDto })
  @Throttle({ strict: { limit: 3, ttl: 60_000 } })
  @Public()
  @UsePipes(new ValidationPipe())
  @Post("sign-up")
  async signUp(
    @Body() dto: SignUpDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CurrentUserDto> {
    // 1. Create user
    const createResult = await this.commandBus.execute(
      new CreateUserCommand({
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email,
        password: dto.password,
        repassword: dto.repassword,
        status: Status.ACTIVE,
        role_ids: dto.role_ids,
      }),
    )
    if (!createResult.isOk) throw createResult.error

    // 2. Sign in to generate tokens
    const signInResult = await this.commandBus.execute(
      new SignInCommand(dto.email, dto.password),
    )
    if (!signInResult.isOk) throw signInResult.error
    this.setCookies(res, signInResult.value.access_token, signInResult.value.refresh_token)

    // 3. Return enriched DTO (roles + permissions in one query)
    const meResult = await this.queryBus.execute(
      new GetCurrentUserQuery(createResult.value.id),
    )
    if (!meResult.isOk) throw meResult.error
    return meResult.value
  }

  // ─── POST /auth/sign-in ─────────────────────────────────────────────────────
  @ApiOperation({ summary: "Sign in" })
  @ApiBody({ type: SignInDto })
  @ApiCookieAuth()
  @ApiResponse({ status: 200, description: "Signed in — cookies set, OR requires_2fa: true with pending token" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("sign-in")
  async signIn(@Body() payload: SignInDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.commandBus.execute(new SignInCommand(payload.email, payload.password))
    if (!result.isOk) throw result.error

    if (result.value.requires_2fa) {
      // 2FA required — return pending token, no cookies
      return { requires_2fa: true, totp_pending_token: result.value.totp_pending_token }
    }

    this.setCookies(res, result.value.access_token, result.value.refresh_token)
    return { message: "Signed in successfully" }
  }

  // ─── POST /auth/refresh ─────────────────────────────────────────────────────
  @ApiOperation({ summary: "Refresh tokens" })
  @ApiCookieAuth()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Public()
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) throw new UnauthorizedException("Refresh token is required")

    const payload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get("jwtRefreshSecretKey"),
    })

    const userResult = await this.queryBus.execute(new FindUserByIdQuery(payload.sub))
    if (!userResult.isOk || !userResult.value) throw new UnauthorizedException("Invalid refresh token")

    const result = await this.commandBus.execute(
      new GenerateTokenPairCommand(userResult.value, refreshToken),
    )
    if (!result.isOk) throw result.error

    this.setCookies(res, result.value.access_token, result.value.refresh_token)
    return { message: "Tokens refreshed successfully" }
  }

  // ─── GET /auth/me ───────────────────────────────────────────────────────────
  @ApiOperation({ summary: "Current user" })
  @ApiBearerAuth("JWT")
  @ApiResponse({ status: 200, type: CurrentUserDto })
  @SkipThrottle()
  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: any): Promise<CurrentUserDto> {
    const result = await this.queryBus.execute(new GetCurrentUserQuery(user.sub))
    if (!result.isOk) throw result.error
    return result.value
  }

  // ─── POST /auth/sign-out ────────────────────────────────────────────────────
  @ApiOperation({ summary: "Sign out" })
  @ApiBearerAuth("JWT")
  @ApiCookieAuth()
  @Post("sign-out")
  @UseGuards(JwtAuthGuard)
  async signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: any,
  ) {
    const refreshToken = req.cookies?.refreshToken
    if (!refreshToken) throw new UnauthorizedException("Refresh token is required")

    const result = await this.commandBus.execute(new SignOutCommand(user.sub, refreshToken))
    if (!result.isOk) throw result.error

    this.clearCookies(res)
    return { message: "Signed out successfully" }
  }

  // ─── POST /auth/verify-email ─────────────────────────────────────────────────
  @ApiOperation({ summary: "Verify email address with token" })
  @ApiResponse({ status: 200 })
  @Public()
  @UsePipes(new ValidationPipe())
  @Post("verify-email")
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    const result = await this.commandBus.execute(new VerifyEmailCommand(dto.token))
    if (!result.isOk) throw result.error
    return { message: "Email verified" }
  }

  // ─── POST /auth/forgot-password ──────────────────────────────────────────────
  @ApiOperation({ summary: "Request a password reset link" })
  @ApiResponse({ status: 200 })
  @Public()
  @UsePipes(new ValidationPipe())
  @Throttle({ strict: { limit: 3, ttl: 60_000 } })
  @Post("forgot-password")
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    // Fire and forget — never expose whether the email exists
    this.commandBus.execute(new ForgotPasswordCommand(dto.email)).catch(() => {})
    return { message: "If that email exists, a reset link has been sent" }
  }

  // ─── POST /auth/reset-password ───────────────────────────────────────────────
  @ApiOperation({ summary: "Reset password using token from email" })
  @ApiResponse({ status: 200 })
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Public()
  @UsePipes(new ValidationPipe())
  @Post("reset-password")
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    const result = await this.commandBus.execute(
      new ResetPasswordCommand(dto.token, dto.password, dto.repassword),
    )
    if (!result.isOk) throw result.error
    return { message: "Password reset successfully" }
  }

  // ─── GET /auth/sessions ───────────────────────────────────────────────────────
  @ApiOperation({ summary: "List active sessions for current user" })
  @ApiResponse({ status: 200, type: [RefreshTokenDto] })
  @UseGuards(JwtAuthGuard)
  @Get("sessions")
  async listSessions(@CurrentUser() user: any): Promise<RefreshTokenDto[]> {
    const result = await this.queryBus.execute(new ListUserSessionsQuery(user.sub))
    if (!result.isOk) throw result.error
    return result.value
  }

  // ─── DELETE /auth/sessions/:id ────────────────────────────────────────────────
  @ApiOperation({ summary: "Revoke a specific session" })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @Delete("sessions/:id")
  async revokeSession(
    @Param("id") id: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    const result = await this.commandBus.execute(new RevokeSessionCommand(user.sub, id))
    if (!result.isOk) throw result.error
    return { message: "Session revoked" }
  }

  // ─── DELETE /auth/sessions ────────────────────────────────────────────────────
  @ApiOperation({ summary: "Revoke all other sessions" })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @Delete("sessions")
  async revokeAllSessions(
    @Req() req: Request,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    const currentToken = (req as any).cookies?.refreshToken as string | undefined
    const result = await this.commandBus.execute(
      new RevokeAllSessionsCommand(user.sub, currentToken),
    )
    if (!result.isOk) throw result.error
    return { message: "All other sessions revoked" }
  }

  // ════════════════════════════════════════════════════════════════
  // 2FA / TOTP
  // ════════════════════════════════════════════════════════════════

  // ─── POST /auth/2fa/verify-login ─────────────────────────────────────────────
  @ApiOperation({ summary: "Complete sign-in with 2FA code or recovery code" })
  @ApiBody({ type: TotpVerifyLoginDto })
  @ApiResponse({ status: 200, description: "Signed in — cookies set" })
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Public()
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("2fa/verify-login")
  async verifyTotpLogin(
    @Body() dto: TotpVerifyLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.commandBus.execute(
      new VerifyTotpLoginCommand(dto.pending_token, dto.code),
    )
    if (!result.isOk) throw result.error
    this.setCookies(res, result.value.access_token, result.value.refresh_token)
    return { message: "Signed in successfully" }
  }

  // ─── GET /auth/2fa/status ─────────────────────────────────────────────────────
  @ApiOperation({ summary: "Get current user's 2FA status" })
  @ApiResponse({ status: 200, type: TotpStatusDto })
  @UseGuards(JwtAuthGuard)
  @Get("2fa/status")
  async totpStatus(@CurrentUser() user: any): Promise<TotpStatusDto> {
    const row = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { totp_enabled: true, totp_enabled_at: true },
    })
    const remaining = await this.prisma.userRecoveryCode.count({
      where: { user_id: user.sub, used_at: null },
    })
    return {
      totp_enabled: row?.totp_enabled ?? false,
      totp_enabled_at: row?.totp_enabled_at ?? null,
      recovery_codes_remaining: remaining,
    }
  }

  // ─── POST /auth/2fa/setup ─────────────────────────────────────────────────────
  @ApiOperation({ summary: "Generate a new TOTP secret and return the otpauth:// URI" })
  @ApiResponse({ status: 200, type: TotpSetupResponseDto })
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post("2fa/setup")
  async setupTotp(@CurrentUser() user: any): Promise<TotpSetupResponseDto> {
    const result = await this.commandBus.execute(new SetupTotpCommand(user.sub))
    if (!result.isOk) throw result.error
    return result.value
  }

  // ─── POST /auth/2fa/enable ────────────────────────────────────────────────────
  @ApiOperation({ summary: "Enable 2FA — verify code and return one-time recovery codes" })
  @ApiBody({ type: TotpCodeDto })
  @ApiResponse({ status: 200, type: TotpEnableResponseDto })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("2fa/enable")
  async enableTotp(
    @CurrentUser() user: any,
    @Body() dto: TotpCodeDto,
  ): Promise<TotpEnableResponseDto> {
    const result = await this.commandBus.execute(new EnableTotpCommand(user.sub, dto.code))
    if (!result.isOk) throw result.error
    return result.value
  }

  // ─── POST /auth/2fa/disable ───────────────────────────────────────────────────
  @ApiOperation({ summary: "Disable 2FA (requires current TOTP code or recovery code)" })
  @ApiBody({ type: TotpCodeDto })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("2fa/disable")
  async disableTotp(
    @CurrentUser() user: any,
    @Body() dto: TotpCodeDto,
  ): Promise<{ message: string }> {
    const result = await this.commandBus.execute(new DisableTotpCommand(user.sub, dto.code))
    if (!result.isOk) throw result.error
    return { message: "2FA disabled" }
  }

  // ─── POST /auth/2fa/recovery-codes/regenerate ─────────────────────────────────
  @ApiOperation({ summary: "Regenerate recovery codes (requires current TOTP code)" })
  @ApiBody({ type: TotpCodeDto })
  @ApiResponse({ status: 200, type: TotpEnableResponseDto })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("2fa/recovery-codes/regenerate")
  async regenerateRecoveryCodes(
    @CurrentUser() user: any,
    @Body() dto: TotpCodeDto,
  ): Promise<TotpEnableResponseDto> {
    const result = await this.commandBus.execute(
      new RegenerateRecoveryCodesCommand(user.sub, dto.code),
    )
    if (!result.isOk) throw result.error
    return result.value
  }
}
