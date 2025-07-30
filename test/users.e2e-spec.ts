import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Test data
  const testTenant = 'test-tenant-users-e2e';
  const testAdmin = {
    id: 'test-admin-users-e2e',
    email: 'admin@users-e2e.com',
    username: 'admin',
    password: 'AdminPass123!@#',
    role: 'DIRECTOR_COMUNICACION',
    tenantId: testTenant,
    status: 'ACTIVE',
  };

  const testLider = {
    id: 'test-lider-users-e2e',
    email: 'lider@users-e2e.com',
    username: 'lider',  
    password: 'LiderPass123!@#',
    role: 'LIDER',
    tenantId: testTenant,
    status: 'ACTIVE',
  };

  const testAsistente = {
    id: 'test-asistente-users-e2e',
    email: 'asistente@users-e2e.com',
    username: 'asistente',
    password: 'AsistentePass123!@#',
    role: 'ASISTENTE',
    tenantId: testTenant,
    status: 'ACTIVE',
  };

  let adminToken: string;
  let liderToken: string;
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
    await loginUsers();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  describe('POST /users', () => {
    const newUserDto = {
      email: 'newuser@e2e.com',
      username: 'newuser',
      role: 'ASISTENTE',
    };

    it('should create user as DIRECTOR_COMUNICACION', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', testTenant)
        .send(newUserDto)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('temporaryPassword');
      expect(response.body.data.email).toBe(newUserDto.email);
      expect(response.body.data.role).toBe(newUserDto.role);
      expect(response.body.data.status).toBe('ACTIVE');

      // Cleanup
      await prismaService.user.delete({
        where: { id: response.body.data.id },
      });
    });

    it('should deny access for LIDER role', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${liderToken}`)
        .set('X-Tenant-ID', testTenant)
        .send(newUserDto)
        .expect(403);
    });

    it('should deny access for ASISTENTE role', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${asistenteToken}`)
        .set('X-Tenant-ID', testTenant)
        .send(newUserDto)
        .expect(403);
    });

    it('should fail with invalid email', async () => {
      const invalidEmailDto = {
        ...newUserDto,
        email: 'invalid-email',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', testTenant)
        .send(invalidEmailDto)
        .expect(400);
    });

    it('should fail with duplicate email in same tenant', async () => {
      const duplicateEmailDto = {
        ...newUserDto,
        email: testAsistente.email,
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', testTenant)
        .send(duplicateEmailDto)
        .expect(409);
    });

    it('should fail with invalid role', async () => {
      const invalidRoleDto = {
        ...newUserDto,
        role: 'INVALID_ROLE',
      };

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', testTenant)
        .send(invalidRoleDto)
        .expect(400);
    });
  });

  describe('GET /users', () => {
    it('should get users as DIRECTOR_COMUNICACION', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', testTenant)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Users retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get users as LIDER', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${liderToken}`)
        .set('X-Tenant-ID', testTenant)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should deny access for ASISTENTE role', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${asistenteToken}`)
        .set('X-Tenant-ID', testTenant)
        .expect(403);
    });

    it('should filter users by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?status=ACTIVE')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', testTenant)
        .expect(200);

      expect(response.body.data.every((user: any) => user.status === 'ACTIVE')).toBe(true);
    });

    it('should filter users by role', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?role=ASISTENTE')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', testTenant)
        .expect(200);

      expect(response.body.data.every((user: any) => user.role === 'ASISTENTE')).toBe(true);
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by id as DIRECTOR_COMUNICACION', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testAsistente.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', testTenant)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User retrieved successfully');
      expect(response.body.data).toHaveProperty('id', testAsistente.id);
      expect(response.body.data).toHaveProperty('email', testAsistente.email);
    });

    it('should get user by id as LIDER', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testAsistente.id}`)
        .set('Authorization', `Bearer ${liderToken}`)
        .set('X-Tenant-ID', testTenant)
        .expect(200);

      expect(response.body.data.id).toBe(testAsistente.id);
    });

    it('should get user by id as DIRECTOR_AREA', async () => {
      // First create a DIRECTOR_AREA user for this test
      const directorAreaUser = {
        id: 'test-director-area-e2e',
        email: 'director@area-e2e.com',
        username: 'director_area',
        password: await bcrypt.hash('DirectorPass123!@#', 12),
        role: 'DIRECTOR_AREA' as const,
        tenantId: testTenant,
        status: 'ACTIVE' as const,
      };

      await prismaService.user.create({
        data: directorAreaUser,
      });

      // Login as DIRECTOR_AREA
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .set('X-Tenant-ID', testTenant)
        .send({
          email: directorAreaUser.email,
          password: 'DirectorPass123!@#',
          tenantId: testTenant,
        });

      const directorAreaToken = loginResponse.body.data.accessToken;

      const response = await request(app.getHttpServer())
        .get(`/users/${testAsistente.id}`)
        .set('Authorization', `Bearer ${directorAreaToken}`)
        .set('X-Tenant-ID', testTenant)
        .expect(200);

      expect(response.body.data.id).toBe(testAsistente.id);

      // Cleanup
      await prismaService.user.delete({
        where: { id: directorAreaUser.id },
      });
    });

    it('should return 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .get('/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', testTenant)
        .expect(404);
    });
  });

  describe('PUT /users/:id/suspend', () => {
    it('should suspend user as DIRECTOR_COMUNICACION', async () => {
      const suspendDto = {
        reason: 'Policy violation for E2E test',
      };

      const response = await request(app.getHttpServer())
        .put(`/users/${testAsistente.id}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', testTenant)
        .send(suspendDto)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User suspended successfully');
      expect(response.body.data).toHaveProperty('status', 'SUSPENDED');
      expect(response.body.data).toHaveProperty('reason', suspendDto.reason);
    });

    it('should deny access for LIDER role', async () => {
      await request(app.getHttpServer())
        .put(`/users/${testAsistente.id}/suspend`)
        .set('Authorization', `Bearer ${liderToken}`)
        .set('X-Tenant-ID', testTenant)
        .send({ reason: 'Test' })
        .expect(403);
    });
  });

  describe('PUT /users/:id/reactivate', () => {
    it('should reactivate user as DIRECTOR_COMUNICACION', async () => {
      const response = await request(app.getHttpServer())
        .put(`/users/${testAsistente.id}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', testTenant)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User reactivated successfully');
      expect(response.body.data).toHaveProperty('status', 'ACTIVE');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete user as DIRECTOR_COMUNICACION', async () => {
      // First create a user to delete
      const userToDelete = {
        id: 'test-user-to-delete-e2e',
        email: 'delete-me@e2e.com',
        username: 'deleteme',
        password: await bcrypt.hash('DeleteMe123!@#', 12),
        role: 'ASISTENTE' as const,
        tenantId: testTenant,
        status: 'ACTIVE' as const,
      };

      await prismaService.user.create({
        data: userToDelete,
      });

      const deleteDto = {
        confirmation: 'DELETE_PERMANENTLY',
        reason: 'E2E test cleanup',
      };

      const response = await request(app.getHttpServer())
        .delete(`/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', testTenant)
        .send(deleteDto)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User deleted permanently');
      expect(response.body.data).toHaveProperty('id', userToDelete.id);

      // Verify user is actually deleted
      const deletedUser = await prismaService.user.findUnique({
        where: { id: userToDelete.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should fail with invalid confirmation', async () => {
      const invalidDeleteDto = {
        confirmation: 'INVALID',
        reason: 'Test',
      };

      await request(app.getHttpServer())
        .delete(`/users/${testAsistente.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('X-Tenant-ID', testTenant)
        .send(invalidDeleteDto)
        .expect(500);
    });

    it('should deny access for LIDER role', async () => {
      const deleteDto = {
        confirmation: 'DELETE_PERMANENTLY',
        reason: 'Test',
      };

      await request(app.getHttpServer())
        .delete(`/users/${testAsistente.id}`)
        .set('Authorization', `Bearer ${liderToken}`)
        .set('X-Tenant-ID', testTenant)
        .send(deleteDto)
        .expect(403);
    });
  });

  // Helper functions
  async function setupTestData(): Promise<void> {
    // Create test tenant
    await prismaService.tenant.upsert({
      where: { id: testTenant },
      update: {},
      create: {
        id: testTenant,
        name: 'Test Tenant Users E2E',
        type: 'GOVERNMENT_STATE',
        status: 'ACTIVE',
      },
    });

    // Hash passwords
    const adminHashedPassword = await bcrypt.hash(testAdmin.password, 12);
    const liderHashedPassword = await bcrypt.hash(testLider.password, 12);
    const asistenteHashedPassword = await bcrypt.hash(testAsistente.password, 12);

    // Create test users
    await prismaService.user.upsert({
      where: { id: testAdmin.id },
      update: {},
      create: {
        ...testAdmin,
        password: adminHashedPassword,
        role: testAdmin.role as any,
        status: testAdmin.status as any,
      },
    });

    await prismaService.user.upsert({
      where: { id: testLider.id },
      update: {},
      create: {
        ...testLider,
        password: liderHashedPassword,
        role: testLider.role as any,
        status: testLider.status as any,
      },
    });

    await prismaService.user.upsert({
      where: { id: testAsistente.id },
      update: {},
      create: {
        ...testAsistente,
        password: asistenteHashedPassword,
        role: testAsistente.role as any,
        status: testAsistente.status as any,
      },
    });
  }

  async function loginUsers(): Promise<void> {
    // Login as admin
    const adminResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Tenant-ID', testTenant)
      .send({
        email: testAdmin.email,
        password: testAdmin.password,
        tenantId: testAdmin.tenantId,
      });
    adminToken = adminResponse.body.data.accessToken;

    // Login as lider
    const liderResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Tenant-ID', testTenant)
      .send({
        email: testLider.email,
        password: testLider.password,
        tenantId: testLider.tenantId,
      });
    liderToken = liderResponse.body.data.accessToken;

    // Login as asistente
    const asistenteResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Tenant-ID', testTenant)
      .send({
        email: testAsistente.email,
        password: testAsistente.password,
        tenantId: testAsistente.tenantId,
      });
    asistenteToken = asistenteResponse.body.data.accessToken;
  }

  async function cleanupTestData(): Promise<void> {
    try {
      // Delete users first (due to foreign key constraint)
      await prismaService.user.deleteMany({
        where: {
          tenantId: testTenant,
        },
      });

      // Delete tenant
      await prismaService.tenant.deleteMany({
        where: { id: testTenant },
      });
    } catch (error) {
      console.log('Cleanup error (non-critical):', error);
    }
  }
});