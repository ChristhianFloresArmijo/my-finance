import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common"
import { Request, Response } from "express"
import { ConfigService } from "@nestjs/config"

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  constructor(private readonly configService: ConfigService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const requestId = request["id"] || "unknown"

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR

    const message =
      exception instanceof HttpException ? exception.getResponse() : "Internal server error"

    // Build error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId,
      ...(typeof message === "string" ? { message } : (message as object)),
    }

    // Log error with full context
    if (status >= 500) {
      this.logger.error(
        `❌ [${requestId}] ${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      )
    } else {
      this.logger.warn(
        `⚠️  [${requestId}] ${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
      )
    }

    // Hide internal errors in production
    const isDevelopment = this.configService.get<string>("nodeEnv") !== "production"
    if (status >= 500 && !isDevelopment) {
      errorResponse["message"] = "Internal server error"
      delete errorResponse["error"]
      delete errorResponse["stack"]
    }

    response.status(status).json(errorResponse)
  }
}
