import { Injectable } from "@nestjs/common"
import { PrismaService } from "../modules/shared/integration/services/prisma.service"

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase(): Promise<{ status: string; responseTime?: number; error?: string }> {
    const startTime = Date.now()
    try {
      await this.prisma.$queryRaw`SELECT 1`
      const responseTime = Date.now() - startTime
      return { status: "healthy", responseTime }
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
      }
    }
  }

  getMemoryUsage() {
    const usage = process.memoryUsage()
    return {
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    }
  }

  getUptime() {
    const uptime = process.uptime()
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = Math.floor(uptime % 60)
    return `${hours}h ${minutes}m ${seconds}s`
  }
}
