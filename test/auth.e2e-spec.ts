import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Test data
  const testTenant = 'test-tenant-e2e';
  const testUser = {
    id: 'test-user-e2e-001',
    email: 'test@e2e.com',
    username: 'testuser',
    password: 'Test123!@#',
    role: 'DIRECTOR_COMUNICACION',
    tenantId: testTenant,
    status: 'ACTIVE',
  };

  const testAsistente = {
    id: 'test-user-e2e-002',
    email: 'asistente@e2e.com',
    username: 'asistente',
    password: 'Test123!@#',
    role: 'ASISTENTE',
    tenantId: testTenant,
    status: 'ACTIVE',
  };

  let accessToken: string;
  let refreshToken: string;
  let asistenteToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto = {
        email: testUser.email,
        password: testUser.password,
        tenantId: testUser.tenantId,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Tenant-ID', testTenant)
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn', 1800);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('role', testUser.role);
      expect(response.body.user).not.toHaveProperty('password');

      // Save tokens for subsequent tests
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should fail with invalid credentials', async () => {
      const loginDto = {
        email: testUser.email,
        password: 'wrongpassword',
        tenantId: testUser.tenantId,
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Tenant-ID', testTenant)
        .send(loginDto)
        .expect(401);
    });

    it('should fail with missing tenant header', async () => {
      const loginDto = {
        email: testUser.email,
        password: testUser.password,
        tenantId: testUser.tenantId,
      };

      await request(app.getHttpServer()).post('/auth/login').send(loginDto).expect(400);
    });

    it('should fail with invalid tenant in body vs header mismatch', async () => {
      const loginDto = {
        email: testUser.email,
        password: testUser.password,
        tenantId: 'different-tenant',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Tenant-ID', testTenant)
        .send(loginDto)
        .expect(401);
    });

    it('should fail with missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Tenant-ID', testTenant)
        .send({})
        .expect(400);
    });

    it('should fail with invalid email format', async () => {
      const loginDto = {
        email: 'invalid-email',
        password: testUser.password,
        tenantId: testUser.tenantId,
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Tenant-ID', testTenant)
        .send(loginDto)
        .expect(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh tokens successfully with valid refresh token', async () => {
      const refreshDto = {
        refreshToken: refreshToken,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshDto)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Token refreshed successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('expiresIn', 1800);

      // Update tokens
      accessToken = response.body.data.accessToken;
      refreshToken = response.body.data.refreshToken;
    });

    it('should fail with invalid refresh token', async () => {
      const refreshDto = {
        refreshToken: 'invalid-refresh-token',
      };

      await request(app.getHttpServer()).post('/auth/refresh').send(refreshDto).expect(401);
    });

    it('should fail with missing refresh token', async () => {
      await request(app.getHttpServer()).post('/auth/refresh').send({}).expect(400);
    });
  });

  describe('GET /auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', testTenant)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', testUser.id);
      expect(response.body.data).toHaveProperty('email', testUser.email);
      expect(response.body.data).toHaveProperty('role', testUser.role);
      expect(response.body.data).toHaveProperty('tenantId', testUser.tenantId);
    });

    it('should fail without authorization header', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('X-Tenant-ID', testTenant)
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .set('X-Tenant-ID', testTenant)
        .expect(401);
    });

    it('should fail without tenant header', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', testTenant)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');
    });

    it('should fail without authorization header', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('X-Tenant-ID', testTenant)
        .expect(401);
    });
  });

  describe('Role-based Authorization', () => {
    beforeAll(async () => {
      // Login as asistente user for role tests
      const loginDto = {
        email: testAsistente.email,
        password: testAsistente.password,
        tenantId: testAsistente.tenantId,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Tenant-ID', testTenant)
        .send(loginDto)
        .expect(200);

      asistenteToken = response.body.data.accessToken;

      // Re-login as director to get fresh token after logout test
      const directorResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Tenant-ID', testTenant)
        .send({
          email: testUser.email,
          password: testUser.password,
          tenantId: testUser.tenantId,
        })
        .expect(200);

      accessToken = directorResponse.body.data.accessToken;
    });

    describe('GET /auth/admin-only', () => {
      it('should allow access for DIRECTOR role', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/admin-only')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('X-Tenant-ID', testTenant)
          .expect(200);

        expect(response.body).toHaveProperty(
          'message',
          'This endpoint is only accessible by Directors',
        );
      });

      it('should deny access for ASISTENTE role', async () => {
        await request(app.getHttpServer())
          .get('/auth/admin-only')
          .set('Authorization', `Bearer ${asistenteToken}`)
          .set('X-Tenant-ID', testTenant)
          .expect(403);
      });

      it('should fail without authentication', async () => {
        await request(app.getHttpServer())
          .get('/auth/admin-only')
          .set('X-Tenant-ID', testTenant)
          .expect(401);
      });
    });

    describe('GET /auth/management-only', () => {
      it('should allow access for DIRECTOR role', async () => {
        const response = await request(app.getHttpServer())
          .get('/auth/management-only')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('X-Tenant-ID', testTenant)
          .expect(200);

        expect(response.body).toHaveProperty(
          'message',
          'This endpoint is accessible by Directors and Leaders',
        );
      });

      it('should deny access for ASISTENTE role', async () => {
        await request(app.getHttpServer())
          .get('/auth/management-only')
          .set('Authorization', `Bearer ${asistenteToken}`)
          .set('X-Tenant-ID', testTenant)
          .expect(403);
      });
    });
  });

  describe('Multi-tenancy', () => {
    it('should prevent cross-tenant access', async () => {
      // Try to access with wrong tenant ID in header
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', 'wrong-tenant')
        .expect(401);
    });
  });

  describe('Token Expiration & Security', () => {
    it('should handle malformed JWT tokens', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer malformed.jwt.token')
        .set('X-Tenant-ID', testTenant)
        .expect(401);
    });

    it('should handle empty JWT tokens', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer ')
        .set('X-Tenant-ID', testTenant)
        .expect(401);
    });
  });

  // Helper functions
  async function setupTestData() {
    // Create test tenant first
    await prismaService.tenant.upsert({
      where: { id: testTenant },
      update: {},
      create: {
        id: testTenant,
        name: 'Test Tenant E2E',
        type: 'GOVERNMENT_STATE',
        status: 'ACTIVE',
      },
    });

    // Hash passwords
    const hashedPassword = await bcrypt.hash(testUser.password, 12);

    // Create test users
    await prismaService.user.upsert({
      where: { id: testUser.id },
      update: {},
      create: {
        id: testUser.id,
        email: testUser.email,
        username: testUser.username,
        password: hashedPassword,
        role: testUser.role as any,
        tenantId: testUser.tenantId,
        status: testUser.status as any,
      },
    });

    await prismaService.user.upsert({
      where: { id: testAsistente.id },
      update: {},
      create: {
        id: testAsistente.id,
        email: testAsistente.email,
        username: testAsistente.username,
        password: hashedPassword,
        role: testAsistente.role as any,
        tenantId: testAsistente.tenantId,
        status: testAsistente.status as any,
      },
    });
  }

  async function cleanupTestData() {
    try {
      // Delete users first (due to foreign key constraint)
      await prismaService.user.deleteMany({
        where: {
          OR: [{ id: testUser.id }, { id: testAsistente.id }],
        },
      });

      // Delete tenant
      await prismaService.tenant.deleteMany({
        where: {
          id: testTenant,
        },
      });
    } catch (error) {
      console.log('Cleanup error (non-critical):', error);
    }
  }
});
