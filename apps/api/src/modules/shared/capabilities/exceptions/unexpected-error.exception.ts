import { HttpException, HttpStatus } from "@nestjs/common"

export class UnexpectedErrorException extends HttpException {
  constructor(message?: string) {
    super(
      { message: message ? message : "An unexpected error occurred" },
      HttpStatus.INTERNAL_SERVER_ERROR,
    )
  }
}
