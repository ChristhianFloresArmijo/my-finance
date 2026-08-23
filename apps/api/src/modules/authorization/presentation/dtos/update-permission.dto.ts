import { ApiProperty } from "@nestjs/swagger"
import { IsBoolean, IsOptional, IsString } from "class-validator"
import { Status } from "@database/prisma/generated-client"

export class UpdatePermissionDto {
  @ApiProperty({
    description: "Permission description",
    example: "Allows creating new users",
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({
    description: "Status of the permission",
    enum: Status,
    example: Status.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsString()
  status?: Status

  @ApiProperty({
    description: "Whether this is a system permission (shows System badge)",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_system?: boolean
}
