import { Controller, Get, HttpStatus, HttpException } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger"
import { HealthService } from "./health.service"
import { Public } from "../modules/authentication/presentation/decorators"

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public() // Allow unauthenticated access
  @ApiOperation({ summary: "Full health check with database and memory stats" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  @ApiResponse({ status: 503, description: "Service is unhealthy" })
  async health() {
    const database = await this.healthService.checkDatabase()
    const memory = this.healthService.getMemoryUsage()
    const uptime = this.healthService.getUptime()

    const isHealthy = database.status === "healthy"

    if (!isHealthy) {
      throw new HttpException(
        {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          uptime,
          database,
          memory,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime,
      database,
      memory,
    }
  }

  @Get("liveness")
  @Public()
  @ApiOperation({ summary: "Liveness probe - is the service running?" })
  @ApiResponse({ status: 200, description: "Service is alive" })
  async liveness() {
    return {
      status: "alive",
      timestamp: new Date().toISOString(),
    }
  }

  @Get("readiness")
  @Public()
  @ApiOperation({ summary: "Readiness probe - can the service handle traffic?" })
  @ApiResponse({ status: 200, description: "Service is ready" })
  @ApiResponse({ status: 503, description: "Service is not ready" })
  async readiness() {
    const database = await this.healthService.checkDatabase()

    if (database.status !== "healthy") {
      throw new HttpException(
        {
          status: "not_ready",
          reason: "Database is unavailable",
          database,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }

    return {
      status: "ready",
      timestamp: new Date().toISOString(),
    }
  }
}
