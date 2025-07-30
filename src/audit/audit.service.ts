import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditAction, AuditEntityType } from '@prisma/client';
import * as crypto from 'crypto';
import { CreateAuditLogDto, AuditFiltersDto } from './dto';
import { IAuditLog, IAuditStats, IAuditAnomaly, IIntegrityReport } from './interfaces/audit.interfaces';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async createAuditLog(data: CreateAuditLogDto): Promise<IAuditLog> {
    // Calculate checksum for integrity
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

    // Filter out undefined values to match Prisma's exact optional types
    const createData: any = {
      tenantId: data.tenantId,
      action: data.action,
      entityType: data.entityType,
      checksum,
      performedAt: new Date(),
    };

    // Add optional fields only if they are defined
    if (data.userId !== undefined) createData.userId = data.userId;
    if (data.entityId !== undefined) createData.entityId = data.entityId;
    if (data.oldValues !== undefined) createData.oldValues = data.oldValues;
    if (data.newValues !== undefined) createData.newValues = data.newValues;
    if (data.metadata !== undefined) createData.metadata = data.metadata;
    if (data.ipAddress !== undefined) createData.ipAddress = data.ipAddress;
    if (data.userAgent !== undefined) createData.userAgent = data.userAgent;
    if (data.sessionId !== undefined) createData.sessionId = data.sessionId;
    if (data.clientFingerprint !== undefined) createData.clientFingerprint = data.clientFingerprint;
    if (data.securityLevel !== undefined) createData.securityLevel = data.securityLevel;

    const auditLog = await this.prisma.auditLog.create({
      data: createData,
    });

    return auditLog;
  }

  async getLogs(tenantId: string, filters: AuditFiltersDto): Promise<{
    logs: IAuditLog[];
    total: number;
  }> {
    const where: any = { tenantId };

    // Apply filters
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.ipAddress) where.ipAddress = filters.ipAddress;
    if (filters.securityLevel) where.securityLevel = filters.securityLevel;

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.performedAt = {};
      if (filters.startDate) where.performedAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.performedAt.lte = new Date(filters.endDate);
    }

    // Search in metadata and values
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

  async getAuditStats(tenantId: string): Promise<IAuditStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalLogs,
      todayLogs,
      uniqueUsers,
      topActions,
      activityByHour,
      failedLogins,
      unusualHours,
      multipleIPs
    ] = await Promise.all([
      // Total logs
      this.prisma.auditLog.count({ where: { tenantId } }),
      
      // Today's logs
      this.prisma.auditLog.count({
        where: {
          tenantId,
          performedAt: { gte: todayStart },
        },
      }),
      
      // Unique users
      this.prisma.auditLog.findMany({
        where: { tenantId, userId: { not: null } },
        select: { userId: true },
        distinct: ['userId'],
      }).then(users => users.length),
      
      // Top actions
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { tenantId },
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      
      // Activity by hour (last 24 hours)
      this.prisma.$queryRaw`
        SELECT 
          EXTRACT(hour FROM performed_at) as hour,
          COUNT(*) as count
        FROM audit_logs 
        WHERE tenant_id = ${tenantId} 
          AND performed_at >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)}
        GROUP BY EXTRACT(hour FROM performed_at)
        ORDER BY hour
      `,
      
      // Failed logins
      this.prisma.auditLog.count({
        where: {
          tenantId,
          action: AuditAction.LOGIN_FAILED,
          performedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      
      // Unusual hours (outside 6 AM - 10 PM)
      this.prisma.$queryRaw`
        SELECT COUNT(*) as count
        FROM audit_logs 
        WHERE tenant_id = ${tenantId}
          AND performed_at >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
          AND (EXTRACT(hour FROM performed_at) < 6 OR EXTRACT(hour FROM performed_at) > 22)
      `,
      
      // Multiple IPs per user
      this.prisma.$queryRaw`
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
      activityByHour: (activityByHour as any[]).map(item => ({
        hour: parseInt(item.hour),
        count: parseInt(item.count),
      })),
      suspiciousActivity: {
        failedLogins,
        unusualHours: (unusualHours as any[])[0]?.count || 0,
        multipleIPs: (multipleIPs as any[])[0]?.count || 0,
      },
    };
  }

  async detectAnomalies(tenantId: string): Promise<IAuditAnomaly[]> {
    const anomalies: IAuditAnomaly[] = [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Detect multiple failed logins from same IP
    const failedLoginsByIP = await this.prisma.auditLog.groupBy({
      by: ['ipAddress'],
      where: {
        tenantId,
        action: AuditAction.LOGIN_FAILED,
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

    // Detect unusual activity hours
    const unusualHourActivity = await this.prisma.$queryRaw`
      SELECT user_id, ip_address, COUNT(*) as count
      FROM audit_logs 
      WHERE tenant_id = ${tenantId}
        AND performed_at >= ${oneDayAgo}
        AND (EXTRACT(hour FROM performed_at) < 6 OR EXTRACT(hour FROM performed_at) > 22)
        AND user_id IS NOT NULL
      GROUP BY user_id, ip_address
      HAVING COUNT(*) >= 10
    ` as any[];

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

    // Detect rapid consecutive actions
    const rapidActions = await this.prisma.$queryRaw`
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
    ` as any[];

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

  async verifyIntegrity(tenantId: string): Promise<IIntegrityReport> {
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
      } else {
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

  async exportLogs(
    tenantId: string, 
    filters: AuditFiltersDto, 
    format: 'csv' | 'json' | 'pdf'
  ): Promise<Buffer> {
    const { logs } = await this.getLogs(tenantId, { ...filters, limit: 10000 });

    switch (format) {
      case 'json':
        return Buffer.from(JSON.stringify(logs, null, 2));
      
      case 'csv':
        return this.generateCSV(logs);
      
      case 'pdf':
        return this.generatePDF(logs);
      
      default:
        throw new BadRequestException('Unsupported export format');
    }
  }

  private generateCSV(logs: IAuditLog[]): Buffer {
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

  private generatePDF(logs: IAuditLog[]): Buffer {
    // For now, return a simple text-based PDF content
    // In production, you'd use a library like puppeteer or pdfkit
    const content = `AUDIT LOGS REPORT
Generated: ${new Date().toISOString()}
Total Records: ${logs.length}

${logs.map(log => 
  `${log.performedAt.toISOString()} | ${log.action} | ${log.entityType} | ${log.userId || 'SYSTEM'}`
).join('\n')}`;
    
    return Buffer.from(content);
  }

  // Helper method to log audit actions from other services
  async logAction(
    tenantId: string,
    userId: string | null,
    action: AuditAction,
    entityType: AuditEntityType,
    entityId?: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any,
    request?: any // Express request object for IP, user agent, etc.
  ): Promise<void> {
    try {
      await this.createAuditLog({
        tenantId,
        userId: userId, // Keep null as is since DTO accepts null
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
    } catch (error) {
      // Don't fail the main operation due to audit logging failures
      console.error('Failed to create audit log:', error);
    }
  }
}
