import { HttpException, HttpStatus, Inject, Scope } from "@nestjs/common"
import { PipeTransform, Injectable, ArgumentMetadata } from "@nestjs/common"
import { ErrorCollection, Result } from "../utils/error-handling"
import { REQUEST } from "@nestjs/core"

export class ValidationException extends HttpException {
  constructor(public validationErrors: Record<string, string[]>) {
    super(validationErrors, HttpStatus.BAD_REQUEST)
  }
}

@Injectable({ scope: Scope.REQUEST })
export class CustomValidationPipe implements PipeTransform {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  transform(value: any, metadata: ArgumentMetadata) {
    const httpMethod = this.request.method

    if (metadata.type !== "body") {
      return value
    }

    if (httpMethod === "POST" || httpMethod === "PUT") {
      if ((metadata.metatype as any)?.validate === undefined) {
        return value
      }

      const result: Result<any, ErrorCollection> = (metadata.metatype as any).validate(value)

      if (result.isOk === false) {
        throw new ValidationException(result.error)
      }

      return value
    }

    if (httpMethod === "PATCH") {
      if ((metadata.metatype as any)?.partialValidate === undefined) {
        return value
      }

      const result: Result<any, ErrorCollection> = (metadata.metatype as any).partialValidate(value)

      if (result.isOk === false) {
        throw new ValidationException(result.error)
      }

      return value
    }

    return value
  }
}
