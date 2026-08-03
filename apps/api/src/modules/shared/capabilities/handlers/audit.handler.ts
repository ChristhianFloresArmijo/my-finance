import { EventsHandler, IEventHandler } from "@nestjs/cqrs"
import { Logger } from "@nestjs/common"
import { AuditEvent } from "@shared/capabilities/events"
import { IChangeLogRepository } from "@shared/business/repositories"
import { ChangeLog } from "@shared/business/entities/change-log.entity"

/**
 * Subscribes to AuditEvent and writes a row to change_logs.
 * Failures are logged but never rethrown — the audit trail must not break the main operation.
 */
@EventsHandler(AuditEvent)
export class AuditHandler implements IEventHandler<AuditEvent> {
  private readonly logger = new Logger(AuditHandler.name)

  constructor(private readonly changeLogRepository: IChangeLogRepository) {}

  async handle(event: AuditEvent): Promise<void> {
    try {
      const entityResult = ChangeLog.instance({
        action: event.action,
        entity_type: event.entityType,
        entity_id: event.entityId ?? null,
        performed_by: event.performedBy ?? null,
        payload: event.payload ?? null,
      })

      if (!entityResult.isOk) {
        this.logger.warn(`Audit entity build failed for action "${event.action}"`, entityResult.error)
        return
      }

      const result = await this.changeLogRepository.save(entityResult.value)

      if (!result.isOk) {
        this.logger.warn(`Audit log write failed for action "${event.action}"`, result.error)
      }
    } catch (error) {
      this.logger.error(`Unexpected error writing audit log for "${event.action}"`, error)
    }
  }
}
