import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common"
import { CommandBus, QueryBus } from "@nestjs/cqrs"
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger"
import { Response } from "express"
import {
  NewUserSerializer,
  UpdateAccountDto,
  ChangePasswordDto,
  DeleteAccountDto,
} from "@account/presentation/dtos"
import { HandlerError, Result } from "@shared/business/utils/error-handling"
import { User } from "@account/business/entities"
import { CurrentUserDto } from "@auth/presentation/dtos"
import { PaginatedResults } from "@shared/business/utils/pagination.dto"
import {
  CreateUserCommand,
  UpdateAccountCommand,
  ChangePasswordCommand,
  DeleteAccountCommand,
  UpdateUserStatusCommand,
} from "@account/capabilities/commands"
import { FindUserByIdQuery, ListUsersQuery } from "@account/capabilities/queries"
import { ListUserSessionsQuery } from "@auth/capabilities/queries"
import {
  RevokeSessionCommand,
  RevokeAllSessionsCommand,
  AdminDisable2faCommand,
} from "@auth/capabilities/commands"
import { RefreshTokenDto } from "@auth/presentation/dtos"
import { JwtAuthGuard } from "@auth/capabilities/guards"
import { RolesGuard, IsOwnerGuard } from "@authorization/capabilities/guards"
import { RequireRole } from "@authorization/presentation/decorators"
import { Public, CurrentUser } from "@auth/presentation/decorators"
import { PrismaService } from "@shared/integration/services/prisma.service"

