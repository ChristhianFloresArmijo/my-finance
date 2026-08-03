import { EventBus } from "@nestjs/cqrs"
import { AuditEvent } from "@shared/capabilities/events"
import { HandlerError, Result } from "@shared/business/utils/error-handling"

/**
 * Template Method base for all mutating command handlers.
 *
 * Subclasses implement `executeCommand()` for business logic and override
 * `getEntityId()` / `getPerformedBy()` / `getSafePayload()` as needed.
 * On success the handler emits an `AuditEvent` via the EventBus —
 * the `AuditHandler` subscriber persists it to `change_logs`.
 *
 * Note: `implements ICommandHandler` is omitted here — TypeScript rejects it
 * with generic union return types. The `@CommandHandler` decorator on each
 * subclass is what NestJS CQRS uses for registration; duck typing satisfies
 * the interface contract at runtime.
 */
export abstract class AuditableCommandHandler<TCommand, TValue> {
  constructor(protected readonly eventBus: EventBus) {}

  async execute(command: TCommand): Promise<Result<TValue, HandlerError>> {
    const result = await this.executeCommand(command)

    if (result.isOk) {
      this.eventBus.publish(
        new AuditEvent(
          this.getAction(),
          this.getEntityType(),
          this.getEntityId(command, result.value),
          this.getPerformedBy(command),
          this.getSafePayload(command),
        ),
      )
    }

    return result
  }

  /** Business logic — implement in each handler. */
  protected abstract executeCommand(command: TCommand): Promise<Result<TValue, HandlerError>>

  /** Verb-noun slug written to `change_logs.action`. e.g. "create-role" */
  protected abstract getAction(): string

  /** Domain entity name. e.g. "Role", "UserRole", "Permission" */
  protected abstract getEntityType(): string

  /** ID of the created/modified/deleted record.  Return null when not applicable. */
  protected getEntityId(_command: TCommand, _value: TValue): string | null {
    return null
  }

  /** User ID of the actor (usually from `command.data.assigned_by` or similar). */
  protected getPerformedBy(_command: TCommand): string | null {
    return null
  }

  /**
   * Subset of command data safe to persist (no passwords, no tokens).
   * Return null to skip payload logging.
   */
  protected getSafePayload(_command: TCommand): Record<string, unknown> | null {
    return null
  }
}
