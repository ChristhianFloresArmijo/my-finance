import { ApiProperty } from "@nestjs/swagger"
import { Status } from "@database/prisma/generated-client"

export class UserDto {
  @ApiProperty() id: string
  @ApiProperty() first_name: string
  @ApiProperty() last_name: string
  @ApiProperty() full_name: string
  @ApiProperty() email: string
  @ApiProperty({ enum: Status }) status: Status
  @ApiProperty() email_verified_at: Date | null
  @ApiProperty() created_at: Date
  @ApiProperty() updated_at: Date | null
}