@ApiTags("account")
@ApiBearerAuth("JWT")
@Controller("account")
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({
    summary: "Create user",
    description: "Register a new user account (public endpoint)",
  })
  @ApiResponse({ status: 201, description: "User created successfully" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 409, description: "Email already in use" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Public()
  @Post()
  async create(@Body() data: NewUserSerializer) {
    const result = await this.commandBus.execute<CreateUserCommand, Result<User, HandlerError>>(
      new CreateUserCommand(data),
    )
    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "List users", description: "Paginated list of all users" })
  @ApiResponse({ status: 200, description: "Paginated user list" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UsePipes(new ValidationPipe())
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("admin", "superadmin")
  @Get()
  async list(
    @Query()
    query: {
      limit?: string
      offset?: string
      search?: string
      status?: string
      role?: string
    },
  ) {
    const result = await this.queryBus.execute<
      ListUsersQuery,
      Result<PaginatedResults<User[]>, HandlerError>
    >(
      new ListUsersQuery({
        limit: query.limit !== undefined ? Number(query.limit) : undefined,
        offset: query.offset !== undefined ? Number(query.offset) : undefined,
        search: query.search,
        status: query.status,
        role: query.role,
      }),
    )
    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Get user by ID" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: "User not found" })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("admin", "superadmin")
  @Get(":id")
  async retrieve(@Param("id") id: string): Promise<CurrentUserDto> {
    const result = await this.queryBus.execute<
      FindUserByIdQuery,
      Result<CurrentUserDto, HandlerError>
    >(new FindUserByIdQuery(id))
    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Update account identity fields" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("admin", "superadmin")
  @UsePipes(new ValidationPipe())
  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateAccountDto): Promise<User> {
    const result = await this.commandBus.execute(new UpdateAccountCommand(id, dto))
    if (!result.isOk) throw result.error
    return result.value
  }

  @ApiOperation({ summary: "Change password" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("superadmin")
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post(":id/password")
  async changePassword(
    @Param("id") id: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const result = await this.commandBus.execute(new ChangePasswordCommand(id, dto))
    if (!result.isOk) throw result.error
    return { message: "Password updated" }
  }

  @ApiOperation({ summary: "Suspend a user account (admin)" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: "User not found" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("superadmin")
  @HttpCode(200)
  @Post(":id/suspend")
  async suspend(@Param("id") id: string): Promise<{ message: string }> {
    const result = await this.commandBus.execute(new UpdateUserStatusCommand(id, "SUSPENDED"))
    if (!result.isOk) throw result.error
    return { message: "User suspended" }
  }

  @ApiOperation({ summary: "Activate a user account (admin)" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: "User not found" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("superadmin")
  @HttpCode(200)
  @Post(":id/activate")
  async activate(@Param("id") id: string): Promise<{ message: string }> {
    const result = await this.commandBus.execute(new UpdateUserStatusCommand(id, "ACTIVE"))
    if (!result.isOk) throw result.error
    return { message: "User activated" }
  }

  @ApiOperation({ summary: "Soft-delete own account" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, IsOwnerGuard)
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post(":id/delete")
  async deleteAccount(
    @Param("id") id: string,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const result = await this.commandBus.execute(new DeleteAccountCommand(id, dto.password))
    if (!result.isOk) throw result.error
    res.clearCookie("accessToken")
    res.clearCookie("refreshToken")
    return { message: "Account deleted" }
  }

  // ─── Self-service /me shortcuts ────────────────────────────────────────────

  @ApiOperation({ summary: "Get own profile" })
  @ApiResponse({ status: 200 })
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Get("me")
  async getMe(@CurrentUser() user: { sub: string }): Promise<CurrentUserDto> {
    const result = await this.queryBus.execute<
      FindUserByIdQuery,
      Result<CurrentUserDto, HandlerError>
    >(new FindUserByIdQuery(user.sub))
    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Update own account" })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @Put("me")
  async updateMe(
    @CurrentUser() user: { sub: string },
    @Body() dto: UpdateAccountDto,
  ): Promise<User> {
    const result = await this.commandBus.execute(new UpdateAccountCommand(user.sub, dto))
    if (!result.isOk) throw result.error
    return result.value
  }

  @ApiOperation({ summary: "Change own password" })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Post("me/password")
  async changeMyPassword(
    @CurrentUser() user: { sub: string },
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const result = await this.commandBus.execute(new ChangePasswordCommand(user.sub, dto))
    if (!result.isOk) throw result.error
    return { message: "Password updated" }
  }

  @ApiOperation({ summary: "List own active sessions" })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @Get("me/sessions")
  async listMySessions(@CurrentUser() user: { sub: string }): Promise<RefreshTokenDto[]> {
    const result = await this.queryBus.execute<
      ListUserSessionsQuery,
      Result<RefreshTokenDto[], HandlerError>
    >(new ListUserSessionsQuery(user.sub))
    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Revoke one of own sessions" })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Delete("me/sessions/:sessionId")
  async revokeMySession(
    @CurrentUser() user: { sub: string },
    @Param("sessionId") sessionId: string,
  ): Promise<{ message: string }> {
    const result = await this.commandBus.execute<RevokeSessionCommand, Result<true, HandlerError>>(
      new RevokeSessionCommand(user.sub, sessionId),
    )
    if (result.isOk) return { message: "Session revoked" }
    throw result.error
  }

  // ─── Sessions (superadmin) ──────────────────────────────────────────────────

  @ApiOperation({ summary: "List active sessions for a user (admin)" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200, description: "Active sessions" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("superadmin")
  @HttpCode(200)
  @Get(":id/sessions")
  async listSessions(@Param("id") id: string): Promise<RefreshTokenDto[]> {
    const result = await this.queryBus.execute<
      ListUserSessionsQuery,
      Result<RefreshTokenDto[], HandlerError>
    >(new ListUserSessionsQuery(id))
    if (result.isOk) return result.value
    throw result.error
  }

  @ApiOperation({ summary: "Revoke a specific session for a user (admin)" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiParam({ name: "sessionId", description: "Session (refresh token) ID" })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("superadmin")
  @HttpCode(200)
  @Delete(":id/sessions/:sessionId")
  async revokeSession(
    @Param("id") id: string,
    @Param("sessionId") sessionId: string,
  ): Promise<{ message: string }> {
    const result = await this.commandBus.execute<RevokeSessionCommand, Result<true, HandlerError>>(
      new RevokeSessionCommand(id, sessionId),
    )
    if (result.isOk) return { message: "Session revoked" }
    throw result.error
  }

  @ApiOperation({ summary: "Revoke all sessions for a user (admin)" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("superadmin")
  @HttpCode(200)
  @Delete(":id/sessions")
  async revokeAllSessions(@Param("id") id: string): Promise<{ message: string }> {
    const result = await this.commandBus.execute<
      RevokeAllSessionsCommand,
      Result<true, HandlerError>
    >(new RevokeAllSessionsCommand(id, undefined))
    if (result.isOk) return { message: "All sessions revoked" }
    throw result.error
  }

  @ApiOperation({ summary: "Get 2FA status for a user (superadmin)" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("superadmin")
  @Get(":id/2fa-status")
  async get2faStatus(@Param("id") id: string): Promise<{
    totp_enabled: boolean
    totp_enabled_at: Date | null
    recovery_codes_remaining: number
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { totp_enabled: true, totp_enabled_at: true },
    })
    const remaining = await this.prisma.userRecoveryCode.count({
      where: { user_id: id, used_at: null },
    })
    return {
      totp_enabled: user?.totp_enabled ?? false,
      totp_enabled_at: user?.totp_enabled_at ?? null,
      recovery_codes_remaining: remaining,
    }
  }

  @ApiOperation({ summary: "Force-disable 2FA for a user (superadmin)" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRole("superadmin")
  @HttpCode(200)
  @Delete(":id/2fa")
  async adminDisable2fa(@Param("id") id: string): Promise<{ message: string }> {
    const result = await this.commandBus.execute<
      AdminDisable2faCommand,
      Result<true, HandlerError>
    >(new AdminDisable2faCommand(id))
    if (result.isOk) return { message: "2FA disabled" }
    throw result.error
  }
}
