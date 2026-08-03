import { ApiProperty } from "@nestjs/swagger"
import { IsEmail, IsNotEmpty, IsString } from "class-validator"

export class SignInDto {
  @ApiProperty({ example: "admin@admin.com" })
  @IsEmail(undefined, { message: "Invalid email" })
  @IsNotEmpty()
  email: string

  @ApiProperty({ example: "DevAdmin123!" })
  @IsNotEmpty()
  @IsString()
  password: string
}
