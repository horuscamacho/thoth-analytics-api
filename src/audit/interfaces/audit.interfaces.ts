import { AuditAction, AuditEntityType, SecurityLevel } from '@prisma/client';

export interface IAuditLog {
  id: string;
  tenantId: string;
  userId: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  oldValues: any;
  newValues: any;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  clientFingerprint: string | null;
  checksum: string;
  digitalSignature: string | null;
  performedAt: Date;
  createdAt: Date;
  securityLevel: SecurityLevel;
}

export interface IAuditStats {
  totalLogs: number;
  todayLogs: number;
  uniqueUsers: number;
  topActions: Array<{
    action: AuditAction;
    count: number;
  }>;
  activityByHour: Array<{
    hour: number;
    count: number;
  }>;
  suspiciousActivity: {
    failedLogins: number;
    unusualHours: number;
    multipleIPs: number;
  };
}

export interface IAuditAnomaly {
  id: string;
  type: 'MULTIPLE_FAILED_LOGINS' | 'UNUSUAL_HOURS' | 'MULTIPLE_IPS' | 'RAPID_ACTIONS';
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId: string | null;
  ipAddress: string | null;
  detectedAt: Date;
  metadata: any;
}

export interface IIntegrityReport {
  totalLogs: number;
  validLogs: number;
  invalidLogs: number;
  corruptedLogs: Array<{
    id: string;
    expectedChecksum: string;
    actualChecksum: string;
    performedAt: Date;
  }>;
}