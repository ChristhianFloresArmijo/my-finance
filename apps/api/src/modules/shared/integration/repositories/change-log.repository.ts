import { Injectable } from "@nestjs/common"
import { Prisma } from "@database/prisma/generated-client"
import { RepositoryService } from "@shared/integration/services"
import { ChangeLog } from "@shared/business/entities/change-log.entity"
import { IChangeLogRepository } from "@shared/business/repositories"
import { Result, failure } from "@shared/business/utils/error-handling"

@Injectable()
export class ChangeLogRepository
  extends RepositoryService<ChangeLog>
  implements IChangeLogRepository
{
  model = Prisma.ModelName.ChangeLog
  builder = ChangeLog

  /**
   * Override save to always INSERT (append-only audit log — no upsert).
   * Also handles the Prisma Json field correctly.
   */
  override async save<TypeError = any>(
    data: Partial<ChangeLog>,
  ): Promise<Result<ChangeLog, TypeError>> {
    try {
      const record = await this.client.changeLog.create({
        data: {
          id: data.id,
          action: data.action,
          entity_type: data.entity_type,
          entity_id: data.entity_id ?? null,
          performed_by: data.performed_by ?? null,
          // Prisma Json field needs explicit cast — payload is arbitrary JSON
          payload: (data.payload ?? undefined) as any,
          created_at: data.created_at,
        },
      })
      return this.builder.instance(record as any) as any
    } catch (error) {
      return failure({ save: [error.message || "Failed to write change log"] } as any)
    }
  }
}
