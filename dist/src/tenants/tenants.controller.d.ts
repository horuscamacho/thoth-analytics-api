import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
interface ICurrentUser {
    id: string;
    email: string;
    username: string;
    role: string;
    tenantId: string;
}
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    createTenant(createTenantDto: CreateTenantDto, currentUser: ICurrentUser): Promise<{
        message: string;
        data: {
            id: string;
            name: string;
            type: string;
            status: string;
            createdAt: string;
        };
    }>;
    getTenants(currentUser: ICurrentUser, status?: string, type?: string): Promise<{
        message: string;
        data: Array<{
            id: string;
            name: string;
            type: string;
            status: string;
            createdAt: string;
            _count: {
                users: number;
            };
        }>;
        total: number;
    }>;
    getTenantById(id: string, currentUser: ICurrentUser): Promise<{
        message: string;
        data: {
            id: string;
            name: string;
            type: string;
            status: string;
            settings: any;
            createdAt: string;
            updatedAt: string;
            _count: {
                users: number;
                tweets: number;
                news: number;
                alerts: number;
            };
        };
    }>;
    updateTenant(id: string, updateTenantDto: UpdateTenantDto, currentUser: ICurrentUser): Promise<{
        message: string;
        data: {
            id: string;
            name: string;
            type: string;
            status: string;
            updatedAt: string;
        };
    }>;
    suspendTenant(id: string, suspendDto: {
        reason: string;
    }, currentUser: ICurrentUser): Promise<{
        message: string;
        data: {
            id: string;
            status: string;
            suspendedAt: string;
            reason: string;
        };
    }>;
    reactivateTenant(id: string, currentUser: ICurrentUser): Promise<{
        message: string;
        data: {
            id: string;
            status: string;
            reactivatedAt: string;
        };
    }>;
    deleteTenant(id: string, confirmationDto: {
        confirmation: string;
        reason: string;
    }, currentUser: ICurrentUser): Promise<{
        message: string;
        data: {
            id: string;
            deletedAt: string;
            reason: string;
        };
    }>;
    getTenantStats(id: string, currentUser: ICurrentUser): Promise<{
        message: string;
        data: {
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
        };
    }>;
}
export {};
