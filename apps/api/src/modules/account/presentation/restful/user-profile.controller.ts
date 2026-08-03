import {
  Body,
  Controller,
  Delete,
  Post,
  Put,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common"
import { CommandBus } from "@nestjs/cqrs"
import { FileInterceptor } from "@nestjs/platform-express"
import { memoryStorage } from "multer"
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger"
import { JwtAuthGuard } from "@auth/capabilities/guards"
import { IsOwnerGuard } from "@authorization/capabilities/guards"
import { CurrentUserProfileDto } from "@auth/presentation/dtos"
import { UpdateProfileDto } from "@account/presentation/dtos"
import {
  UpdateProfileCommand,
  UploadAvatarCommand,
  DeleteAvatarCommand,
} from "@account/capabilities/commands"

@ApiTags("account/profile")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard, IsOwnerGuard)
@Controller("account/:userId/profile")
export class UserProfileController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiOperation({ summary: "Update extended profile" })
  @ApiParam({ name: "userId", description: "User UUID" })
  @ApiResponse({ status: 200, type: CurrentUserProfileDto })
  @UsePipes(new ValidationPipe())
  @Put()
  async update(
    @Param("userId") userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<CurrentUserProfileDto> {
    const result = await this.commandBus.execute(new UpdateProfileCommand(userId, dto))
    if (!result.isOk) throw result.error
    return result.value
  }

  @ApiOperation({ summary: "Upload avatar" })
  @ApiParam({ name: "userId", description: "User UUID" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { avatar: { type: "string", format: "binary" } },
      required: ["avatar"],
    },
  })
  @ApiResponse({ status: 201 })
  @UseInterceptors(FileInterceptor("avatar", { storage: memoryStorage() }))
  @Post("avatar")
  async uploadAvatar(
    @Param("userId") userId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ avatar: string }> {
    const result = await this.commandBus.execute(new UploadAvatarCommand(userId, file))
    if (!result.isOk) throw result.error
    return { avatar: result.value }
  }

  @ApiOperation({ summary: "Delete avatar" })
  @ApiParam({ name: "userId", description: "User UUID" })
  @ApiResponse({ status: 200 })
  @Delete("avatar")
  async deleteAvatar(@Param("userId") userId: string): Promise<{ message: string }> {
    const result = await this.commandBus.execute(new DeleteAvatarCommand(userId))
    if (!result.isOk) throw result.error
    return { message: "Avatar deleted" }
  }
}
