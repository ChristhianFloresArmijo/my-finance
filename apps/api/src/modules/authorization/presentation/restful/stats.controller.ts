import { Controller, Get, UseGuards } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "@auth/capabilities/guards"
import { PrismaService } from "@shared/integration/services"

@ApiTags("admin")
@ApiBearerAuth("JWT")
@Controller("admin")
export class StatsController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: "Get aggregate counts for the admin dashboard" })
  @UseGuards(JwtAuthGuard)
  @Get("stats")
  async getStats() {
    const rootAdminEmail = process.env.ROOT_ADMIN_EMAIL
    const userWhere: Record<string, any> = { status: { not: "DELETED" } }
    if (rootAdminEmail) {
      userWhere["email"] = { not: rootAdminEmail }
    }

    const [totalUsers, activeUsers, totalRoles, totalPermissions] = await Promise.all([
      this.prisma.user.count({ where: userWhere }),
      this.prisma.user.count({ where: { ...userWhere, status: "ACTIVE" } }),
      this.prisma.role.count({ where: { status: { not: "DELETED" } } }),
      this.prisma.permission.count({ where: { status: { not: "DELETED" } } }),
    ])

    return { totalUsers, activeUsers, totalRoles, totalPermissions }
  }
}
