import { Injectable, NestMiddleware, Logger } from "@nestjs/common"
import { Request, Response, NextFunction } from "express"

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP")

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req
    const userAgent = req.get("user-agent") || ""
    const requestId = req["id"] || "unknown"
    const startTime = Date.now()

    // Log incoming request
    this.logger.log(`➡️  [${requestId}] ${method} ${originalUrl} - ${ip} - ${userAgent}`)

    // Log response when finished
    res.on("finish", () => {
      const { statusCode } = res
      const duration = Date.now() - startTime
      const contentLength = res.get("content-length") || 0

      const emoji = statusCode >= 400 ? "❌" : "✅"
      const logMethod = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "log"

      this.logger[logMethod](
        `${emoji} [${requestId}] ${method} ${originalUrl} ${statusCode} - ${duration}ms - ${contentLength}bytes`,
      )
    })

    next()
  }
}
