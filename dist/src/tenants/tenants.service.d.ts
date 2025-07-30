import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
interface ITenant {
    id: string;
    name: string;
    type: string;
    status: string;
    settings?: any;
    createdAt: Date;
    updatedAt: Date;
    _count?: {
        users: number;
        tweets?: number;
        news?: number;
        alerts?: number;
    };
}
interface ITenantFilters {
    status?: string;
    type?: string;
}
export declare class TenantsService {
    private readonly prisma;
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    createTenant(createTenantDto: CreateTenantDto, createdBy: string): Promise<ITenant>;
    getTenants(tenantId?: string, filters?: ITenantFilters): Promise<ITenant[]>;
    getTenantById(id: string): Promise<ITenant>;
    updateTenant(id: string, updateTenantDto: Partial<UpdateTenantDto>, updatedBy: string): Promise<ITenant>;
    suspendTenant(id: string, suspendedBy: string, reason: string): Promise<ITenant>;
    reactivateTenant(id: string, reactivatedBy: string): Promise<ITenant>;
    deleteTenant(id: string, deletedBy: string, reason: string): Promise<{
        id: string;
    }>;
    getTenantStats(id: string): Promise<{
        users: {
            total: number;
            active: number;
            suspended: number;
            byRole: Record<string, number>;
        };
        content: {
            tweets: number;
            news: number;
            aiAnalysis: number;
        };
        alerts: {
            total: number;
            unread: number;
            bySeverity: Record<string, number>;
        };
    }>;
}
export {};
