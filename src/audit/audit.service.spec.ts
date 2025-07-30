import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaService } from '../database/prisma.service';
import { AuditAction, AuditEntityType, SecurityLevel } from '@prisma/client';
import * as crypto from 'crypto';

describe('AuditService', () => {
  let service: AuditService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-456';
  const mockAuditLog = {
    id: 'audit-789',
    tenantId: mockTenantId,
    userId: mockUserId,
    action: AuditAction.USER_CREATED,
    entityType: AuditEntityType.USER,
    entityId: 'entity-123',
    oldValues: { status: 'INACTIVE' },
    newValues: { status: 'ACTIVE' },
    metadata: { source: 'test' },
    ipAddress: '192.168.1.1',
    userAgent: 'Test Agent',
    sessionId: 'session-123',
    clientFingerprint: 'fingerprint-123',
    securityLevel: SecurityLevel.INTERNAL,
    checksum: 'checksum-hash',
    performedAt: new Date('2024-01-01T00:00:00Z'),
    digitalSignature: 'signature-hash',
    createdAt: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAuditLog', () => {
    it('should create audit log with checksum', async () => {
      const createData = {
        tenantId: mockTenantId,
        userId: mockUserId,
        action: AuditAction.USER_CREATED,
        entityType: AuditEntityType.USER,
        entityId: 'entity-123',
        oldValues: { status: 'INACTIVE' },
        newValues: { status: 'ACTIVE' },
        metadata: { source: 'test' },
        ipAddress: '192.168.1.1',
        userAgent: 'Test Agent',
        sessionId: 'session-123',
        clientFingerprint: 'fingerprint-123',
        securityLevel: SecurityLevel.INTERNAL,
      };

      mockPrismaService.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await service.createAuditLog(createData);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: mockTenantId,
          userId: mockUserId,
          action: AuditAction.USER_CREATED,
          entityType: AuditEntityType.USER,
          entityId: 'entity-123',
          oldValues: { status: 'INACTIVE' },
          newValues: { status: 'ACTIVE' },
          metadata: { source: 'test' },
          ipAddress: '192.168.1.1',
          userAgent: 'Test Agent',
          sessionId: 'session-123',
          clientFingerprint: 'fingerprint-123',
          securityLevel: SecurityLevel.INTERNAL,
          checksum: expect.any(String),
          performedAt: expect.any(Date),
        }),
      });
      expect(result).toEqual(mockAuditLog);
    });

    it('should handle optional fields correctly', async () => {
      const minimalData = {
        tenantId: mockTenantId,
        action: AuditAction.USER_CREATED,
        entityType: AuditEntityType.USER,
      };

      mockPrismaService.auditLog.create.mockResolvedValue(mockAuditLog);

      await service.createAuditLog(minimalData);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: mockTenantId,
          action: AuditAction.USER_CREATED,
          entityType: AuditEntityType.USER,
          checksum: expect.any(String),
          performedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('getLogs', () => {
    it('should return filtered logs with total count', async () => {
      const filters = {
        userId: mockUserId,
        action: AuditAction.USER_CREATED,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        limit: 10,
        offset: 0,
      };

      const mockLogs = [mockAuditLog];
      const mockTotal = 1;

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(mockTotal);

      const result = await service.getLogs(mockTenantId, filters);

      expect(result).toEqual({
        logs: mockLogs,
        total: mockTotal,
      });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId: mockTenantId,
          userId: mockUserId,
          action: AuditAction.USER_CREATED,
          performedAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
        }),
        orderBy: { performedAt: 'desc' },
        take: 10,
        skip: 0,
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
      });
    });

    it('should handle search filter', async () => {
      const filters = { search: 'test search' };

      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.getLogs(mockTenantId, filters);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { metadata: { path: [], string_contains: 'test search' } },
              { oldValues: { path: [], string_contains: 'test search' } },
              { newValues: { path: [], string_contains: 'test search' } },
            ],
          }),
        }),
      );
    });
  });

  describe('getAuditStats', () => {
    it('should return comprehensive audit statistics', async () => {
      const mockStats = {
        totalLogs: 100,
        todayLogs: 10,
        uniqueUsers: 5,
        topActions: [{ action: AuditAction.USER_CREATED, _count: { action: 20 } }],
        activityByHour: [{ hour: '10', count: '5' }],
        failedLogins: 3,
        unusualHours: [{ count: '2' }],
        multipleIPs: [{ count: '1' }],
      };

      mockPrismaService.auditLog.count
        .mockResolvedValueOnce(mockStats.totalLogs)
        .mockResolvedValueOnce(mockStats.todayLogs)
        .mockResolvedValueOnce(mockStats.failedLogins);

      mockPrismaService.auditLog.findMany.mockResolvedValue(
        Array(mockStats.uniqueUsers).fill({ userId: 'user' }),
      );

      mockPrismaService.auditLog.groupBy.mockResolvedValue(mockStats.topActions);

      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockStats.activityByHour)
        .mockResolvedValueOnce(mockStats.unusualHours)
        .mockResolvedValueOnce(mockStats.multipleIPs);

      const result = await service.getAuditStats(mockTenantId);

      expect(result).toEqual({
        totalLogs: mockStats.totalLogs,
        todayLogs: mockStats.todayLogs,
        uniqueUsers: mockStats.uniqueUsers,
        topActions: [{ action: AuditAction.USER_CREATED, count: 20 }],
        activityByHour: [{ hour: 10, count: 5 }],
        suspiciousActivity: {
          failedLogins: mockStats.failedLogins,
          unusualHours: '2',
          multipleIPs: '1',
        },
      });
    });
  });

  describe('detectAnomalies', () => {
    it('should detect multiple failed login anomalies', async () => {
      const mockFailedLogins = [
        { ipAddress: '192.168.1.1', _count: { ipAddress: 10 } },
        { ipAddress: '192.168.1.2', _count: { ipAddress: 6 } },
      ];

      mockPrismaService.auditLog.groupBy.mockResolvedValue(mockFailedLogins);
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.detectAnomalies(mockTenantId);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        type: 'MULTIPLE_FAILED_LOGINS',
        severity: 'CRITICAL',
        ipAddress: '192.168.1.1',
        metadata: { attempts: 10 },
      });
      expect(result[1]).toMatchObject({
        type: 'MULTIPLE_FAILED_LOGINS',
        severity: 'HIGH',
        ipAddress: '192.168.1.2',
        metadata: { attempts: 6 },
      });
    });

    it('should detect unusual hours activity', async () => {
      const mockUnusualActivity = [
        { user_id: 'user-1', ip_address: '192.168.1.1', count: '15' },
      ];

      mockPrismaService.auditLog.groupBy.mockResolvedValue([]);
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockUnusualActivity)
        .mockResolvedValueOnce([]);

      const result = await service.detectAnomalies(mockTenantId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        type: 'UNUSUAL_HOURS',
        severity: 'MEDIUM',
        userId: 'user-1',
        ipAddress: '192.168.1.1',
        metadata: { actions: '15' },
      });
    });
  });

  describe('verifyIntegrity', () => {
    it('should verify audit log integrity', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          tenantId: mockTenantId,
          userId: mockUserId,
          action: AuditAction.USER_CREATED,
          entityType: AuditEntityType.USER,
          entityId: 'entity-1',
          oldValues: {},
          newValues: { status: 'ACTIVE' },
          checksum: 'valid-checksum',
          performedAt: new Date('2024-01-01T00:00:00Z'),
        },
      ];

      // Mock crypto hash to return predictable checksum
      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid-checksum'),
      };
      jest.spyOn(crypto, 'createHash').mockReturnValue(mockHash as any);

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.verifyIntegrity(mockTenantId);

      expect(result).toEqual({
        totalLogs: 1,
        validLogs: 1,
        invalidLogs: 0,
        corruptedLogs: [],
      });
    });

    it('should detect corrupted logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          tenantId: mockTenantId,
          userId: mockUserId,
          action: AuditAction.USER_CREATED,
          entityType: AuditEntityType.USER,
          entityId: 'entity-1',
          oldValues: {},
          newValues: { status: 'ACTIVE' },
          checksum: 'invalid-checksum',
          performedAt: new Date('2024-01-01T00:00:00Z'),
        },
      ];

      const mockHash = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid-checksum'),
      };
      jest.spyOn(crypto, 'createHash').mockReturnValue(mockHash as any);

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.verifyIntegrity(mockTenantId);

      expect(result).toEqual({
        totalLogs: 1,
        validLogs: 0,
        invalidLogs: 1,
        corruptedLogs: [
          {
            id: 'log-1',
            expectedChecksum: 'valid-checksum',
            actualChecksum: 'invalid-checksum',
            performedAt: new Date('2024-01-01T00:00:00Z'),
          },
        ],
      });
    });
  });

  describe('exportLogs', () => {
    it('should export logs as JSON', async () => {
      const mockLogs = [mockAuditLog];
      jest.spyOn(service, 'getLogs').mockResolvedValue({
        logs: mockLogs,
        total: 1,
      });

      const result = await service.exportLogs(mockTenantId, {}, 'json');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toEqual(JSON.stringify(mockLogs, null, 2));
    });

    it('should export logs as CSV', async () => {
      const mockLogs = [mockAuditLog];
      jest.spyOn(service, 'getLogs').mockResolvedValue({
        logs: mockLogs,
        total: 1,
      });

      const result = await service.exportLogs(mockTenantId, {}, 'csv');

      expect(result).toBeInstanceOf(Buffer);
      const csvContent = result.toString();
      expect(csvContent).toContain('ID,Performed At,User ID,Action');
      expect(csvContent).toContain(mockAuditLog.id);
    });

    it('should export logs as PDF', async () => {
      const mockLogs = [mockAuditLog];
      jest.spyOn(service, 'getLogs').mockResolvedValue({
        logs: mockLogs,
        total: 1,
      });

      const result = await service.exportLogs(mockTenantId, {}, 'pdf');

      expect(result).toBeInstanceOf(Buffer);
      const pdfContent = result.toString();
      expect(pdfContent).toContain('AUDIT LOGS REPORT');
      expect(pdfContent).toContain('USER_CREATED');
    });

    it('should throw error for unsupported format', async () => {
      jest.spyOn(service, 'getLogs').mockResolvedValue({
        logs: [],
        total: 0,
      });

      await expect(
        service.exportLogs(mockTenantId, {}, 'xml' as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('logAction', () => {
    it('should create audit log without throwing on success', async () => {
      jest.spyOn(service, 'createAuditLog').mockResolvedValue(mockAuditLog);

      const mockRequest = {
        ip: '192.168.1.1',
        get: jest.fn().mockReturnValue('Test Agent'),
        session: { id: 'session-123' },
      };

      await expect(
        service.logAction(
          mockTenantId,
          mockUserId,
          AuditAction.USER_CREATED,
          AuditEntityType.USER,
          'entity-123',
          { old: 'value' },
          { new: 'value' },
          { meta: 'data' },
          mockRequest,
        ),
      ).resolves.not.toThrow();

      expect(service.createAuditLog).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        userId: mockUserId,
        action: AuditAction.USER_CREATED,
        entityType: AuditEntityType.USER,
        entityId: 'entity-123',
        oldValues: { old: 'value' },
        newValues: { new: 'value' },
        metadata: { meta: 'data' },
        ipAddress: '192.168.1.1',
        userAgent: 'Test Agent',
        sessionId: 'session-123',
      });
    });

    it('should not throw error when audit log creation fails', async () => {
      jest.spyOn(service, 'createAuditLog').mockRejectedValue(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(
        service.logAction(
          mockTenantId,
          mockUserId,
          AuditAction.USER_CREATED,
          AuditEntityType.USER,
        ),
      ).resolves.not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to create audit log:', expect.any(Error));
    });
  });
});
