import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtGuard } from '../auth/guards/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { ROLES } from '../auth/decorators/roles.decorator';
import { CURRENT_USER } from '../auth/decorators/current-user.decorator';

interface ICurrentUser {
  id: string;
  email: string;
  username: string;
  role: string;
  tenantId: string;
}

@Controller('tenants')
@UseGuards(JwtGuard, RolesGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ROLES('SUPER_ADMIN') // Only super admin can create tenants
  @HttpCode(HttpStatus.CREATED)
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
    @CURRENT_USER() currentUser: ICurrentUser,
  ): Promise<{
    message: string;
    data: {
      id: string;
      name: string;
      type: string;
      status: string;
      createdAt: string;
    };
  }> {
    const tenant = await this.tenantsService.createTenant(createTenantDto, currentUser.id);

    return {
      message: 'Tenant created successfully',
      data: {
        id: tenant.id,
        name: tenant.name,
        type: tenant.type,
        status: tenant.status,
        createdAt: tenant.createdAt.toISOString(),
      },
    };
  }

  @Get()
  @ROLES('SUPER_ADMIN', 'DIRECTOR_COMUNICACION')
  async getTenants(
    @CURRENT_USER() currentUser: ICurrentUser,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ): Promise<{
    message: string;
    data: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      createdAt: string;
      _count: {
        users: number;
      };
    }>;
    total: number;
  }> {
    // If not super admin, only show their own tenant
    const tenantId = currentUser.role === 'SUPER_ADMIN' ? undefined : currentUser.tenantId;
    
    const filters: { status?: string; type?: string } = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    
    const tenants = await this.tenantsService.getTenants(tenantId, filters);

    return {
      message: 'Tenants retrieved successfully',
      data: tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
        type: tenant.type,
        status: tenant.status,
        createdAt: tenant.createdAt.toISOString(),
        _count: {
          users: tenant._count?.users || 0,
        },
      })),
      total: tenants.length,
    };
  }

  @Get(':id')
  @ROLES('SUPER_ADMIN', 'DIRECTOR_COMUNICACION')
  async getTenantById(
    @Param('id') id: string,
    @CURRENT_USER() currentUser: ICurrentUser,
  ): Promise<{
    message: string;
    data: {
      id: string;
      name: string;
      type: string;
      status: string;
      settings: any;
      createdAt: string;
      updatedAt: string;
      _count: {
        users: number;
        tweets: number;
        news: number;
        alerts: number;
      };
    };
  }> {
    // If not super admin, only allow access to their own tenant
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.tenantId !== id) {
      throw new Error('Access denied to tenant');
    }

    const tenant = await this.tenantsService.getTenantById(id);

    return {
      message: 'Tenant retrieved successfully',
      data: {
        id: tenant.id,
        name: tenant.name,
        type: tenant.type,
        status: tenant.status,
        settings: tenant.settings,
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt.toISOString(),
        _count: {
          users: tenant._count?.users || 0,
          tweets: tenant._count?.tweets || 0,
          news: tenant._count?.news || 0,
          alerts: tenant._count?.alerts || 0,
        },
      },
    };
  }

  @Put(':id')
  @ROLES('SUPER_ADMIN', 'DIRECTOR_COMUNICACION')
  @HttpCode(HttpStatus.OK)
  async updateTenant(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @CURRENT_USER() currentUser: ICurrentUser,
  ): Promise<{
    message: string;
    data: {
      id: string;
      name: string;
      type: string;
      status: string;
      updatedAt: string;
    };
  }> {
    // If not super admin, only allow updating their own tenant
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.tenantId !== id) {
      throw new Error('Access denied to update tenant');
    }

    // Directors can only update certain fields
    const allowedFields = currentUser.role === 'SUPER_ADMIN' 
      ? updateTenantDto 
      : { 
          ...(updateTenantDto.name && { name: updateTenantDto.name }), 
          ...(updateTenantDto.settings && { settings: updateTenantDto.settings })
        };

    const tenant = await this.tenantsService.updateTenant(id, allowedFields, currentUser.id);

    return {
      message: 'Tenant updated successfully',
      data: {
        id: tenant.id,
        name: tenant.name,
        type: tenant.type,
        status: tenant.status,
        updatedAt: tenant.updatedAt.toISOString(),
      },
    };
  }

  @Put(':id/suspend')
  @ROLES('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async suspendTenant(
    @Param('id') id: string,
    @Body() suspendDto: { reason: string },
    @CURRENT_USER() currentUser: ICurrentUser,
  ): Promise<{
    message: string;
    data: {
      id: string;
      status: string;
      suspendedAt: string;
      reason: string;
    };
  }> {
    const result = await this.tenantsService.suspendTenant(id, currentUser.id, suspendDto.reason);

    return {
      message: 'Tenant suspended successfully',
      data: {
        id: result.id,
        status: result.status,
        suspendedAt: new Date().toISOString(),
        reason: suspendDto.reason,
      },
    };
  }

  @Put(':id/reactivate')
  @ROLES('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async reactivateTenant(
    @Param('id') id: string,
    @CURRENT_USER() currentUser: ICurrentUser,
  ): Promise<{
    message: string;
    data: {
      id: string;
      status: string;
      reactivatedAt: string;
    };
  }> {
    const result = await this.tenantsService.reactivateTenant(id, currentUser.id);

    return {
      message: 'Tenant reactivated successfully',
      data: {
        id: result.id,
        status: result.status,
        reactivatedAt: new Date().toISOString(),
      },
    };
  }

  @Delete(':id')
  @ROLES('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async deleteTenant(
    @Param('id') id: string,
    @Body() confirmationDto: { confirmation: string; reason: string },
    @CURRENT_USER() currentUser: ICurrentUser,
  ): Promise<{
    message: string;
    data: {
      id: string;
      deletedAt: string;
      reason: string;
    };
  }> {
    if (confirmationDto.confirmation !== 'DELETE_TENANT_PERMANENTLY') {
      throw new Error('Invalid confirmation. Must send "DELETE_TENANT_PERMANENTLY"');
    }

    const result = await this.tenantsService.deleteTenant(id, currentUser.id, confirmationDto.reason);

    return {
      message: 'Tenant deleted permanently',
      data: {
        id: result.id,
        deletedAt: new Date().toISOString(),
        reason: confirmationDto.reason,
      },
    };
  }

  @Get(':id/stats')
  @ROLES('SUPER_ADMIN', 'DIRECTOR_COMUNICACION')
  async getTenantStats(
    @Param('id') id: string,
    @CURRENT_USER() currentUser: ICurrentUser,
  ): Promise<{
    message: string;
    data: {
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
    };
  }> {
    // If not super admin, only allow access to their own tenant
    if (currentUser.role !== 'SUPER_ADMIN' && currentUser.tenantId !== id) {
      throw new Error('Access denied to tenant stats');
    }

    const stats = await this.tenantsService.getTenantStats(id);

    return {
      message: 'Tenant statistics retrieved successfully',
      data: stats,
    };
  }
}