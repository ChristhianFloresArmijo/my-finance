import { ApiProperty } from "@nestjs/swagger"
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator"

export class AssignPermissionToUserDto {
  @ApiProperty({
    description: "User ID to grant the permission to",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  user_id: string

  @ApiProperty({
    description: "Permission ID to grant",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  permission_id: string

  @ApiProperty({
    description: "Optional expiration date for the permission assignment",
    example: "2025-12-31T23:59:59Z",
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expires_at?: string
}
