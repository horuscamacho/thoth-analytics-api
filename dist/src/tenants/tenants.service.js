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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
let TenantsService = class TenantsService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async createTenant(createTenantDto, createdBy) {
        const existingTenant = await this.prisma.tenant.findFirst({
            where: {
                name: createTenantDto.name,
            },
        });
        if (existingTenant) {
            throw new common_1.ConflictException('Tenant with this name already exists');
        }
        const tenant = await this.prisma.tenant.create({
            data: {
                id: crypto.randomUUID(),
                name: createTenantDto.name,
                type: createTenantDto.type,
                status: 'ACTIVE',
                settings: createTenantDto.settings || {},
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
        await this.auditService.logAction(tenant.id, createdBy, client_1.AuditAction.TENANT_CREATED, client_1.AuditEntityType.TENANT, tenant.id, null, {
            id: tenant.id,
            name: tenant.name,
            type: tenant.type,
            status: tenant.status,
        }, {
            tenantName: createTenantDto.name,
            tenantType: createTenantDto.type,
        });
        return tenant;
    }
    async getTenants(tenantId, filters = {}) {
        const where = {};
        if (tenantId) {
            where.id = tenantId;
        }
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.type) {
            where.type = filters.type;
        }
        const tenants = await this.prisma.tenant.findMany({
            where,
            include: {
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return tenants;
    }
    async getTenantById(id) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                        tweets: true,
                        news: true,
                        alerts: true,
                    },
                },
            },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
    async updateTenant(id, updateTenantDto, updatedBy) {
        const existingTenant = await this.getTenantById(id);
        if (updateTenantDto.name && updateTenantDto.name !== existingTenant.name) {
            const nameConflict = await this.prisma.tenant.findFirst({
                where: {
                    name: updateTenantDto.name,
                    id: { not: id },
                },
            });
            if (nameConflict) {
                throw new common_1.ConflictException('Tenant with this name already exists');
            }
        }
        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: {
                ...updateTenantDto,
                settings: updateTenantDto.settings,
                updatedAt: new Date(),
            },
        });
        await this.auditService.logAction(id, updatedBy, client_1.AuditAction.TENANT_UPDATED, client_1.AuditEntityType.TENANT, id, {
            name: existingTenant.name,
            type: existingTenant.type,
            status: existingTenant.status,
        }, {
            name: tenant.name,
            type: tenant.type,
            status: tenant.status,
        }, {
            updatedFields: Object.keys(updateTenantDto),
            previousData: {
                name: existingTenant.name,
                type: existingTenant.type,
                status: existingTenant.status,
            },
        });
        return tenant;
    }
    async suspendTenant(id, suspendedBy, reason) {
        const existingTenant = await this.getTenantById(id);
        if (existingTenant.status === 'SUSPENDED') {
            throw new common_1.BadRequestException('Tenant is already suspended');
        }
        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: {
                status: 'SUSPENDED',
                updatedAt: new Date(),
            },
        });
        await this.prisma.user.updateMany({
            where: { tenantId: id },
            data: {
                status: 'SUSPENDED',
                suspendedAt: new Date(),
                suspendedBy,
                suspensionReason: `Tenant suspended: ${reason}`,
            },
        });
        await this.auditService.logAction(id, suspendedBy, client_1.AuditAction.TENANT_SUSPENDED, client_1.AuditEntityType.TENANT, id, { status: existingTenant.status }, { status: 'SUSPENDED' }, {
            reason,
            previousStatus: existingTenant.status,
        });
        return tenant;
    }
    async reactivateTenant(id, reactivatedBy) {
        const existingTenant = await this.getTenantById(id);
        if (existingTenant.status !== 'SUSPENDED') {
            throw new common_1.BadRequestException('Tenant is not suspended');
        }
        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: {
                status: 'ACTIVE',
                updatedAt: new Date(),
            },
        });
        await this.prisma.user.updateMany({
            where: {
                tenantId: id,
                suspensionReason: { contains: 'Tenant suspended:' },
            },
            data: {
                status: 'ACTIVE',
                suspendedAt: null,
                suspendedBy: null,
                suspensionReason: null,
            },
        });
        await this.auditService.logAction(id, reactivatedBy, client_1.AuditAction.TENANT_REACTIVATED, client_1.AuditEntityType.TENANT, id, { status: existingTenant.status }, { status: 'ACTIVE' }, {
            previousStatus: existingTenant.status,
        });
        return tenant;
    }
    async deleteTenant(id, deletedBy, reason) {
        const existingTenant = await this.getTenantById(id);
        await this.auditService.logAction(id, deletedBy, client_1.AuditAction.TENANT_DELETED, client_1.AuditEntityType.TENANT, id, {
            id: existingTenant.id,
            name: existingTenant.name,
            type: existingTenant.type,
            status: existingTenant.status,
        }, null, {
            reason,
            deletedTenantData: {
                name: existingTenant.name,
                type: existingTenant.type,
                status: existingTenant.status,
                userCount: existingTenant._count?.users || 0,
            },
        });
        await this.prisma.tenant.delete({
            where: { id },
        });
        return { id };
    }
    async getTenantStats(id) {
        await this.getTenantById(id);
        const userStats = await this.prisma.user.groupBy({
            by: ['status', 'role'],
            where: { tenantId: id },
            _count: true,
        });
        const totalUsers = await this.prisma.user.count({
            where: { tenantId: id },
        });
        const activeUsers = await this.prisma.user.count({
            where: { tenantId: id, status: 'ACTIVE' },
        });
        const suspendedUsers = await this.prisma.user.count({
            where: { tenantId: id, status: 'SUSPENDED' },
        });
        const usersByRole = {};
        userStats.forEach((stat) => {
            usersByRole[stat.role] = (usersByRole[stat.role] || 0) + stat._count;
        });
        const tweetsCount = await this.prisma.tweet.count({
            where: { tenantId: id },
        });
        const newsCount = await this.prisma.news.count({
            where: { tenantId: id },
        });
        const aiAnalysisCount = await this.prisma.aiAnalysis.count({
            where: { tenantId: id },
        });
        const alertStats = await this.prisma.alert.groupBy({
            by: ['status', 'severity'],
            where: { tenantId: id },
            _count: true,
        });
        const totalAlerts = await this.prisma.alert.count({
            where: { tenantId: id },
        });
        const unreadAlerts = await this.prisma.alert.count({
            where: { tenantId: id, status: 'UNREAD' },
        });
        const alertsBySeverity = {};
        alertStats.forEach((stat) => {
            alertsBySeverity[stat.severity] = (alertsBySeverity[stat.severity] || 0) + stat._count;
        });
        return {
            users: {
                total: totalUsers,
                active: activeUsers,
                suspended: suspendedUsers,
                byRole: usersByRole,
            },
            content: {
                tweets: tweetsCount,
                news: newsCount,
                aiAnalysis: aiAnalysisCount,
            },
            alerts: {
                total: totalAlerts,
                unread: unreadAlerts,
                bySeverity: alertsBySeverity,
            },
        };
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map