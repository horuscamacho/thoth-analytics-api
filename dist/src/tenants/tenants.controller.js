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
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const tenants_service_1 = require("./tenants.service");
const create_tenant_dto_1 = require("./dto/create-tenant.dto");
const update_tenant_dto_1 = require("./dto/update-tenant.dto");
const jwt_guard_1 = require("../auth/guards/jwt/jwt.guard");
const roles_guard_1 = require("../auth/guards/roles/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let TenantsController = class TenantsController {
    constructor(tenantsService) {
        this.tenantsService = tenantsService;
    }
    async createTenant(createTenantDto, currentUser) {
        const tenant = await this.tenantsService.createTenant(createTenantDto, currentUser.id);
        return {
            message: 'Tenant created successfully',
            data: {
                id: tenant.id,
                name: tenant.name,
                type: tenant.type,
                status: tenant.status,
                createdAt: tenant.createdAt.toISOString(),
            },
        };
    }
    async getTenants(currentUser, status, type) {
        const tenantId = currentUser.role === 'SUPER_ADMIN' ? undefined : currentUser.tenantId;
        const filters = {};
        if (status)
            filters.status = status;
        if (type)
            filters.type = type;
        const tenants = await this.tenantsService.getTenants(tenantId, filters);
        return {
            message: 'Tenants retrieved successfully',
            data: tenants.map((tenant) => ({
                id: tenant.id,
                name: tenant.name,
                type: tenant.type,
                status: tenant.status,
                createdAt: tenant.createdAt.toISOString(),
                _count: {
                    users: tenant._count?.users || 0,
                },
            })),
            total: tenants.length,
        };
    }
    async getTenantById(id, currentUser) {
        if (currentUser.role !== 'SUPER_ADMIN' && currentUser.tenantId !== id) {
            throw new Error('Access denied to tenant');
        }
        const tenant = await this.tenantsService.getTenantById(id);
        return {
            message: 'Tenant retrieved successfully',
            data: {
                id: tenant.id,
                name: tenant.name,
                type: tenant.type,
                status: tenant.status,
                settings: tenant.settings,
                createdAt: tenant.createdAt.toISOString(),
                updatedAt: tenant.updatedAt.toISOString(),
                _count: {
                    users: tenant._count?.users || 0,
                    tweets: tenant._count?.tweets || 0,
                    news: tenant._count?.news || 0,
                    alerts: tenant._count?.alerts || 0,
                },
            },
        };
    }
    async updateTenant(id, updateTenantDto, currentUser) {
        if (currentUser.role !== 'SUPER_ADMIN' && currentUser.tenantId !== id) {
            throw new Error('Access denied to update tenant');
        }
        const allowedFields = currentUser.role === 'SUPER_ADMIN'
            ? updateTenantDto
            : {
                ...(updateTenantDto.name && { name: updateTenantDto.name }),
                ...(updateTenantDto.settings && { settings: updateTenantDto.settings })
            };
        const tenant = await this.tenantsService.updateTenant(id, allowedFields, currentUser.id);
        return {
            message: 'Tenant updated successfully',
            data: {
                id: tenant.id,
                name: tenant.name,
                type: tenant.type,
                status: tenant.status,
                updatedAt: tenant.updatedAt.toISOString(),
            },
        };
    }
    async suspendTenant(id, suspendDto, currentUser) {
        const result = await this.tenantsService.suspendTenant(id, currentUser.id, suspendDto.reason);
        return {
            message: 'Tenant suspended successfully',
            data: {
                id: result.id,
                status: result.status,
                suspendedAt: new Date().toISOString(),
                reason: suspendDto.reason,
            },
        };
    }
    async reactivateTenant(id, currentUser) {
        const result = await this.tenantsService.reactivateTenant(id, currentUser.id);
        return {
            message: 'Tenant reactivated successfully',
            data: {
                id: result.id,
                status: result.status,
                reactivatedAt: new Date().toISOString(),
            },
        };
    }
    async deleteTenant(id, confirmationDto, currentUser) {
        if (confirmationDto.confirmation !== 'DELETE_TENANT_PERMANENTLY') {
            throw new Error('Invalid confirmation. Must send "DELETE_TENANT_PERMANENTLY"');
        }
        const result = await this.tenantsService.deleteTenant(id, currentUser.id, confirmationDto.reason);
        return {
            message: 'Tenant deleted permanently',
            data: {
                id: result.id,
                deletedAt: new Date().toISOString(),
                reason: confirmationDto.reason,
            },
        };
    }
    async getTenantStats(id, currentUser) {
        if (currentUser.role !== 'SUPER_ADMIN' && currentUser.tenantId !== id) {
            throw new Error('Access denied to tenant stats');
        }
        const stats = await this.tenantsService.getTenantStats(id);
        return {
            message: 'Tenant statistics retrieved successfully',
            data: stats,
        };
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.ROLES)('SUPER_ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tenant_dto_1.CreateTenantDto, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "createTenant", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.ROLES)('SUPER_ADMIN', 'DIRECTOR_COMUNICACION'),
    __param(0, (0, current_user_decorator_1.CURRENT_USER)()),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getTenants", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.ROLES)('SUPER_ADMIN', 'DIRECTOR_COMUNICACION'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getTenantById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.ROLES)('SUPER_ADMIN', 'DIRECTOR_COMUNICACION'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tenant_dto_1.UpdateTenantDto, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "updateTenant", null);
__decorate([
    (0, common_1.Put)(':id/suspend'),
    (0, roles_decorator_1.ROLES)('SUPER_ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "suspendTenant", null);
__decorate([
    (0, common_1.Put)(':id/reactivate'),
    (0, roles_decorator_1.ROLES)('SUPER_ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "reactivateTenant", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.ROLES)('SUPER_ADMIN'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "deleteTenant", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, roles_decorator_1.ROLES)('SUPER_ADMIN', 'DIRECTOR_COMUNICACION'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getTenantStats", null);
exports.TenantsController = TenantsController = __decorate([
    (0, common_1.Controller)('tenants'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map