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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
let AuditService = class AuditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAuditLog(data) {
        const checksumData = [
            data.tenantId || '',
            data.userId || '',
            data.action,
            data.entityType,
            data.entityId || '',
            JSON.stringify(data.oldValues || {}),
            JSON.stringify(data.newValues || {}),
            new Date().toISOString()
        ].join('|');
        const checksum = crypto.createHash('sha256').update(checksumData).digest('hex');
        const createData = {
            tenantId: data.tenantId,
            action: data.action,
            entityType: data.entityType,
            checksum,
            performedAt: new Date(),
        };
        if (data.userId !== undefined)
            createData.userId = data.userId;
        if (data.entityId !== undefined)
            createData.entityId = data.entityId;
        if (data.oldValues !== undefined)
            createData.oldValues = data.oldValues;
        if (data.newValues !== undefined)
            createData.newValues = data.newValues;
        if (data.metadata !== undefined)
            createData.metadata = data.metadata;
        if (data.ipAddress !== undefined)
            createData.ipAddress = data.ipAddress;
        if (data.userAgent !== undefined)
            createData.userAgent = data.userAgent;
        if (data.sessionId !== undefined)
            createData.sessionId = data.sessionId;
        if (data.clientFingerprint !== undefined)
            createData.clientFingerprint = data.clientFingerprint;
        if (data.securityLevel !== undefined)
            createData.securityLevel = data.securityLevel;
        const auditLog = await this.prisma.auditLog.create({
            data: createData,
        });
        return auditLog;
    }
    async getLogs(tenantId, filters) {
        const where = { tenantId };
        if (filters.userId)
            where.userId = filters.userId;
        if (filters.action)
            where.action = filters.action;
        if (filters.entityType)
            where.entityType = filters.entityType;
        if (filters.entityId)
            where.entityId = filters.entityId;
        if (filters.ipAddress)
            where.ipAddress = filters.ipAddress;
        if (filters.securityLevel)
            where.securityLevel = filters.securityLevel;
        if (filters.startDate || filters.endDate) {
            where.performedAt = {};
            if (filters.startDate)
                where.performedAt.gte = new Date(filters.startDate);
            if (filters.endDate)
                where.performedAt.lte = new Date(filters.endDate);
        }
        if (filters.search) {
            where.OR = [
                { metadata: { path: [], string_contains: filters.search } },
                { oldValues: { path: [], string_contains: filters.search } },
                { newValues: { path: [], string_contains: filters.search } },
            ];
        }
        const [logs, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                where,
                orderBy: { performedAt: 'desc' },
                take: filters.limit || 50,
                skip: filters.offset || 0,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            username: true,
                            role: true,
                        },
                    },
                },
            }),
            this.prisma.auditLog.count({ where }),
        ]);
        return { logs, total };
    }
    async getAuditStats(tenantId) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const [totalLogs, todayLogs, uniqueUsers, topActions, activityByHour, failedLogins, unusualHours, multipleIPs] = await Promise.all([
            this.prisma.auditLog.count({ where: { tenantId } }),
            this.prisma.auditLog.count({
                where: {
                    tenantId,
                    performedAt: { gte: todayStart },
                },
            }),
            this.prisma.auditLog.findMany({
                where: { tenantId, userId: { not: null } },
                select: { userId: true },
                distinct: ['userId'],
            }).then(users => users.length),
            this.prisma.auditLog.groupBy({
                by: ['action'],
                where: { tenantId },
                _count: { action: true },
                orderBy: { _count: { action: 'desc' } },
                take: 10,
            }),
            this.prisma.$queryRaw `
        SELECT 
          EXTRACT(hour FROM performed_at) as hour,
          COUNT(*) as count
        FROM audit_logs 
        WHERE tenant_id = ${tenantId} 
          AND performed_at >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)}
        GROUP BY EXTRACT(hour FROM performed_at)
        ORDER BY hour
      `,
            this.prisma.auditLog.count({
                where: {
                    tenantId,
                    action: client_1.AuditAction.LOGIN_FAILED,
                    performedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                },
            }),
            this.prisma.$queryRaw `
        SELECT COUNT(*) as count
        FROM audit_logs 
        WHERE tenant_id = ${tenantId}
          AND performed_at >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
          AND (EXTRACT(hour FROM performed_at) < 6 OR EXTRACT(hour FROM performed_at) > 22)
      `,
            this.prisma.$queryRaw `
        SELECT COUNT(*) as count
        FROM (
          SELECT user_id, COUNT(DISTINCT ip_address) as ip_count
          FROM audit_logs 
          WHERE tenant_id = ${tenantId}
            AND user_id IS NOT NULL
            AND ip_address IS NOT NULL
            AND performed_at >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)}
          GROUP BY user_id
          HAVING COUNT(DISTINCT ip_address) > 3
        ) as multiple_ip_users
      `
        ]);
        return {
            totalLogs,
            todayLogs,
            uniqueUsers,
            topActions: topActions.map(action => ({
                action: action.action,
                count: action._count.action,
            })),
            activityByHour: activityByHour.map(item => ({
                hour: parseInt(item.hour),
                count: parseInt(item.count),
            })),
            suspiciousActivity: {
                failedLogins,
                unusualHours: unusualHours[0]?.count || 0,
                multipleIPs: multipleIPs[0]?.count || 0,
            },
        };
    }
    async detectAnomalies(tenantId) {
        const anomalies = [];
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const failedLoginsByIP = await this.prisma.auditLog.groupBy({
            by: ['ipAddress'],
            where: {
                tenantId,
                action: client_1.AuditAction.LOGIN_FAILED,
                performedAt: { gte: oneHourAgo },
                ipAddress: { not: null },
            },
            _count: { ipAddress: true },
            having: {
                ipAddress: { _count: { gte: 5 } },
            },
        });
        for (const item of failedLoginsByIP) {
            anomalies.push({
                id: crypto.randomUUID(),
                type: 'MULTIPLE_FAILED_LOGINS',
                description: `Multiple failed login attempts from IP ${item.ipAddress}`,
                severity: item._count.ipAddress >= 10 ? 'CRITICAL' : 'HIGH',
                userId: null,
                ipAddress: item.ipAddress,
                detectedAt: now,
                metadata: { attempts: item._count.ipAddress },
            });
        }
        const unusualHourActivity = await this.prisma.$queryRaw `
      SELECT user_id, ip_address, COUNT(*) as count
      FROM audit_logs 
      WHERE tenant_id = ${tenantId}
        AND performed_at >= ${oneDayAgo}
        AND (EXTRACT(hour FROM performed_at) < 6 OR EXTRACT(hour FROM performed_at) > 22)
        AND user_id IS NOT NULL
      GROUP BY user_id, ip_address
      HAVING COUNT(*) >= 10
    `;
        for (const item of unusualHourActivity) {
            anomalies.push({
                id: crypto.randomUUID(),
                type: 'UNUSUAL_HOURS',
                description: `User activity during unusual hours`,
                severity: 'MEDIUM',
                userId: item.user_id,
                ipAddress: item.ip_address,
                detectedAt: now,
                metadata: { actions: item.count },
            });
        }
        const rapidActions = await this.prisma.$queryRaw `
      SELECT 
        user_id, 
        ip_address,
        COUNT(*) as count,
        MAX(performed_at) - MIN(performed_at) as time_span
      FROM audit_logs 
      WHERE tenant_id = ${tenantId}
        AND performed_at >= ${oneHourAgo}
        AND user_id IS NOT NULL
      GROUP BY user_id, ip_address
      HAVING 
        COUNT(*) >= 50 
        AND MAX(performed_at) - MIN(performed_at) < INTERVAL '5 minutes'
    `;
        for (const item of rapidActions) {
            anomalies.push({
                id: crypto.randomUUID(),
                type: 'RAPID_ACTIONS',
                description: `Rapid consecutive actions detected`,
                severity: 'HIGH',
                userId: item.user_id,
                ipAddress: item.ip_address,
                detectedAt: now,
                metadata: { actions: item.count, timeSpan: item.time_span },
            });
        }
        return anomalies;
    }
    async verifyIntegrity(tenantId) {
        const logs = await this.prisma.auditLog.findMany({
            where: { tenantId },
            select: {
                id: true,
                tenantId: true,
                userId: true,
                action: true,
                entityType: true,
                entityId: true,
                oldValues: true,
                newValues: true,
                checksum: true,
                performedAt: true,
            },
        });
        const corruptedLogs = [];
        let validLogs = 0;
        for (const log of logs) {
            const checksumData = [
                log.tenantId || '',
                log.userId || '',
                log.action,
                log.entityType,
                log.entityId || '',
                JSON.stringify(log.oldValues || {}),
                JSON.stringify(log.newValues || {}),
                log.performedAt.toISOString()
            ].join('|');
            const expectedChecksum = crypto.createHash('sha256').update(checksumData).digest('hex');
            if (expectedChecksum !== log.checksum) {
                corruptedLogs.push({
                    id: log.id,
                    expectedChecksum,
                    actualChecksum: log.checksum,
                    performedAt: log.performedAt,
                });
            }
            else {
                validLogs++;
            }
        }
        return {
            totalLogs: logs.length,
            validLogs,
            invalidLogs: corruptedLogs.length,
            corruptedLogs,
        };
    }
    async exportLogs(tenantId, filters, format) {
        const { logs } = await this.getLogs(tenantId, { ...filters, limit: 10000 });
        switch (format) {
            case 'json':
                return Buffer.from(JSON.stringify(logs, null, 2));
            case 'csv':
                return this.generateCSV(logs);
            case 'pdf':
                return this.generatePDF(logs);
            default:
                throw new common_1.BadRequestException('Unsupported export format');
        }
    }
    generateCSV(logs) {
        const headers = [
            'ID', 'Performed At', 'User ID', 'Action', 'Entity Type',
            'Entity ID', 'IP Address', 'User Agent', 'Security Level'
        ];
        const csvRows = [headers.join(',')];
        for (const log of logs) {
            const row = [
                log.id,
                log.performedAt.toISOString(),
                log.userId || '',
                log.action,
                log.entityType,
                log.entityId || '',
                log.ipAddress || '',
                log.userAgent ? `"${log.userAgent.replace(/"/g, '""')}"` : '',
                log.securityLevel
            ];
            csvRows.push(row.join(','));
        }
        return Buffer.from(csvRows.join('\n'));
    }
    generatePDF(logs) {
        const content = `AUDIT LOGS REPORT
Generated: ${new Date().toISOString()}
Total Records: ${logs.length}

${logs.map(log => `${log.performedAt.toISOString()} | ${log.action} | ${log.entityType} | ${log.userId || 'SYSTEM'}`).join('\n')}`;
        return Buffer.from(content);
    }
    async logAction(tenantId, userId, action, entityType, entityId, oldValues, newValues, metadata, request) {
        try {
            await this.createAuditLog({
                tenantId,
                userId: userId,
                action,
                entityType,
                entityId,
                oldValues,
                newValues,
                metadata,
                ipAddress: request?.ip,
                userAgent: request?.get('user-agent'),
                sessionId: request?.session?.id,
            });
        }
        catch (error) {
            console.error('Failed to create audit log:', error);
        }
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map