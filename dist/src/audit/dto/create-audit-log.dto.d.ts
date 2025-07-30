import { AuditAction, AuditEntityType, SecurityLevel } from '@prisma/client';
export declare class CreateAuditLogDto {
    tenantId: string;
    userId?: string | null | undefined;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId?: string | undefined;
    oldValues?: any;
    newValues?: any;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    clientFingerprint?: string;
    securityLevel?: SecurityLevel;
}
