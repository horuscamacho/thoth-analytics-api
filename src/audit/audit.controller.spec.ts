import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditAction, AuditEntityType, SecurityLevel } from '@prisma/client';
import { } from './dto';

describe('AuditController', () => {
  let controller: AuditController;
  let auditService: AuditService;

  const mockAuditService = {
    getLogs: jest.fn(),
    getAuditStats: jest.fn(),
    detectAnomalies: jest.fn(),
    verifyIntegrity: jest.fn(),
    exportLogs: jest.fn(),
  };

  const mockCurrentUser = {
    id: 'user-123',
    email: 'test@example.com',
    tenantId: 'tenant-456',
    role: 'DIRECTOR_COMUNICACION',
  };

  const mockAuditLog = {
    id: 'audit-789',
    tenantId: 'tenant-456',
    userId: 'user-123',
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
  };

  const mockAuditStats = {
    totalLogs: 100,
    todayLogs: 10,
    uniqueUsers: 5,
    topActions: [{ action: AuditAction.USER_CREATED, count: 20 }],
    activityByHour: [{ hour: 10, count: 5 }],
    suspiciousActivity: {
      failedLogins: 3,
      unusualHours: 2,
      multipleIPs: 1,
    },
  };

  const mockAnomalies = [
    {
      id: 'anomaly-1',
      type: 'MULTIPLE_FAILED_LOGINS',
      description: 'Multiple failed login attempts',
      severity: 'CRITICAL',
      userId: null,
      ipAddress: '192.168.1.1',
      detectedAt: new Date(),
      metadata: { attempts: 10 },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<AuditController>(AuditController);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLogs', () => {
    it('should return audit logs with pagination', async () => {
      const filters = {
        userId: 'user-123',
        action: AuditAction.USER_CREATED,
        limit: 10,
        offset: 0,
      };

      const mockResponse = {
        logs: [mockAuditLog],
        total: 1,
      };

      mockAuditService.getLogs.mockResolvedValue(mockResponse);

      const result = await controller.getLogs(filters, mockCurrentUser);

      expect(auditService.getLogs).toHaveBeenCalledWith(mockCurrentUser.tenantId, filters);
      expect(result).toEqual({
        message: 'Audit logs retrieved successfully',
        data: mockResponse.logs,
        pagination: {
          total: mockResponse.total,
          limit: 10,
          offset: 0,
        },
      });
    });

    it('should use default pagination values', async () => {
      const filters = {};
      const mockResponse = { logs: [], total: 0 };

      mockAuditService.getLogs.mockResolvedValue(mockResponse);

      const result = await controller.getLogs(filters, mockCurrentUser);

      expect(result.pagination).toEqual({
        total: 0,
        limit: 50,
        offset: 0,
      });
    });
  });

  describe('getLogById', () => {
    it('should return specific audit log by id', async () => {
      const logId = 'audit-789';
      const mockResponse = {
        logs: [mockAuditLog],
        total: 1,
      };

      mockAuditService.getLogs.mockResolvedValue(mockResponse);

      const result = await controller.getLogById(logId, mockCurrentUser);

      expect(auditService.getLogs).toHaveBeenCalledWith(mockCurrentUser.tenantId, {
        limit: 1,
        offset: 0,
      });
      expect(result).toEqual({
        message: 'Audit log retrieved successfully',
        data: mockAuditLog,
      });
    });

    it('should throw BadRequestException when log not found', async () => {
      const logId = 'non-existent-log';
      const mockResponse = { logs: [], total: 0 };

      mockAuditService.getLogs.mockResolvedValue(mockResponse);

      await expect(controller.getLogById(logId, mockCurrentUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.getLogById(logId, mockCurrentUser)).rejects.toThrow(
        'Audit log not found',
      );
    });
  });

  describe('getStats', () => {
    it('should return audit statistics', async () => {
      mockAuditService.getAuditStats.mockResolvedValue(mockAuditStats);

      const result = await controller.getStats(mockCurrentUser);

      expect(auditService.getAuditStats).toHaveBeenCalledWith(mockCurrentUser.tenantId);
      expect(result).toEqual({
        message: 'Audit statistics retrieved successfully',
        data: mockAuditStats,
      });
    });
  });

  describe('getAnomalies', () => {
    it('should return detected anomalies', async () => {
      mockAuditService.detectAnomalies.mockResolvedValue(mockAnomalies);

      const result = await controller.getAnomalies(mockCurrentUser);

      expect(auditService.detectAnomalies).toHaveBeenCalledWith(mockCurrentUser.tenantId);
      expect(result).toEqual({
        message: 'Audit anomalies detected successfully',
        data: mockAnomalies,
        total: mockAnomalies.length,
      });
    });
  });

  describe('verifyIntegrity', () => {
    it('should return integrity verification report', async () => {
      const mockIntegrityReport = {
        totalLogs: 100,
        validLogs: 98,
        invalidLogs: 2,
        corruptedLogs: [
          {
            id: 'log-1',
            expectedChecksum: 'valid',
            actualChecksum: 'invalid',
            performedAt: new Date(),
          },
        ],
      };

      mockAuditService.verifyIntegrity.mockResolvedValue(mockIntegrityReport);

      const result = await controller.verifyIntegrity(mockCurrentUser);

      expect(auditService.verifyIntegrity).toHaveBeenCalledWith(mockCurrentUser.tenantId);
      expect(result).toEqual({
        message: 'Integrity verification completed',
        data: mockIntegrityReport,
      });
    });
  });

  describe('exportLogs', () => {
    let mockResponse: Partial<Response>;

    beforeEach(() => {
      mockResponse = {
        set: jest.fn(),
        send: jest.fn(),
      };
    });

    it('should export logs as CSV', async () => {
      const format = 'csv';
      const filters = {};
      const mockBuffer = Buffer.from('CSV content');

      mockAuditService.exportLogs.mockResolvedValue(mockBuffer);

      await controller.exportLogs(
        format,
        filters,
        mockCurrentUser,
        mockResponse as Response,
      );

      expect(auditService.exportLogs).toHaveBeenCalledWith(
        mockCurrentUser.tenantId,
        filters,
        format,
      );
      expect(mockResponse.set).toHaveBeenCalledWith({
        'Content-Type': 'text/csv',
        'Content-Disposition': expect.stringContaining('attachment; filename="audit-logs-'),
        'Content-Length': mockBuffer.length,
      });
      expect(mockResponse.send).toHaveBeenCalledWith(mockBuffer);
    });

    it('should export logs as JSON', async () => {
      const format = 'json';
      const filters = {};
      const mockBuffer = Buffer.from('JSON content');

      mockAuditService.exportLogs.mockResolvedValue(mockBuffer);

      await controller.exportLogs(
        format,
        filters,
        mockCurrentUser,
        mockResponse as Response,
      );

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      );
    });

    it('should export logs as PDF', async () => {
      const format = 'pdf';
      const filters = {};
      const mockBuffer = Buffer.from('PDF content');

      mockAuditService.exportLogs.mockResolvedValue(mockBuffer);

      await controller.exportLogs(
        format,
        filters,
        mockCurrentUser,
        mockResponse as Response,
      );

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/pdf',
        }),
      );
    });

    it('should throw BadRequestException for invalid format', async () => {
      const format = 'xml';
      const filters = {};

      await expect(
        controller.exportLogs(format, filters, mockCurrentUser, mockResponse as Response),
      ).rejects.toThrow(BadRequestException);
      await expect(
        controller.exportLogs(format, filters, mockCurrentUser, mockResponse as Response),
      ).rejects.toThrow('Invalid export format. Supported: csv, json, pdf');
    });
  });

  describe('getDashboardData', () => {
    it('should return dashboard data with stats and anomalies', async () => {
      mockAuditService.getAuditStats.mockResolvedValue(mockAuditStats);
      mockAuditService.detectAnomalies.mockResolvedValue([
        ...mockAnomalies,
        ...Array(15).fill({
          id: 'anomaly-extra',
          severity: 'HIGH',
        }),
      ]);

      const result = await controller.getDashboardData(mockCurrentUser);

      expect(auditService.getAuditStats).toHaveBeenCalledWith(mockCurrentUser.tenantId);
      expect(auditService.detectAnomalies).toHaveBeenCalledWith(mockCurrentUser.tenantId);
      expect(result.data.anomalies).toHaveLength(10); // Should be limited to 10
      expect(result.data.summary).toEqual({
        totalLogs: mockAuditStats.totalLogs,
        todayActivity: mockAuditStats.todayLogs,
        criticalAnomalies: 1, // One CRITICAL anomaly in mock data
        highAnomalies: 15, // 15 HIGH anomalies in mock data
      });
    });

    it('should handle empty anomalies list', async () => {
      mockAuditService.getAuditStats.mockResolvedValue(mockAuditStats);
      mockAuditService.detectAnomalies.mockResolvedValue([]);

      const result = await controller.getDashboardData(mockCurrentUser);

      expect(result.data.anomalies).toEqual([]);
      expect(result.data.summary).toEqual({
        totalLogs: mockAuditStats.totalLogs,
        todayActivity: mockAuditStats.todayLogs,
        criticalAnomalies: 0,
        highAnomalies: 0,
      });
    });
  });
});
