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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("./audit.service");
const dto_1 = require("./dto");
const jwt_guard_1 = require("../auth/guards/jwt/jwt.guard");
const roles_guard_1 = require("../auth/guards/roles/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let AuditController = class AuditController {
    constructor(auditService) {
        this.auditService = auditService;
    }
    async getLogs(filters, currentUser) {
        const result = await this.auditService.getLogs(currentUser.tenantId, filters);
        return {
            message: 'Audit logs retrieved successfully',
            data: result.logs,
            pagination: {
                total: result.total,
                limit: filters.limit || 50,
                offset: filters.offset || 0,
            },
        };
    }
    async getLogById(id, currentUser) {
        const log = await this.auditService.getLogs(currentUser.tenantId, {
            limit: 1,
            offset: 0
        });
        const foundLog = log.logs.find(l => l.id === id);
        if (!foundLog) {
            throw new common_1.BadRequestException('Audit log not found');
        }
        return {
            message: 'Audit log retrieved successfully',
            data: foundLog,
        };
    }
    async getStats(currentUser) {
        const stats = await this.auditService.getAuditStats(currentUser.tenantId);
        return {
            message: 'Audit statistics retrieved successfully',
            data: stats,
        };
    }
    async getAnomalies(currentUser) {
        const anomalies = await this.auditService.detectAnomalies(currentUser.tenantId);
        return {
            message: 'Audit anomalies detected successfully',
            data: anomalies,
            total: anomalies.length,
        };
    }
    async verifyIntegrity(currentUser) {
        const report = await this.auditService.verifyIntegrity(currentUser.tenantId);
        return {
            message: 'Integrity verification completed',
            data: report,
        };
    }
    async exportLogs(format, filters, currentUser, res) {
        if (!Object.values(dto_1.ExportFormat).includes(format)) {
            throw new common_1.BadRequestException('Invalid export format. Supported: csv, json, pdf');
        }
        const buffer = await this.auditService.exportLogs(currentUser.tenantId, filters, format);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `audit-logs-${timestamp}.${format}`;
        let contentType;
        switch (format) {
            case 'csv':
                contentType = 'text/csv';
                break;
            case 'json':
                contentType = 'application/json';
                break;
            case 'pdf':
                contentType = 'application/pdf';
                break;
            default:
                contentType = 'application/octet-stream';
        }
        res.set({
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length,
        });
        res.send(buffer);
    }
    async getDashboardData(currentUser) {
        const [stats, anomalies] = await Promise.all([
            this.auditService.getAuditStats(currentUser.tenantId),
            this.auditService.detectAnomalies(currentUser.tenantId),
        ]);
        return {
            message: 'Audit dashboard data retrieved successfully',
            data: {
                stats,
                anomalies: anomalies.slice(0, 10),
                summary: {
                    totalLogs: stats.totalLogs,
                    todayActivity: stats.todayLogs,
                    criticalAnomalies: anomalies.filter(a => a.severity === 'CRITICAL').length,
                    highAnomalies: anomalies.filter(a => a.severity === 'HIGH').length,
                },
            },
        };
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)('logs'),
    (0, roles_decorator_1.ROLES)('DIRECTOR_COMUNICACION'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.AuditFiltersDto, Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)('logs/:id'),
    (0, roles_decorator_1.ROLES)('DIRECTOR_COMUNICACION'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getLogById", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, roles_decorator_1.ROLES)('DIRECTOR_COMUNICACION', 'LIDER'),
    __param(0, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('anomalies'),
    (0, roles_decorator_1.ROLES)('DIRECTOR_COMUNICACION'),
    __param(0, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getAnomalies", null);
__decorate([
    (0, common_1.Post)('verify'),
    (0, roles_decorator_1.ROLES)('DIRECTOR_COMUNICACION'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "verifyIntegrity", null);
__decorate([
    (0, common_1.Get)('export/:format'),
    (0, roles_decorator_1.ROLES)('DIRECTOR_COMUNICACION'),
    __param(0, (0, common_1.Param)('format')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CURRENT_USER)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AuditFiltersDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "exportLogs", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.ROLES)('DIRECTOR_COMUNICACION', 'LIDER'),
    __param(0, (0, current_user_decorator_1.CURRENT_USER)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuditController.prototype, "getDashboardData", null);
exports.AuditController = AuditController = __decorate([
    (0, common_1.Controller)('audit'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
//# sourceMappingURL=audit.controller.js.map