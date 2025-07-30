import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
interface ICurrentUser {
    id: string;
    email: string;
    username: string;
    role: string;
    tenantId: string;
}
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(createUserDto: CreateUserDto, currentUser: ICurrentUser): Promise<{
        message: string;
        data: {
            id: string;
            email: string;
            username: string;
            role: string;
            tenantId: string;
            status: string;
            temporaryPassword?: string;
        };
    }>;
    getUsers(currentUser: ICurrentUser, status?: string, role?: string): Promise<{
        message: string;
        data: Array<{
            id: string;
            email: string;
            username: string;
            role: string;
            status: string;
            createdAt: string;
            lastLoginAt?: string;
        }>;
        total: number;
    }>;
    getUserById(id: string, currentUser: ICurrentUser): Promise<{
        message: string;
        data: {
            id: string;
            email: string;
            username: string;
            role: string;
            status: string;
            createdAt: string;
            lastLoginAt?: string;
            tenantId: string;
        };
    }>;
    suspendUser(id: string, updateStatusDto: UpdateUserStatusDto, currentUser: ICurrentUser): Promise<{
        message: string;
        data: {
            id: string;
            status: string;
            suspendedAt: string;
            suspendedBy: string;
            reason?: string;
        };
    }>;
    reactivateUser(id: string, currentUser: ICurrentUser): Promise<{
        message: string;
        data: {
            id: string;
            status: string;
            reactivatedAt: string;
            reactivatedBy: string;
        };
    }>;
    deleteUser(id: string, confirmationDto: {
        confirmation: string;
        reason: string;
    }, currentUser: ICurrentUser): Promise<{
        message: string;
        data: {
            id: string;
            deletedAt: string;
            deletedBy: string;
            reason: string;
        };
    }>;
}
export {};
