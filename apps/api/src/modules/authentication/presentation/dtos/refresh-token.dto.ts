import { ApiProperty } from "@nestjs/swagger"

export class SessionUserDto {
  @ApiProperty() id: string
  @ApiProperty() email: string
  @ApiProperty() first_name: string
  @ApiProperty() last_name: string
}

export class RefreshTokenDto {
  @ApiProperty() id: string
  @ApiProperty({ type: () => SessionUserDto }) user: SessionUserDto
  @ApiProperty() created_at: Date
  @ApiProperty() expires_at: Date
}
