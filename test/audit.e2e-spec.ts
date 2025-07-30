import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuditModule } from '../src/audit/audit.module';
import { DatabaseModule } from '../src/database/database.module';
import { AuthModule } from '../src/auth/auth.module';
import { PrismaService } from '../src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditAction, AuditEntityType, SecurityLevel } from '@prisma/client';
import * as crypto from 'crypto';

describe('AuditController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const testTenant = {
    id: 'test-tenant-123',
    name: 'Test Tenant',
    type: 'GOVERNMENT_STATE' as const,
    status: 'ACTIVE' as const,
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const testUser = {
    id: 'test-user-456',
    email: 'director@test.com',
    username: 'director_test',
    password: 'hashedpassword',
    role: 'DIRECTOR_COMUNICACION' as const,
    status: 'ACTIVE' as const,
    tenantId: testTenant.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null,
    suspendedAt: null,
    suspendedBy: null,
    suspensionReason: null,
  };

  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuditModule, DatabaseModule, AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Clean database before tests
    await prismaService.auditLog.deleteMany();
    await prismaService.user.deleteMany();
    await prismaService.tenant.deleteMany();

    // Create test tenant and user
    await prismaService.tenant.create({ data: testTenant });
    await prismaService.user.create({ data: testUser });

    // Generate JWT token for authentication
    authToken = jwtService.sign({
      sub: testUser.id,
      email: testUser.email,
      tenantId: testUser.tenantId,
      role: testUser.role,
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.auditLog.deleteMany();
    await prismaService.user.deleteMany();
    await prismaService.tenant.deleteMany();
    await app.close();
  });

  beforeEach(async () => {
    // Clean audit logs before each test
    await prismaService.auditLog.deleteMany();
  });

  describe('/audit/logs (GET)', () => {
    it('should return audit logs for authenticated user', async () => {
      // Create some test audit logs
      const testLogs = [
        {
          id: crypto.randomUUID(),
          tenantId: testTenant.id,
          userId: testUser.id,
          action: AuditAction.USER_CREATED,
          entityType: AuditEntityType.USER,
          entityId: 'entity-1',
          oldValues: {},
          newValues: { status: 'ACTIVE' },
          metadata: { source: 'test' },
          ipAddress: '192.168.1.1',
          userAgent: 'Test Agent',
          sessionId: 'session-123',
          securityLevel: SecurityLevel.INTERNAL,
          checksum: 'test-checksum-1',
          performedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          tenantId: testTenant.id,
          userId: testUser.id,
          action: AuditAction.USER_UPDATED,
          entityType: AuditEntityType.USER,
          entityId: 'entity-2',
          oldValues: { status: 'INACTIVE' },
          newValues: { status: 'ACTIVE' },
          metadata: { source: 'test' },
          ipAddress: '192.168.1.2',
          userAgent: 'Test Agent',
          sessionId: 'session-456',
          securityLevel: SecurityLevel.CONFIDENTIAL,
          checksum: 'test-checksum-2',
          performedAt: new Date(),
        },
      ];

      await prismaService.auditLog.createMany({ data: testLogs });

      const response = await request(app.getHttpServer())
        .get('/audit/logs')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Audit logs retrieved successfully');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toEqual({
        total: 2,
        limit: 50,
        offset: 0,
      });

      // Verify the logs are ordered by performedAt desc
      expect(response.body.data[0].action).toBe(AuditAction.USER_UPDATED);
      expect(response.body.data[1].action).toBe(AuditAction.USER_CREATED);
    });

    it('should filter logs by action', async () => {
      const testLog = {
        id: crypto.randomUUID(),
        tenantId: testTenant.id,
        userId: testUser.id,
        action: AuditAction.LOGIN,
        entityType: AuditEntityType.USER,
        entityId: testUser.id,
        oldValues: {},
        newValues: {},
        metadata: { loginMethod: 'password' },
        ipAddress: '192.168.1.1',
        checksum: 'test-checksum',
        performedAt: new Date(),
      };

      await prismaService.auditLog.create({ data: testLog });

      const response = await request(app.getHttpServer())
        .get('/audit/logs')
        .query({ action: AuditAction.LOGIN_SUCCESS })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].action).toBe(AuditAction.LOGIN_SUCCESS);
    });

    it('should apply pagination', async () => {
      // Create 5 test logs
      const testLogs = Array.from({ length: 5 }, (_, i) => ({
        id: crypto.randomUUID(),
        tenantId: testTenant.id,
        userId: testUser.id,
        action: AuditAction.USER_VIEWED,
        entityType: AuditEntityType.USER,
        entityId: `entity-${i}`,
        oldValues: {},
        newValues: {},
        metadata: { index: i },
        checksum: `checksum-${i}`,
        performedAt: new Date(Date.now() + i * 1000), // Different timestamps
      }));

      await prismaService.auditLog.createMany({ data: testLogs });

      const response = await request(app.getHttpServer())
        .get('/audit/logs')
        .query({ limit: 2, offset: 1 })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toEqual({
        total: 5,
        limit: 2,
        offset: 1,
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/audit/logs')
        .expect(401);
    });
  });

  describe('/audit/stats (GET)', () => {
    it('should return audit statistics', async () => {
      // Create test logs with different actions
      const testLogs = [
        {
          id: crypto.randomUUID(),
          tenantId: testTenant.id,
          userId: testUser.id,
          action: AuditAction.USER_CREATED,
          entityType: AuditEntityType.USER,
          entityId: 'entity-1',
          checksum: 'checksum-1',
          performedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          tenantId: testTenant.id,
          userId: testUser.id,
          action: AuditAction.USER_CREATED,
          entityType: AuditEntityType.USER,
          entityId: 'entity-2',
          checksum: 'checksum-2',
          performedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          tenantId: testTenant.id,
          userId: testUser.id,
          action: AuditAction.LOGIN,
          entityType: AuditEntityType.USER,
          entityId: testUser.id,
          checksum: 'checksum-3',
          performedAt: new Date(),
        },
      ];

      await prismaService.auditLog.createMany({ data: testLogs });

      const response = await request(app.getHttpServer())
        .get('/audit/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Audit statistics retrieved successfully');
      expect(response.body.data).toHaveProperty('totalLogs');
      expect(response.body.data).toHaveProperty('todayLogs');
      expect(response.body.data).toHaveProperty('uniqueUsers');
      expect(response.body.data).toHaveProperty('topActions');
      expect(response.body.data).toHaveProperty('suspiciousActivity');

      expect(response.body.data.totalLogs).toBe(3);
      expect(response.body.data.topActions).toContainEqual({
        action: AuditAction.USER_CREATED,
        count: 2,
      });
    });
  });

  describe('/audit/anomalies (GET)', () => {
    it('should detect anomalies', async () => {
      // Create multiple failed login attempts to trigger anomaly detection
      const failedLogins = Array.from({ length: 6 }, (_, i) => ({
        id: crypto.randomUUID(),
        tenantId: testTenant.id,
        userId: null,
        action: AuditAction.LOGIN_FAILED,
        entityType: AuditEntityType.USER,
        entityId: testUser.id,
        ipAddress: '192.168.1.100', // Same IP for multiple failures
        checksum: `checksum-failed-${i}`,
        performedAt: new Date(Date.now() - (5 - i) * 60000), // Within last hour
      }));

      await prismaService.auditLog.createMany({ data: failedLogins });

      const response = await request(app.getHttpServer())
        .get('/audit/anomalies')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Audit anomalies detected successfully');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.total).toBeGreaterThanOrEqual(0);

      // Should detect the multiple failed logins anomaly
      const failedLoginAnomaly = response.body.data.find(
        (anomaly: any) => anomaly.type === 'MULTIPLE_FAILED_LOGINS'
      );
      if (failedLoginAnomaly) {
        expect(failedLoginAnomaly.ipAddress).toBe('192.168.1.100');
        expect(failedLoginAnomaly.severity).toBe('HIGH');
      }
    });
  });

  describe('/audit/verify (POST)', () => {
    it('should verify audit log integrity', async () => {
      // Create a test log with correct checksum
      const checksumData = [
        testTenant.id,
        testUser.id,
        AuditAction.USER_CREATED,
        AuditEntityType.USER,
        'entity-1',
        JSON.stringify({}),
        JSON.stringify({ status: 'ACTIVE' }),
        new Date('2024-01-01T00:00:00Z').toISOString()
      ].join('|');

      const correctChecksum = crypto.createHash('sha256').update(checksumData).digest('hex');

      const testLog = {
        id: crypto.randomUUID(),
        tenantId: testTenant.id,
        userId: testUser.id,
        action: AuditAction.USER_CREATED,
        entityType: AuditEntityType.USER,
        entityId: 'entity-1',
        oldValues: {},
        newValues: { status: 'ACTIVE' },
        checksum: correctChecksum,
        performedAt: new Date('2024-01-01T00:00:00Z'),
      };

      await prismaService.auditLog.create({ data: testLog });

      const response = await request(app.getHttpServer())
        .post('/audit/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Integrity verification completed');
      expect(response.body.data).toHaveProperty('totalLogs');
      expect(response.body.data).toHaveProperty('validLogs');
      expect(response.body.data).toHaveProperty('invalidLogs');
      expect(response.body.data).toHaveProperty('corruptedLogs');

      expect(response.body.data.totalLogs).toBe(1);
      expect(response.body.data.validLogs).toBe(1);
      expect(response.body.data.invalidLogs).toBe(0);
    });
  });

  describe('/audit/export/:format (GET)', () => {
    beforeEach(async () => {
      // Create test data for export
      const testLog = {
        id: crypto.randomUUID(),
        tenantId: testTenant.id,
        userId: testUser.id,
        action: AuditAction.USER_CREATED,
        entityType: AuditEntityType.USER,
        entityId: 'entity-1',
        oldValues: {},
        newValues: { status: 'ACTIVE' },
        metadata: { source: 'test' },
        ipAddress: '192.168.1.1',
        userAgent: 'Test Agent',
        securityLevel: SecurityLevel.INTERNAL,
        checksum: 'test-checksum',
        performedAt: new Date(),
      };

      await prismaService.auditLog.create({ data: testLog });
    });

    it('should export logs as CSV', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit/export/csv')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('ID,Performed At,User ID,Action');
      expect(response.text).toContain('USER_CREATED');
    });

    it('should export logs as JSON', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit/export/json')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
      
      const jsonData = JSON.parse(response.text);
      expect(Array.isArray(jsonData)).toBe(true);
      expect(jsonData[0]).toHaveProperty('action', AuditAction.USER_CREATED);
    });

    it('should export logs as PDF', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit/export/pdf')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('AUDIT LOGS REPORT');
    });

    it('should return 400 for invalid export format', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit/export/xml')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('Invalid export format');
    });
  });

  describe('/audit/dashboard (GET)', () => {
    it('should return dashboard data', async () => {
      // Create test data
      const testLogs = [
        {
          id: crypto.randomUUID(),
          tenantId: testTenant.id,
          userId: testUser.id,
          action: AuditAction.USER_CREATED,
          entityType: AuditEntityType.USER,
          entityId: 'entity-1',
          checksum: 'checksum-1',
          performedAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          tenantId: testTenant.id,
          userId: testUser.id,
          action: AuditAction.LOGIN,
          entityType: AuditEntityType.USER,
          entityId: testUser.id,
          checksum: 'checksum-2',
          performedAt: new Date(),
        },
      ];

      await prismaService.auditLog.createMany({ data: testLogs });

      const response = await request(app.getHttpServer())
        .get('/audit/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Audit dashboard data retrieved successfully');
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data).toHaveProperty('anomalies');
      expect(response.body.data).toHaveProperty('summary');

      expect(response.body.data.summary).toHaveProperty('totalLogs');
      expect(response.body.data.summary).toHaveProperty('todayActivity');
      expect(response.body.data.summary).toHaveProperty('criticalAnomalies');
      expect(response.body.data.summary).toHaveProperty('highAnomalies');

      expect(response.body.data.summary.totalLogs).toBe(2);
    });
  });

  describe('Authorization', () => {
    it('should require DIRECTOR_COMUNICACION role for sensitive endpoints', async () => {
      // Create a user with different role
      const regularUser = {
        id: 'regular-user-789',
        email: 'regular@test.com',
        username: 'regular_test',
        password: 'hashedpassword',
        role: 'ANALISTA',
        status: 'ACTIVE',
        tenantId: testTenant.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        suspendedAt: null,
        suspendedBy: null,
        suspensionReason: null,
      };

      await prismaService.user.create({ data: regularUser });

      const regularUserToken = jwtService.sign({
        sub: regularUser.id,
        email: regularUser.email,
        tenantId: regularUser.tenantId,
        role: regularUser.role,
      });

      // Should be forbidden to access audit logs
      await request(app.getHttpServer())
        .get('/audit/logs')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      // Should be forbidden to access anomalies
      await request(app.getHttpServer())
        .get('/audit/anomalies')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      // Should be forbidden to verify integrity
      await request(app.getHttpServer())
        .post('/audit/verify')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);

      // Clean up
      await prismaService.user.delete({ where: { id: regularUser.id } });
    });

    it('should allow LIDER role to access stats and dashboard', async () => {
      // Create a user with LIDER role
      const leaderUser = {
        id: 'leader-user-789',
        email: 'leader@test.com',
        username: 'leader_test',
        password: 'hashedpassword',
        role: 'LIDER',
        status: 'ACTIVE',
        tenantId: testTenant.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
        suspendedAt: null,
        suspendedBy: null,
        suspensionReason: null,
      };

      await prismaService.user.create({ data: leaderUser });

      const leaderToken = jwtService.sign({
        sub: leaderUser.id,
        email: leaderUser.email,
        tenantId: leaderUser.tenantId,
        role: leaderUser.role,
      });

      // Should be able to access stats
      await request(app.getHttpServer())
        .get('/audit/stats')
        .set('Authorization', `Bearer ${leaderToken}`)
        .expect(200);

      // Should be able to access dashboard
      await request(app.getHttpServer())
        .get('/audit/dashboard')
        .set('Authorization', `Bearer ${leaderToken}`)
        .expect(200);

      // Clean up
      await prismaService.user.delete({ where: { id: leaderUser.id } });
    });
  });
});