import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString, IsUUID } from "class-validator"

export class AssignPermissionToRoleDto {
  @ApiProperty({
    description: "Permission ID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  permission_id: string
}
