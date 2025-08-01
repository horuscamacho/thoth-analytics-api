import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditEntityType } from '@prisma/client';

describe('TenantsService - Extended Tests', () => {
  let service: TenantsService;
  let auditService: AuditService;

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Organization',
    type: 'GOVERNMENT_STATE',
    status: 'ACTIVE',
    settings: { theme: 'default' },
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { users: 0 },
  };

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      count: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    tweet: {
      count: jest.fn(),
    },
    news: {
      count: jest.fn(),
    },
    aiAnalysis: {
      count: jest.fn(),
    },
    alert: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockAuditService = {
    logAction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  describe('createTenant', () => {
    const createTenantDto = {
      name: 'New Organization',
      type: 'GOVERNMENT_STATE' as const,
      settings: { theme: 'dark' },
    };

    it('should create tenant successfully', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue(mockTenant);

      const result = await service.createTenant(createTenantDto, 'admin-456');

      expect(result).toEqual(mockTenant);
      expect(mockPrismaService.tenant.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          name: createTenantDto.name,
          type: createTenantDto.type,
          status: 'ACTIVE',
          settings: createTenantDto.settings,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        mockTenant.id,
        'admin-456',
        AuditAction.TENANT_CREATED,
        AuditEntityType.TENANT,
        mockTenant.id,
        null,
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should throw ConflictException if name already exists', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);

      await expect(
        service.createTenant(createTenantDto, 'admin-456')
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.tenant.findFirst).toHaveBeenCalledWith({
        where: { name: createTenantDto.name },
      });
    });

    it('should handle database errors during creation', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockRejectedValue(new Error('Database error'));

      await expect(
        service.createTenant(createTenantDto, 'admin-456')
      ).rejects.toThrow('Database error');
    });

    it('should create tenant with minimal data', async () => {
      const minimalDto = {
        name: 'Minimal Org',
        type: 'HIGH_PROFILE' as const,
      };

      mockPrismaService.tenant.findFirst.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue({
        ...mockTenant,
        ...minimalDto,
        settings: {},
      });

      const result = await service.createTenant(minimalDto, 'admin-456');

      expect(result).toBeDefined();
      expect(mockPrismaService.tenant.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          name: minimalDto.name,
          type: minimalDto.type,
          status: 'ACTIVE',
          settings: {},
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      });
    });
  });

  describe('updateTenant', () => {
    const updateTenantDto = {
      name: 'Updated Organization',
      settings: { theme: 'light' },
    };

    it('should update tenant successfully', async () => {
      const updatedTenant = { ...mockTenant, ...updateTenantDto };
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.findFirst.mockResolvedValue(null); // No name conflict
      mockPrismaService.tenant.update.mockResolvedValue(updatedTenant);

      const result = await service.updateTenant('tenant-123', updateTenantDto, 'admin-456');

      expect(result).toEqual(updatedTenant);
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-123' },
        data: {
          ...updateTenantDto,
          settings: updateTenantDto.settings,
          updatedAt: expect.any(Date),
        },
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        'tenant-123',
        'admin-456',
        AuditAction.TENANT_UPDATED,
        AuditEntityType.TENANT,
        'tenant-123',
        expect.any(Object),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTenant('tenant-123', updateTenantDto, 'admin-456')
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle empty update data', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.update.mockResolvedValue(mockTenant);

      const result = await service.updateTenant('tenant-123', {}, 'admin-456');

      expect(result).toEqual(mockTenant);
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-123' },
        data: {
          updatedAt: expect.any(Date),
        },
        include: { users: true },
      });
    });

    it('should update only provided fields', async () => {
      const partialUpdate = { name: 'Partially Updated' };
      const updatedTenant = { ...mockTenant, ...partialUpdate };
      
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.update.mockResolvedValue(updatedTenant);

      const result = await service.updateTenant('tenant-123', partialUpdate, 'admin-456');

      expect(result).toEqual(updatedTenant);
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-123' },
        data: {
          ...partialUpdate,
          updatedAt: expect.any(Date),
        },
        include: { users: true },
      });
    });
  });

  describe('deleteTenant', () => {
    it('should delete tenant successfully', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.tenant.delete.mockResolvedValue(mockTenant);

      const result = await service.deleteTenant('tenant-123', 'admin-456', 'Account closure request');

      expect(result).toEqual({ id: 'tenant-123' });
      expect(mockPrismaService.tenant.delete).toHaveBeenCalledWith({
        where: { id: 'tenant-123' },
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        'tenant-123',
        'admin-456',
        AuditAction.TENANT_DELETED,
        AuditEntityType.TENANT,
        'tenant-123',
        expect.any(Object),
        null,
        expect.any(Object)
      );
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteTenant('tenant-123', 'admin-456', 'Account closure')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if tenant has active users', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.user.count.mockResolvedValue(5);

      await expect(
        service.deleteTenant('tenant-123', 'admin-456', 'Account closure')
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.user.count).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
      });
    });

    it('should handle database errors during deletion', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.user.count.mockResolvedValue(0);
      mockPrismaService.tenant.delete.mockRejectedValue(new Error('Foreign key constraint'));

      await expect(
        service.deleteTenant('tenant-123', 'admin-456', 'Account closure')
      ).rejects.toThrow('Foreign key constraint');
    });
  });

  describe('getTenantById', () => {
    it('should return tenant by id', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.getTenantById('tenant-123');

      expect(result).toEqual(mockTenant);
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-123' },
        include: { users: true },
      });
    });

    it('should throw NotFoundException if tenant not found', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(
        service.getTenantById('tenant-123')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTenants', () => {
    it('should return all tenants with no filters', async () => {
      const mockTenants = [mockTenant];
      mockPrismaService.tenant.findMany.mockResolvedValue(mockTenants);

      const result = await service.getTenants();

      expect(result).toEqual(mockTenants);
      expect(mockPrismaService.tenant.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return tenant filtered by tenantId', async () => {
      const mockTenants = [mockTenant];
      mockPrismaService.tenant.findMany.mockResolvedValue(mockTenants);

      const result = await service.getTenants('tenant-123');

      expect(result).toEqual(mockTenants);
      expect(mockPrismaService.tenant.findMany).toHaveBeenCalledWith({
        where: { id: 'tenant-123' },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return tenants with status filter', async () => {
      const mockTenants = [mockTenant];
      mockPrismaService.tenant.findMany.mockResolvedValue(mockTenants);

      const result = await service.getTenants(undefined, { status: 'ACTIVE' });

      expect(result).toEqual(mockTenants);
      expect(mockPrismaService.tenant.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('suspendTenant', () => {
    it('should suspend tenant successfully', async () => {
      const suspendedTenant = { ...mockTenant, status: 'SUSPENDED' };
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.update.mockResolvedValue(suspendedTenant);
      mockPrismaService.user.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.suspendTenant('tenant-123', 'admin-456', 'Policy violation');

      expect(result).toEqual(suspendedTenant);
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-123' },
        data: {
          status: 'SUSPENDED',
          updatedAt: expect.any(Date),
        },
      });
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
        data: {
          status: 'SUSPENDED',
          suspendedAt: expect.any(Date),
          suspendedBy: 'admin-456',
          suspensionReason: 'Tenant suspended: Policy violation',
        },
      });
    });

    it('should throw BadRequestException if tenant already suspended', async () => {
      const suspendedTenant = { ...mockTenant, status: 'SUSPENDED' };
      mockPrismaService.tenant.findUnique.mockResolvedValue(suspendedTenant);

      await expect(
        service.suspendTenant('tenant-123', 'admin-456', 'Policy violation')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reactivateTenant', () => {
    it('should reactivate suspended tenant successfully', async () => {
      const suspendedTenant = { ...mockTenant, status: 'SUSPENDED' };
      const reactivatedTenant = { ...mockTenant, status: 'ACTIVE' };
      mockPrismaService.tenant.findUnique.mockResolvedValue(suspendedTenant);
      mockPrismaService.tenant.update.mockResolvedValue(reactivatedTenant);
      mockPrismaService.user.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.reactivateTenant('tenant-123', 'admin-456');

      expect(result).toEqual(reactivatedTenant);
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-123' },
        data: {
          status: 'ACTIVE',
          updatedAt: expect.any(Date),
        },
      });
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: { 
          tenantId: 'tenant-123',
          suspensionReason: { contains: 'Tenant suspended:' },
        },
        data: {
          status: 'ACTIVE',
          suspendedAt: null,
          suspendedBy: null,
          suspensionReason: null,
        },
      });
    });

    it('should throw BadRequestException if tenant is not suspended', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(
        service.reactivateTenant('tenant-123', 'admin-456')
      ).rejects.toThrow(BadRequestException);
    });
  });

  // toggleTenantStatus method doesn't exist in service - removing tests

  // validateTenantExists method doesn't exist in service - removing tests

  describe('getTenantStats', () => {
    it('should return tenant statistics', async () => {
      // Mock getTenantById to not throw
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      
      // Mock user statistics
      mockPrismaService.user.groupBy.mockResolvedValue([
        { status: 'ACTIVE', role: 'DIRECTOR', _count: 2 },
        { status: 'ACTIVE', role: 'EMPLOYEE', _count: 3 }
      ]);
      mockPrismaService.user.count
        .mockResolvedValueOnce(5) // totalUsers
        .mockResolvedValueOnce(5) // activeUsers  
        .mockResolvedValueOnce(0); // suspendedUsers
      
      // Mock content counts
      mockPrismaService.tweet.count.mockResolvedValue(10);
      mockPrismaService.news.count.mockResolvedValue(5);
      mockPrismaService.alert.count
        .mockResolvedValueOnce(3) // total alerts
        .mockResolvedValueOnce(1); // unread alerts
      mockPrismaService.alert.groupBy.mockResolvedValue([
        { severity: 'HIGH', _count: 2 },
        { severity: 'MEDIUM', _count: 1 }
      ]);

      const result = await service.getTenantStats('tenant-123');

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('alerts');
      expect(result.users.total).toBe(5);
      expect(result.content.tweets).toBe(10);
      expect(result.content.news).toBe(5);
    });

    it('should handle zero counts', async () => {
      // Mock getTenantById to not throw
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      
      // Mock empty statistics
      mockPrismaService.user.groupBy.mockResolvedValue([]);
      mockPrismaService.user.count
        .mockResolvedValueOnce(0) // totalUsers
        .mockResolvedValueOnce(0) // activeUsers  
        .mockResolvedValueOnce(0); // suspendedUsers
      
      // Mock content counts
      mockPrismaService.tweet.count.mockResolvedValue(0);
      mockPrismaService.news.count.mockResolvedValue(0);
      mockPrismaService.alert.count
        .mockResolvedValueOnce(0) // total alerts
        .mockResolvedValueOnce(0); // unread alerts
      mockPrismaService.alert.groupBy.mockResolvedValue([]);

      const result = await service.getTenantStats('tenant-123');

      expect(result.users.total).toBe(0);
      expect(result.content.tweets).toBe(0);
      expect(result.content.news).toBe(0);
      expect(result.alerts.total).toBe(0);
    });

    it('should handle all active tenants', async () => {
      // Mock getTenantById to not throw
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      
      // Mock all active users
      mockPrismaService.user.groupBy.mockResolvedValue([
        { status: 'ACTIVE', role: 'DIRECTOR', _count: 5 }
      ]);
      mockPrismaService.user.count
        .mockResolvedValueOnce(5) // totalUsers
        .mockResolvedValueOnce(5) // activeUsers  
        .mockResolvedValueOnce(0); // suspendedUsers
      
      // Mock content counts
      mockPrismaService.tweet.count.mockResolvedValue(20);
      mockPrismaService.news.count.mockResolvedValue(10);
      mockPrismaService.alert.count
        .mockResolvedValueOnce(5) // total alerts
        .mockResolvedValueOnce(2); // unread alerts
      mockPrismaService.alert.groupBy.mockResolvedValue([
        { severity: 'HIGH', _count: 5 }
      ]);

      const result = await service.getTenantStats('tenant-123');

      expect(result.users.total).toBe(5);
      expect(result.users.active).toBe(5);
      expect(result.users.suspended).toBe(0);
    });
  });

  describe('private methods', () => {
    // generateTenantId method doesn't exist - removing tests
    /*
    describe('generateTenantId', () => {
      it('should generate unique tenant IDs', () => {
        const id1 = (service as any).generateTenantId();
        const id2 = (service as any).generateTenantId();
        const id3 = (service as any).generateTenantId();

        expect(typeof id1).toBe('string');
        expect(typeof id2).toBe('string');
        expect(typeof id3).toBe('string');
        expect(id1).not.toBe(id2);
        expect(id2).not.toBe(id3);
        expect(id1).not.toBe(id3);
        expect(id1.startsWith('tenant_')).toBe(true);
        expect(id2.startsWith('tenant_')).toBe(true);
        expect(id3.startsWith('tenant_')).toBe(true);
      });

      it('should generate IDs with consistent format', () => {
        const id = (service as any).generateTenantId();
        
        expect(id).toMatch(/^tenant_[a-z0-9]{12}$/);
      });
    });
    */
  });
});