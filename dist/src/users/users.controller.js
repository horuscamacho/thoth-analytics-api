"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_status_dto_1 = require("./dto/update-user-status.dto");
const jwt_guard_1 = require("../auth/guards/jwt/jwt.guard");
const roles_guard_1 = require("../auth/guards/roles/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async createUser(createUserDto, currentUser) {
        const user = await this.usersService.createUser(createUserDto, currentUser.tenantId);
        return {
            message: 'User created successfully',
            data: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                tenantId: user.tenantId || '',
                status: user.status,
                temporaryPassword: user.temporaryPassword,
            },
        };
    }
    async getUsers(currentUser, status, role) {
        const filters = {};
        if (status)
            filters.status = status;
        if (role)
            filters.role = role;
        const users = await this.usersService.getUsers(currentUser.tenantId, filters);
        return {
            message: 'Users retrieved successfully',
            data: users.map((user) => ({
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt.toISOString(),
                ...(user.lastLoginAt && { lastLoginAt: user.lastLoginAt.toISOString() }),
            })),
            total: users.length,
        };
    }
    async getUserById(id, currentUser) {
        const user = await this.usersService.getUserById(id, currentUser.tenantId);
        return {
            message: 'User retrieved successfully',
            data: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt.toISOString(),
                tenantId: user.tenantId || '',
                ...(user.lastLoginAt && { lastLoginAt: user.lastLoginAt.toISOString() }),
            },
        };
    }
    async suspendUser(id, updateStatusDto, currentUser) {
        const result = await this.usersService.suspendUser(id, currentUser.tenantId, currentUser.id, updateStatusDto.reason);
        return {
            message: 'User suspended successfully',
            data: {
                id: result.id,
                status: result.status,
                suspendedAt: result.suspendedAt.toISOString(),
                suspendedBy: result.suspendedBy,
                ...(result.suspensionReason && { reason: result.suspensionReason }),
            },
        };
    }
    async reactivateUser(id, currentUser) {
        const result = await this.usersService.reactivateUser(id, currentUser.tenantId, currentUser.id);
        return {
            message: 'User reactivated successfully',
            data: {
                id: result.id,
                status: result.status,
                reactivatedAt: new Date().toISOString(),
                reactivatedBy: currentUser.id,
            },
        };
    }
    async deleteUser(id, confirmationDto, currentUser) {
        if (confirmationDto.confirmation !== 'DELETE_PERMANENTLY') {
            throw new Error('Invalid confirmation. Must send "DELETE_PERMANENTLY"');
        }
        const result = await this.usersService.deleteUser(id, currentUser.tenantId, currentUser.id, confirmationDto.reason);
        return {
            message: 'User deleted permanently',
            data: {
                id: result.id,
                deletedAt: new Date().toISOString(),
                deletedBy: currentUser.id,
                reason: confirmationDto.reason,
            },
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.ROLES)('DIRECTOR_COMUNICACION'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.ROLES)('DIRECTOR_COMUNICACION', 'LIDER'),
    __param(0, (0, current_user_decorator_1.CURRENT_USER)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.ROLES)('DIRECTOR_COMUNICACION', 'LIDER', 'DIRECTOR_AREA'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Put)(':id/suspend'),
    (0, roles_decorator_1.ROLES)('DIRECTOR_COMUNICACION'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_status_dto_1.UpdateUserStatusDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "suspendUser", null);
__decorate([
    (0, common_1.Put)(':id/reactivate'),
    (0, roles_decorator_1.ROLES)('DIRECTOR_COMUNICACION'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "reactivateUser", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.ROLES)('DIRECTOR_COMUNICACION'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteUser", null);
exports.UsersController = UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map