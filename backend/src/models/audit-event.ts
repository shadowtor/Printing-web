import prisma from "../db/client.js";

export type AuditEntityType = "order" | "payment" | "config" | "other";

export interface AuditEventInput {
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  actorId?: string;
  actorType?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export async function recordAuditEvent(input: AuditEventInput) {
  await prisma.auditEvent.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorId: input.actorId,
      actorType: input.actorType,
      oldValue: input.oldValue as object | undefined,
      newValue: input.newValue as object | undefined
    }
  });
}

