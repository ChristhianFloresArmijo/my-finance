import { Body, Controller, Put, Param, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common"
import { CommandBus } from "@nestjs/cqrs"
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "@auth/capabilities/guards"
import { IsOwnerGuard } from "@authorization/capabilities/guards"
import { CurrentUserPreferencesDto } from "@auth/presentation/dtos"
import { UpdatePreferencesDto } from "@account/presentation/dtos"
import { UpdatePreferencesCommand } from "@account/capabilities/commands"

@ApiTags("account/preferences")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard, IsOwnerGuard)
@Controller("account/:userId/preferences")
export class UserPreferencesController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({ summary: "Update preferences" })
  @ApiParam({ name: "userId", description: "User UUID" })
  @ApiResponse({ status: 200, type: CurrentUserPreferencesDto })
  @UsePipes(new ValidationPipe())
  @Put()
  async update(
    @Param("userId") userId: string,
    @Body() dto: UpdatePreferencesDto,
  ): Promise<CurrentUserPreferencesDto> {
    const result = await this.commandBus.execute(new UpdatePreferencesCommand(userId, dto))
    if (!result.isOk) throw result.error
    return result.value
  }
}
