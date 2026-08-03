import { IEvent } from "@nestjs/cqrs"

export class AuditEvent implements IEvent {
  constructor(
    public readonly action: string,
    public readonly entityType: string,
    public readonly entityId: string | null,
    public readonly performedBy: string | null,
    public readonly payload: Record<string, unknown> | null,
  ) {}
}
