import { AuditAction, AuditEntityType, SecurityLevel } from '@prisma/client';
export declare class AuditFiltersDto {
    userId?: string;
    action?: AuditAction;
    entityType?: AuditEntityType;
    entityId?: string;
    startDate?: string;
    endDate?: string;
    ipAddress?: string;
    securityLevel?: SecurityLevel;
    limit?: number;
    offset?: number;
    search?: string;
}
