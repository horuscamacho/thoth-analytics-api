import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditEntityType } from '@prisma/client';

describe('TenantsService', () => {
  let service: TenantsService;
  let auditService: AuditService;

  const mockPrismaService = {
    tenant: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      updateMany: jest.fn(),
      count: jest.fn(),
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

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Tenant',
    type: 'ENTERPRISE',
    status: 'ACTIVE',
    settings: { theme: 'dark' },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    _count: {
      users: 5,
      tweets: 100,
      news: 50,
      alerts: 10,
    },
  };

  const mockCreateTenantDto = {
    name: 'New Tenant',
    type: 'GOVERNMENT_STATE' as const,
    settings: { theme: 'light' },
  };

  const mockUpdateTenantDto = {
    name: 'Updated Tenant',
    settings: { theme: 'dark' },
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTenant', () => {
    it('should create a new tenant successfully', async () => {
      const createdBy = 'admin-123';
      
      mockPrismaService.tenant.findFirst.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue({
        ...mockTenant,
        name: mockCreateTenantDto.name,
        type: mockCreateTenantDto.type,
        settings: mockCreateTenantDto.settings,
      });

      const result = await service.createTenant(mockCreateTenantDto, createdBy);

      expect(mockPrismaService.tenant.findFirst).toHaveBeenCalledWith({
        where: { name: mockCreateTenantDto.name },
      });
      expect(mockPrismaService.tenant.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: mockCreateTenantDto.name,
          type: mockCreateTenantDto.type,
          status: 'ACTIVE',
          settings: mockCreateTenantDto.settings,
          id: expect.any(String),
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        expect.any(String),
        createdBy,
        AuditAction.TENANT_CREATED,
        AuditEntityType.TENANT,
        expect.any(String),
        null,
        expect.objectContaining({
          name: mockCreateTenantDto.name,
          type: mockCreateTenantDto.type,
          status: 'ACTIVE',
        }),
        expect.objectContaining({
          tenantName: mockCreateTenantDto.name,
          tenantType: mockCreateTenantDto.type,
        })
      );
      expect(result.name).toBe(mockCreateTenantDto.name);
    });

    it('should throw ConflictException if tenant name already exists', async () => {
      const createdBy = 'admin-123';
      
      mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);

      await expect(service.createTenant(mockCreateTenantDto, createdBy))
        .rejects.toThrow(ConflictException);
      await expect(service.createTenant(mockCreateTenantDto, createdBy))
        .rejects.toThrow('Tenant with this name already exists');

      expect(mockPrismaService.tenant.create).not.toHaveBeenCalled();
      expect(auditService.logAction).not.toHaveBeenCalled();
    });
  });

  describe('getTenants', () => {
    it('should return all tenants when no tenantId provided', async () => {
      const mockTenants = [mockTenant];
      mockPrismaService.tenant.findMany.mockResolvedValue(mockTenants);

      const result = await service.getTenants();

      expect(mockPrismaService.tenant.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockTenants);
    });

    it('should filter by tenantId when provided', async () => {
      const tenantId = 'tenant-123';
      const mockTenants = [mockTenant];
      mockPrismaService.tenant.findMany.mockResolvedValue(mockTenants);

      const result = await service.getTenants(tenantId);

      expect(mockPrismaService.tenant.findMany).toHaveBeenCalledWith({
        where: { id: tenantId },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockTenants);
    });

    it('should apply status and type filters', async () => {
      const filters = { status: 'ACTIVE', type: 'ENTERPRISE' };
      mockPrismaService.tenant.findMany.mockResolvedValue([mockTenant]);

      const result = await service.getTenants(undefined, filters);

      expect(mockPrismaService.tenant.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE', type: 'ENTERPRISE' },
        include: {
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual([mockTenant]);
    });
  });

  describe('getTenantById', () => {
    it('should return tenant by id', async () => {
      const tenantId = 'tenant-123';
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.getTenantById(tenantId);

      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: tenantId },
        include: {
          _count: {
            select: {
              users: true,
              tweets: true,
              news: true,
              alerts: true,
            },
          },
        },
      });
      expect(result).toEqual(mockTenant);
    });

    it('should throw NotFoundException if tenant not found', async () => {
      const tenantId = 'non-existent';
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.getTenantById(tenantId))
        .rejects.toThrow(NotFoundException);
      await expect(service.getTenantById(tenantId))
        .rejects.toThrow('Tenant not found');
    });
  });

  describe('updateTenant', () => {
    it('should update tenant successfully', async () => {
      const tenantId = 'tenant-123';
      const updatedBy = 'admin-123';
      const updatedTenant = { ...mockTenant, ...mockUpdateTenantDto };

      jest.spyOn(service, 'getTenantById').mockResolvedValue(mockTenant);
      mockPrismaService.tenant.findFirst.mockResolvedValue(null);
      mockPrismaService.tenant.update.mockResolvedValue(updatedTenant);

      const result = await service.updateTenant(tenantId, mockUpdateTenantDto, updatedBy);

      expect(service.getTenantById).toHaveBeenCalledWith(tenantId);
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: {
          ...mockUpdateTenantDto,
          settings: mockUpdateTenantDto.settings,
          updatedAt: expect.any(Date),
        },
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        tenantId,
        updatedBy,
        AuditAction.TENANT_UPDATED,
        AuditEntityType.TENANT,
        tenantId,
        expect.objectContaining({
          name: mockTenant.name,
          type: mockTenant.type,
          status: mockTenant.status,
        }),
        expect.objectContaining({
          name: updatedTenant.name,
          type: updatedTenant.type,
          status: updatedTenant.status,
        }),
        expect.any(Object)
      );
      expect(result).toEqual(updatedTenant);
    });

    it('should throw ConflictException if name conflict exists', async () => {
      const tenantId = 'tenant-123';
      const updatedBy = 'admin-123';
      const conflictTenant = { ...mockTenant, id: 'other-tenant' };

      jest.spyOn(service, 'getTenantById').mockResolvedValue(mockTenant);
      mockPrismaService.tenant.findFirst.mockResolvedValue(conflictTenant);

      await expect(service.updateTenant(tenantId, mockUpdateTenantDto, updatedBy))
        .rejects.toThrow(ConflictException);
      await expect(service.updateTenant(tenantId, mockUpdateTenantDto, updatedBy))
        .rejects.toThrow('Tenant with this name already exists');

      expect(mockPrismaService.tenant.update).not.toHaveBeenCalled();
      expect(auditService.logAction).not.toHaveBeenCalled();
    });

    it('should not check for name conflict if name unchanged', async () => {
      const tenantId = 'tenant-123';
      const updatedBy = 'admin-123';
      const updateDto = { settings: { theme: 'blue' } };
      const updatedTenant = { ...mockTenant, settings: updateDto.settings };

      jest.spyOn(service, 'getTenantById').mockResolvedValue(mockTenant);
      mockPrismaService.tenant.update.mockResolvedValue(updatedTenant);

      await service.updateTenant(tenantId, updateDto, updatedBy);

      expect(mockPrismaService.tenant.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.tenant.update).toHaveBeenCalled();
    });
  });

  describe('suspendTenant', () => {
    it('should suspend tenant and all its users', async () => {
      const tenantId = 'tenant-123';
      const suspendedBy = 'admin-123';
      const reason = 'Policy violation';
      const suspendedTenant = { ...mockTenant, status: 'SUSPENDED' };

      jest.spyOn(service, 'getTenantById').mockResolvedValue(mockTenant);
      mockPrismaService.tenant.update.mockResolvedValue(suspendedTenant);

      const result = await service.suspendTenant(tenantId, suspendedBy, reason);

      expect(service.getTenantById).toHaveBeenCalledWith(tenantId);
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: {
          status: 'SUSPENDED',
          updatedAt: expect.any(Date),
        },
      });
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: { tenantId },
        data: {
          status: 'SUSPENDED',
          suspendedAt: expect.any(Date),
          suspendedBy,
          suspensionReason: `Tenant suspended: ${reason}`,
        },
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        tenantId,
        suspendedBy,
        AuditAction.TENANT_SUSPENDED,
        AuditEntityType.TENANT,
        tenantId,
        { status: mockTenant.status },
        { status: 'SUSPENDED' },
        expect.objectContaining({
          reason,
          previousStatus: mockTenant.status,
        })
      );
      expect(result).toEqual(suspendedTenant);
    });

    it('should throw BadRequestException if tenant already suspended', async () => {
      const tenantId = 'tenant-123';
      const suspendedBy = 'admin-123';
      const reason = 'Policy violation';
      const suspendedTenant = { ...mockTenant, status: 'SUSPENDED' };

      jest.spyOn(service, 'getTenantById').mockResolvedValue(suspendedTenant);

      await expect(service.suspendTenant(tenantId, suspendedBy, reason))
        .rejects.toThrow(BadRequestException);
      await expect(service.suspendTenant(tenantId, suspendedBy, reason))
        .rejects.toThrow('Tenant is already suspended');

      expect(mockPrismaService.tenant.update).not.toHaveBeenCalled();
    });
  });

  describe('reactivateTenant', () => {
    it('should reactivate suspended tenant and its users', async () => {
      const tenantId = 'tenant-123';
      const reactivatedBy = 'admin-123';
      const suspendedTenant = { ...mockTenant, status: 'SUSPENDED' };
      const reactivatedTenant = { ...mockTenant, status: 'ACTIVE' };

      jest.spyOn(service, 'getTenantById').mockResolvedValue(suspendedTenant);
      mockPrismaService.tenant.update.mockResolvedValue(reactivatedTenant);

      const result = await service.reactivateTenant(tenantId, reactivatedBy);

      expect(service.getTenantById).toHaveBeenCalledWith(tenantId);
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: {
          status: 'ACTIVE',
          updatedAt: expect.any(Date),
        },
      });
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: {
          tenantId,
          suspensionReason: { contains: 'Tenant suspended:' },
        },
        data: {
          status: 'ACTIVE',
          suspendedAt: null,
          suspendedBy: null,
          suspensionReason: null,
        },
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        tenantId,
        reactivatedBy,
        AuditAction.TENANT_REACTIVATED,
        AuditEntityType.TENANT,
        tenantId,
        { status: 'SUSPENDED' },
        { status: 'ACTIVE' },
        expect.objectContaining({
          previousStatus: 'SUSPENDED',
        })
      );
      expect(result).toEqual(reactivatedTenant);
    });

    it('should throw BadRequestException if tenant not suspended', async () => {
      const tenantId = 'tenant-123';
      const reactivatedBy = 'admin-123';

      jest.spyOn(service, 'getTenantById').mockResolvedValue(mockTenant);

      await expect(service.reactivateTenant(tenantId, reactivatedBy))
        .rejects.toThrow(BadRequestException);
      await expect(service.reactivateTenant(tenantId, reactivatedBy))
        .rejects.toThrow('Tenant is not suspended');

      expect(mockPrismaService.tenant.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteTenant', () => {
    it('should delete tenant after logging action', async () => {
      const tenantId = 'tenant-123';
      const deletedBy = 'admin-123';
      const reason = 'Requested by user';

      jest.spyOn(service, 'getTenantById').mockResolvedValue(mockTenant);

      const result = await service.deleteTenant(tenantId, deletedBy, reason);

      expect(service.getTenantById).toHaveBeenCalledWith(tenantId);
      expect(auditService.logAction).toHaveBeenCalledWith(
        tenantId,
        deletedBy,
        AuditAction.TENANT_DELETED,
        AuditEntityType.TENANT,
        tenantId,
        expect.objectContaining({
          id: mockTenant.id,
          name: mockTenant.name,
          type: mockTenant.type,
          status: mockTenant.status,
        }),
        null,
        expect.objectContaining({
          reason,
          deletedTenantData: expect.objectContaining({
            name: mockTenant.name,
            type: mockTenant.type,
            status: mockTenant.status,
            userCount: mockTenant._count?.users || 0,
          }),
        })
      );
      expect(mockPrismaService.tenant.delete).toHaveBeenCalledWith({
        where: { id: tenantId },
      });
      expect(result).toEqual({ id: tenantId });
    });
  });

  describe('getTenantStats', () => {
    it('should return comprehensive tenant statistics', async () => {
      const tenantId = 'tenant-123';
      const mockUserStats = [
        { status: 'ACTIVE', role: 'ANALISTA', _count: 3 },
        { status: 'ACTIVE', role: 'LIDER', _count: 2 },
        { status: 'SUSPENDED', role: 'ANALISTA', _count: 1 },
      ];
      const mockAlertStats = [
        { status: 'UNREAD', severity: 'HIGH', _count: 5 },
        { status: 'READ', severity: 'MEDIUM', _count: 10 },
      ];

      jest.spyOn(service, 'getTenantById').mockResolvedValue(mockTenant);
      mockPrismaService.user.groupBy.mockResolvedValue(mockUserStats);
      mockPrismaService.user.count
        .mockResolvedValueOnce(6) // total users
        .mockResolvedValueOnce(5) // active users
        .mockResolvedValueOnce(1); // suspended users
      mockPrismaService.tweet.count.mockResolvedValue(100);
      mockPrismaService.news.count.mockResolvedValue(50);
      mockPrismaService.aiAnalysis.count.mockResolvedValue(25);
      mockPrismaService.alert.groupBy.mockResolvedValue(mockAlertStats);
      mockPrismaService.alert.count
        .mockResolvedValueOnce(15) // total alerts
        .mockResolvedValueOnce(5); // unread alerts

      const result = await service.getTenantStats(tenantId);

      expect(result).toEqual({
        users: {
          total: 6,
          active: 5,
          suspended: 1,
          byRole: {
            ANALISTA: 4,
            LIDER: 2,
          },
        },
        content: {
          tweets: 100,
          news: 50,
          aiAnalysis: 25,
        },
        alerts: {
          total: 15,
          unread: 5,
          bySeverity: {
            HIGH: 5,
            MEDIUM: 10,
          },
        },
      });
    });
  });
});