import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

interface ICurrentUser {
  id: string;
  email: string;
  username: string;
  role: string;
  tenantId: string;
}

describe('TenantsController', () => {
  let controller: TenantsController;
  let tenantsService: TenantsService;

  const mockTenantsService = {
    createTenant: jest.fn(),
    getTenants: jest.fn(),
    getTenantById: jest.fn(),
    updateTenant: jest.fn(),
    suspendTenant: jest.fn(),
    reactivateTenant: jest.fn(),
    deleteTenant: jest.fn(),
    getTenantStats: jest.fn(),
  };

  const mockCurrentUser: ICurrentUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    tenantId: 'tenant-456',
    role: 'DIRECTOR_COMUNICACION',
  };

  const mockSuperAdminUser: ICurrentUser = {
    id: 'admin-123',
    email: 'admin@example.com',
    username: 'admin',
    tenantId: 'tenant-admin',
    role: 'SUPER_ADMIN',
  };

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Tenant',
    type: 'GOVERNMENT_STATE',
    status: 'ACTIVE',
    settings: { theme: 'light' },
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    _count: {
      users: 5,
      tweets: 100,
      news: 50,
      alerts: 10,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        {
          provide: TenantsService,
          useValue: mockTenantsService,
        },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
    tenantsService = module.get<TenantsService>(TenantsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTenant', () => {
    const createTenantDto: CreateTenantDto = {
      name: 'New Tenant',
      type: 'GOVERNMENT_STATE',
      settings: { theme: 'light' },
    };

    it('should create tenant successfully', async () => {
      mockTenantsService.createTenant.mockResolvedValue(mockTenant);

      const result = await controller.createTenant(createTenantDto, mockSuperAdminUser);

      expect(tenantsService.createTenant).toHaveBeenCalledWith(
        createTenantDto,
        mockSuperAdminUser.id,
      );
      expect(result).toEqual({
        message: 'Tenant created successfully',
        data: {
          id: mockTenant.id,
          name: mockTenant.name,
          type: mockTenant.type,
          status: mockTenant.status,
          createdAt: mockTenant.createdAt.toISOString(),
        },
      });
    });

    it('should handle service errors', async () => {
      mockTenantsService.createTenant.mockRejectedValue(new BadRequestException('Tenant name already exists'));

      await expect(
        controller.createTenant(createTenantDto, mockSuperAdminUser)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTenants', () => {
    const mockTenants = [mockTenant];

    it('should return all tenants for super admin', async () => {
      mockTenantsService.getTenants.mockResolvedValue(mockTenants);

      const result = await controller.getTenants(mockSuperAdminUser);

      expect(tenantsService.getTenants).toHaveBeenCalledWith(undefined, {});
      expect(result).toEqual({
        message: 'Tenants retrieved successfully',
        data: mockTenants.map(tenant => ({
          id: tenant.id,
          name: tenant.name,
          type: tenant.type,
          status: tenant.status,
          createdAt: tenant.createdAt.toISOString(),
          _count: {
            users: tenant._count?.users || 0,
          },
        })),
        total: mockTenants.length,
      });
    });

    it('should return filtered tenant for non-super admin', async () => {
      mockTenantsService.getTenants.mockResolvedValue(mockTenants);

      const result = await controller.getTenants(mockCurrentUser);

      expect(tenantsService.getTenants).toHaveBeenCalledWith(mockCurrentUser.tenantId, {});
      expect(result).toEqual({
        message: 'Tenants retrieved successfully',
        data: mockTenants.map(tenant => ({
          id: tenant.id,
          name: tenant.name,
          type: tenant.type,
          status: tenant.status,
          createdAt: tenant.createdAt.toISOString(),
          _count: {
            users: tenant._count?.users || 0,
          },
        })),
        total: mockTenants.length,
      });
    });

    it('should apply status filter', async () => {
      mockTenantsService.getTenants.mockResolvedValue(mockTenants);

      await controller.getTenants(mockSuperAdminUser, 'ACTIVE');

      expect(tenantsService.getTenants).toHaveBeenCalledWith(undefined, { status: 'ACTIVE' });
    });

    it('should apply type filter', async () => {
      mockTenantsService.getTenants.mockResolvedValue(mockTenants);

      await controller.getTenants(mockSuperAdminUser, undefined, 'GOVERNMENT_STATE');

      expect(tenantsService.getTenants).toHaveBeenCalledWith(undefined, { type: 'GOVERNMENT_STATE' });
    });

    it('should apply both status and type filters', async () => {
      mockTenantsService.getTenants.mockResolvedValue(mockTenants);

      await controller.getTenants(mockSuperAdminUser, 'ACTIVE', 'GOVERNMENT_STATE');

      expect(tenantsService.getTenants).toHaveBeenCalledWith(undefined, { 
        status: 'ACTIVE', 
        type: 'GOVERNMENT_STATE' 
      });
    });

    it('should handle empty tenant list', async () => {
      mockTenantsService.getTenants.mockResolvedValue([]);

      const result = await controller.getTenants(mockSuperAdminUser);

      expect(result).toEqual({
        message: 'Tenants retrieved successfully',
        data: [],
        total: 0,
      });
    });
  });

  describe('getTenantById', () => {
    it('should return tenant by id for super admin', async () => {
      mockTenantsService.getTenantById.mockResolvedValue(mockTenant);

      const result = await controller.getTenantById('tenant-123', mockSuperAdminUser);

      expect(tenantsService.getTenantById).toHaveBeenCalledWith('tenant-123');
      expect(result).toEqual({
        message: 'Tenant retrieved successfully',
        data: {
          id: mockTenant.id,
          name: mockTenant.name,
          type: mockTenant.type,
          status: mockTenant.status,
          settings: mockTenant.settings,
          createdAt: mockTenant.createdAt.toISOString(),
          updatedAt: mockTenant.updatedAt.toISOString(),
          _count: mockTenant._count,
        },
      });
    });

    it('should return tenant by id for owner', async () => {
      mockTenantsService.getTenantById.mockResolvedValue(mockTenant);

      const result = await controller.getTenantById('tenant-456', mockCurrentUser);

      expect(tenantsService.getTenantById).toHaveBeenCalledWith('tenant-456');
      expect(result).toBeDefined();
    });

    it('should deny access to non-owned tenant for non-super admin', async () => {
      await expect(
        controller.getTenantById('other-tenant', mockCurrentUser)
      ).rejects.toThrow('Access denied to tenant');
    });

    it('should handle tenant not found', async () => {
      mockTenantsService.getTenantById.mockRejectedValue(new NotFoundException('Tenant not found'));

      await expect(
        controller.getTenantById('nonexistent', mockSuperAdminUser)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTenant', () => {
    const updateTenantDto: UpdateTenantDto = {
      name: 'Updated Tenant',
      settings: { theme: 'dark' },
    };

    it('should update tenant successfully for super admin', async () => {
      const updatedTenant = { ...mockTenant, ...updateTenantDto };
      mockTenantsService.updateTenant.mockResolvedValue(updatedTenant);

      const result = await controller.updateTenant('tenant-123', updateTenantDto, mockSuperAdminUser);

      expect(tenantsService.updateTenant).toHaveBeenCalledWith(
        'tenant-123',
        updateTenantDto,
        mockSuperAdminUser.id
      );
      expect(result).toEqual({
        message: 'Tenant updated successfully',
        data: {
          id: updatedTenant.id,
          name: updatedTenant.name,
          type: updatedTenant.type,
          status: updatedTenant.status,
          updatedAt: updatedTenant.updatedAt.toISOString(),
        },
      });
    });

    it('should update own tenant for non-super admin', async () => {
      const updatedTenant = { ...mockTenant, ...updateTenantDto };
      mockTenantsService.updateTenant.mockResolvedValue(updatedTenant);

      const result = await controller.updateTenant('tenant-456', updateTenantDto, mockCurrentUser);

      expect(tenantsService.updateTenant).toHaveBeenCalledWith(
        'tenant-456',
        updateTenantDto,
        mockCurrentUser.id
      );
      expect(result).toBeDefined();
    });

    it('should deny access to update non-owned tenant for non-super admin', async () => {
      await expect(
        controller.updateTenant('other-tenant', updateTenantDto, mockCurrentUser)
      ).rejects.toThrow('Access denied to update tenant');
    });

    it('should handle update errors', async () => {
      mockTenantsService.updateTenant.mockRejectedValue(new BadRequestException('Update failed'));

      await expect(
        controller.updateTenant('tenant-123', updateTenantDto, mockSuperAdminUser)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('suspendTenant', () => {
    const suspendData = { reason: 'Policy violation' };

    it('should suspend tenant successfully', async () => {
      const suspendedTenant = { ...mockTenant, status: 'SUSPENDED' };
      mockTenantsService.suspendTenant.mockResolvedValue(suspendedTenant);

      const result = await controller.suspendTenant('tenant-123', suspendData, mockSuperAdminUser);

      expect(tenantsService.suspendTenant).toHaveBeenCalledWith(
        'tenant-123',
        mockSuperAdminUser.id,
        suspendData.reason
      );
      expect(result).toEqual({
        message: 'Tenant suspended successfully',
        data: {
          id: suspendedTenant.id,
          status: suspendedTenant.status,
          suspendedAt: expect.any(String),
          reason: suspendData.reason,
        },
      });
    });

    it('should handle suspension errors', async () => {
      mockTenantsService.suspendTenant.mockRejectedValue(new BadRequestException('Already suspended'));

      await expect(
        controller.suspendTenant('tenant-123', suspendData, mockSuperAdminUser)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('reactivateTenant', () => {
    it('should reactivate tenant successfully', async () => {
      const reactivatedTenant = { ...mockTenant, status: 'ACTIVE' };
      mockTenantsService.reactivateTenant.mockResolvedValue(reactivatedTenant);

      const result = await controller.reactivateTenant('tenant-123', mockSuperAdminUser);

      expect(tenantsService.reactivateTenant).toHaveBeenCalledWith(
        'tenant-123',
        mockSuperAdminUser.id
      );
      expect(result).toEqual({
        message: 'Tenant reactivated successfully',
        data: {
          id: reactivatedTenant.id,
          status: reactivatedTenant.status,
          reactivatedAt: expect.any(String),
        },
      });
    });

    it('should handle reactivation errors', async () => {
      mockTenantsService.reactivateTenant.mockRejectedValue(new BadRequestException('Not suspended'));

      await expect(
        controller.reactivateTenant('tenant-123', mockSuperAdminUser)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteTenant', () => {
    const deleteData = { confirmation: 'DELETE_TENANT_PERMANENTLY', reason: 'Account closure' };

    it('should delete tenant successfully', async () => {
      mockTenantsService.deleteTenant.mockResolvedValue({ id: 'tenant-123' });

      const result = await controller.deleteTenant('tenant-123', deleteData, mockSuperAdminUser);

      expect(tenantsService.deleteTenant).toHaveBeenCalledWith(
        'tenant-123',
        mockSuperAdminUser.id,
        deleteData.reason
      );
      expect(result).toEqual({
        message: 'Tenant deleted permanently',
        data: {
          id: 'tenant-123',
          deletedAt: expect.any(String),
          reason: deleteData.reason,
        },
      });
    });

    it('should handle deletion errors', async () => {
      mockTenantsService.deleteTenant.mockRejectedValue(new BadRequestException('Cannot delete tenant with active users'));

      await expect(
        controller.deleteTenant('tenant-123', deleteData, mockSuperAdminUser)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for invalid confirmation', async () => {
      const invalidDeleteData = { confirmation: 'INVALID', reason: 'Account closure' };

      await expect(
        controller.deleteTenant('tenant-123', invalidDeleteData, mockSuperAdminUser)
      ).rejects.toThrow('Invalid confirmation. Must send "DELETE_TENANT_PERMANENTLY"');
    });
  });

  describe('getTenantStats', () => {
    const mockStats = {
      users: {
        total: 10,
        active: 8,
        suspended: 2,
        byRole: { DIRECTOR_COMUNICACION: 2, ANALISTA: 6 },
      },
      content: {
        tweets: 100,
        news: 50,
        aiAnalysis: 25,
      },
      alerts: {
        total: 10,
        unread: 3,
        bySeverity: { HIGH: 2, MEDIUM: 5, LOW: 3 },
      },
    };

    it('should return tenant stats for super admin', async () => {
      mockTenantsService.getTenantStats.mockResolvedValue(mockStats);

      const result = await controller.getTenantStats('tenant-123', mockSuperAdminUser);

      expect(tenantsService.getTenantStats).toHaveBeenCalledWith('tenant-123');
      expect(result).toEqual({
        message: 'Tenant statistics retrieved successfully',
        data: mockStats,
      });
    });

    it('should return own tenant stats for non-super admin', async () => {
      mockTenantsService.getTenantStats.mockResolvedValue(mockStats);

      const result = await controller.getTenantStats('tenant-456', mockCurrentUser);

      expect(tenantsService.getTenantStats).toHaveBeenCalledWith('tenant-456');
      expect(result).toBeDefined();
    });

    it('should deny access to non-owned tenant stats for non-super admin', async () => {
      await expect(
        controller.getTenantStats('other-tenant', mockCurrentUser)
      ).rejects.toThrow('Access denied to tenant');
    });

    it('should handle stats retrieval errors', async () => {
      mockTenantsService.getTenantStats.mockRejectedValue(new NotFoundException('Tenant not found'));

      await expect(
        controller.getTenantStats('nonexistent', mockSuperAdminUser)
      ).rejects.toThrow(NotFoundException);
    });
  });
});