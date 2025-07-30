import { Response } from 'express';
import { AuditService } from './audit.service';
import { AuditFiltersDto } from './dto';
interface ICurrentUser {
    id: string;
    email: string;
    tenantId: string;
    role: string;
}
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    getLogs(filters: AuditFiltersDto, currentUser: ICurrentUser): Promise<{
        message: string;
        data: import("./interfaces/audit.interfaces").IAuditLog[];
        pagination: {
            total: number;
            limit: number;
            offset: number;
        };
    }>;
    getLogById(id: string, currentUser: ICurrentUser): Promise<{
        message: string;
        data: import("./interfaces/audit.interfaces").IAuditLog;
    }>;
    getStats(currentUser: ICurrentUser): Promise<{
        message: string;
        data: import("./interfaces/audit.interfaces").IAuditStats;
    }>;
    getAnomalies(currentUser: ICurrentUser): Promise<{
        message: string;
        data: import("./interfaces/audit.interfaces").IAuditAnomaly[];
        total: number;
    }>;
    verifyIntegrity(currentUser: ICurrentUser): Promise<{
        message: string;
        data: import("./interfaces/audit.interfaces").IIntegrityReport;
    }>;
    exportLogs(format: string, filters: AuditFiltersDto, currentUser: ICurrentUser, res: Response): Promise<void>;
    getDashboardData(currentUser: ICurrentUser): Promise<{
        message: string;
        data: {
            stats: import("./interfaces/audit.interfaces").IAuditStats;
            anomalies: import("./interfaces/audit.interfaces").IAuditAnomaly[];
            summary: {
                totalLogs: number;
                todayActivity: number;
                criticalAnomalies: number;
                highAnomalies: number;
            };
        };
    }>;
}
export {};
