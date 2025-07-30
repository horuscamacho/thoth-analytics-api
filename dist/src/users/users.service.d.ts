import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
interface IUser {
    id: string;
    email: string;
    username: string;
    role: string;
    tenantId: string | null;
    status: string;
    createdAt: Date;
    lastLoginAt: Date | null;
    suspendedAt: Date | null;
    suspendedBy: string | null;
    suspensionReason: string | null;
    temporaryPassword?: string;
}
interface IUserFilters {
    status?: string;
    role?: string;
}
export declare class UsersService {
    private readonly prisma;
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    createUser(createUserDto: CreateUserDto, tenantId: string): Promise<IUser & {
        temporaryPassword: string;
    }>;
    getUsers(tenantId: string, filters?: IUserFilters): Promise<IUser[]>;
    getUserById(id: string, tenantId: string): Promise<IUser>;
    suspendUser(id: string, tenantId: string, suspendedBy: string, reason?: string): Promise<IUser>;
    reactivateUser(id: string, tenantId: string, reactivatedBy: string): Promise<IUser>;
    deleteUser(id: string, tenantId: string, deletedBy: string, reason: string): Promise<{
        id: string;
    }>;
    private generateTemporaryPassword;
}
export {};
