import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import * as crypto from 'crypto';

interface ITenant {
  id: string;
  name: string;
  type: string;
  status: string;
  settings?: any;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    users: number;
    tweets?: number;
    news?: number;
    alerts?: number;
  };
}

interface ITenantFilters {
  status?: string;
  type?: string;
}

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createTenant(createTenantDto: CreateTenantDto, createdBy: string): Promise<ITenant> {
    // Check if tenant with same name already exists
    const existingTenant = await this.prisma.tenant.findFirst({
      where: {
        name: createTenantDto.name,
      },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant with this name already exists');
    }

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        id: crypto.randomUUID(),
        name: createTenantDto.name,
        type: createTenantDto.type,
        status: 'ACTIVE',
        settings: createTenantDto.settings as any || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Log tenant creation for audit
    await this.auditService.logAction(
      tenant.id, // Use tenant.id as tenantId for tenant operations
      createdBy,
      AuditAction.TENANT_CREATED,
      AuditEntityType.TENANT,
      tenant.id,
      null,
      {
        id: tenant.id,
        name: tenant.name,
        type: tenant.type,
        status: tenant.status,
      },
      {
        tenantName: createTenantDto.name,
        tenantType: createTenantDto.type,
      }
    );

    return tenant;
  }

  async getTenants(tenantId?: string, filters: ITenantFilters = {}): Promise<ITenant[]> {
    const where: any = {};

    // If tenantId is provided, filter by specific tenant (for non-super admins)
    if (tenantId) {
      where.id = tenantId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    const tenants = await this.prisma.tenant.findMany({
      where,
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

    return tenants;
  }

  async getTenantById(id: string): Promise<ITenant> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
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

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async updateTenant(id: string, updateTenantDto: Partial<UpdateTenantDto>, updatedBy: string): Promise<ITenant> {
    // Check if tenant exists
    const existingTenant = await this.getTenantById(id);

    // Check if name conflict (if name is being updated)
    if (updateTenantDto.name && updateTenantDto.name !== existingTenant.name) {
      const nameConflict = await this.prisma.tenant.findFirst({
        where: {
          name: updateTenantDto.name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new ConflictException('Tenant with this name already exists');
      }
    }

    // Update tenant
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...updateTenantDto,
        settings: updateTenantDto.settings as any,
        updatedAt: new Date(),
      },
    });

    // Log tenant update for audit
    await this.auditService.logAction(
      id,
      updatedBy,
      AuditAction.TENANT_UPDATED,
      AuditEntityType.TENANT,
      id,
      {
        name: existingTenant.name,
        type: existingTenant.type,
        status: existingTenant.status,
      },
      {
        name: tenant.name,
        type: tenant.type,
        status: tenant.status,
      },
      {
        updatedFields: Object.keys(updateTenantDto),
        previousData: {
          name: existingTenant.name,
          type: existingTenant.type,
          status: existingTenant.status,
        },
      }
    );

    return tenant;
  }

  async suspendTenant(id: string, suspendedBy: string, reason: string): Promise<ITenant> {
    // Check if tenant exists
    const existingTenant = await this.getTenantById(id);

    if (existingTenant.status === 'SUSPENDED') {
      throw new BadRequestException('Tenant is already suspended');
    }

    // Update tenant status
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        status: 'SUSPENDED',
        updatedAt: new Date(),
      },
    });

    // Also suspend all users in the tenant
    await this.prisma.user.updateMany({
      where: { tenantId: id },
      data: {
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspendedBy,
        suspensionReason: `Tenant suspended: ${reason}`,
      },
    });

    // Log tenant suspension for audit
    await this.auditService.logAction(
      id,
      suspendedBy,
      AuditAction.TENANT_SUSPENDED,
      AuditEntityType.TENANT,
      id,
      { status: existingTenant.status },
      { status: 'SUSPENDED' },
      {
        reason,
        previousStatus: existingTenant.status,
      }
    );

    return tenant;
  }

  async reactivateTenant(id: string, reactivatedBy: string): Promise<ITenant> {
    // Check if tenant exists
    const existingTenant = await this.getTenantById(id);

    if (existingTenant.status !== 'SUSPENDED') {
      throw new BadRequestException('Tenant is not suspended');
    }

    // Update tenant status
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    // Reactivate all users that were suspended due to tenant suspension
    await this.prisma.user.updateMany({
      where: { 
        tenantId: id,
        suspensionReason: { contains: 'Tenant suspended:' },
      },
      data: {
        status: 'ACTIVE',
        suspendedAt: null,
        suspendedBy: null,
        suspensionReason: null,
      },
    });

    // Log tenant reactivation for audit
    await this.auditService.logAction(
      id,
      reactivatedBy,
      AuditAction.TENANT_REACTIVATED,
      AuditEntityType.TENANT,
      id,
      { status: existingTenant.status },
      { status: 'ACTIVE' },
      {
        previousStatus: existingTenant.status,
      }
    );

    return tenant;
  }

  async deleteTenant(id: string, deletedBy: string, reason: string): Promise<{ id: string }> {
    // Check if tenant exists
    const existingTenant = await this.getTenantById(id);

    // Log deletion before actual deletion for audit
    await this.auditService.logAction(
      id,
      deletedBy,
      AuditAction.TENANT_DELETED,
      AuditEntityType.TENANT,
      id,
      {
        id: existingTenant.id,
        name: existingTenant.name,
        type: existingTenant.type,
        status: existingTenant.status,
      },
      null,
      {
        reason,
        deletedTenantData: {
          name: existingTenant.name,
          type: existingTenant.type,
          status: existingTenant.status,
          userCount: existingTenant._count?.users || 0,
        },
      }
    );

    // Delete tenant (cascade deletion will handle related data)
    await this.prisma.tenant.delete({
      where: { id },
    });

    return { id };
  }

  async getTenantStats(id: string): Promise<{
    users: {
      total: number;
      active: number;
      suspended: number;
      byRole: Record<string, number>;
    };
    content: {
      tweets: number;
      news: number;
      aiAnalysis: number;
    };
    alerts: {
      total: number;
      unread: number;
      bySeverity: Record<string, number>;
    };
  }> {
    // Check if tenant exists
    await this.getTenantById(id);

    // Get user statistics
    const userStats = await this.prisma.user.groupBy({
      by: ['status', 'role'],
      where: { tenantId: id },
      _count: true,
    });

    const totalUsers = await this.prisma.user.count({
      where: { tenantId: id },
    });

    const activeUsers = await this.prisma.user.count({
      where: { tenantId: id, status: 'ACTIVE' },
    });

    const suspendedUsers = await this.prisma.user.count({
      where: { tenantId: id, status: 'SUSPENDED' },
    });

    // Process user stats by role
    const usersByRole: Record<string, number> = {};
    userStats.forEach((stat) => {
      usersByRole[stat.role] = (usersByRole[stat.role] || 0) + stat._count;
    });

    // Get content statistics
    const tweetsCount = await this.prisma.tweet.count({
      where: { tenantId: id },
    });

    const newsCount = await this.prisma.news.count({
      where: { tenantId: id },
    });

    const aiAnalysisCount = await this.prisma.aiAnalysis.count({
      where: { tenantId: id },
    });

    // Get alert statistics
    const alertStats = await this.prisma.alert.groupBy({
      by: ['status', 'severity'],
      where: { tenantId: id },
      _count: true,
    });

    const totalAlerts = await this.prisma.alert.count({
      where: { tenantId: id },
    });

    const unreadAlerts = await this.prisma.alert.count({
      where: { tenantId: id, status: 'UNREAD' },
    });

    // Process alert stats by severity
    const alertsBySeverity: Record<string, number> = {};
    alertStats.forEach((stat) => {
      alertsBySeverity[stat.severity] = (alertsBySeverity[stat.severity] || 0) + stat._count;
    });

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        byRole: usersByRole,
      },
      content: {
        tweets: tweetsCount,
        news: newsCount,
        aiAnalysis: aiAnalysisCount,
      },
      alerts: {
        total: totalAlerts,
        unread: unreadAlerts,
        bySeverity: alertsBySeverity,
      },
    };
  }

}