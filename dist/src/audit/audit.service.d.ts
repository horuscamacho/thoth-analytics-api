import { PrismaService } from '../database/prisma.service';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { CreateAuditLogDto, AuditFiltersDto } from './dto';
import { IAuditLog, IAuditStats, IAuditAnomaly, IIntegrityReport } from './interfaces/audit.interfaces';
export declare class AuditService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createAuditLog(data: CreateAuditLogDto): Promise<IAuditLog>;
    getLogs(tenantId: string, filters: AuditFiltersDto): Promise<{
        logs: IAuditLog[];
        total: number;
    }>;
    getAuditStats(tenantId: string): Promise<IAuditStats>;
    detectAnomalies(tenantId: string): Promise<IAuditAnomaly[]>;
    verifyIntegrity(tenantId: string): Promise<IIntegrityReport>;
    exportLogs(tenantId: string, filters: AuditFiltersDto, format: 'csv' | 'json' | 'pdf'): Promise<Buffer>;
    private generateCSV;
    private generatePDF;
    logAction(tenantId: string, userId: string | null, action: AuditAction, entityType: AuditEntityType, entityId?: string, oldValues?: any, newValues?: any, metadata?: any, request?: any): Promise<void>;
}
