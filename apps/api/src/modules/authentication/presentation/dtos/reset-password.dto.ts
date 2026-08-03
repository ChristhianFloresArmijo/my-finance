import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsString, Matches, MinLength } from "class-validator"

export class ResetPasswordDto {
  @ApiProperty() @IsNotEmpty() @IsString() token: string
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[^\w\d\s:])([^\s]){8,}$/, {
    message: "password must contain uppercase, lowercase, number and special character",
  })
  password: string
  @ApiProperty() @IsNotEmpty() @IsString() repassword: string
}
