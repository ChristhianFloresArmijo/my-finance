import { Controller, Get, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from "@nestjs/common"
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger"
import { JwtAuthGuard } from "@auth/capabilities/guards"
import { RolesGuard } from "@authorization/capabilities/guards"
import { RequireRole } from "@authorization/presentation/decorators"
import { PrismaService } from "@shared/integration/services"

export interface AuditLogEntry {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  performed_by: string | null
  payload: unknown
  created_at: Date
}

export interface PaginatedAuditLogs {
  items: AuditLogEntry[]
  total: number
  limit: number
  offset: number
}

@ApiTags("admin")
@ApiBearerAuth("JWT")
@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRole("superadmin")
@Controller("admin")
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: "List audit log entries (superadmin)" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiQuery({ name: "action", required: false, type: String })
  @ApiQuery({ name: "entity_type", required: false, type: String })
  @ApiQuery({ name: "performed_by", required: false, type: String })
  @Get("audit")
  async listAuditLogs(
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query("offset", new DefaultValuePipe(0), ParseIntPipe) offset: number,
    @Query("action") action?: string,
    @Query("entity_type") entity_type?: string,
    @Query("performed_by") performed_by?: string,
  ): Promise<PaginatedAuditLogs> {
    const where: Record<string, any> = {}
    if (action) where.action = { contains: action, mode: "insensitive" }
    if (entity_type) where.entity_type = entity_type
    if (performed_by) where.performed_by = performed_by

    const [items, total] = await Promise.all([
      this.prisma.changeLog.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: Math.min(limit, 200),
        skip: offset,
      }),
      this.prisma.changeLog.count({ where }),
    ])

    return { items, total, limit, offset }
  }
}
