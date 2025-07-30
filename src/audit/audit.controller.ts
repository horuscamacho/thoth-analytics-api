import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { AuditFiltersDto, ExportFormat } from './dto';
import { JwtGuard } from '../auth/guards/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { ROLES } from '../auth/decorators/roles.decorator';
import { CURRENT_USER } from '../auth/decorators/current-user.decorator';

interface ICurrentUser {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}

@Controller('audit')
@UseGuards(JwtGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @ROLES('DIRECTOR_COMUNICACION')
  async getLogs(
    @Query() filters: AuditFiltersDto,
    @CURRENT_USER() currentUser: ICurrentUser,
  ) {
    const result = await this.auditService.getLogs(currentUser.tenantId, filters);
    
    return {
      message: 'Audit logs retrieved successfully',
      data: result.logs,
      pagination: {
        total: result.total,
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      },
    };
  }

  @Get('logs/:id')
  @ROLES('DIRECTOR_COMUNICACION')
  async getLogById(
    @Param('id') id: string,
    @CURRENT_USER() currentUser: ICurrentUser,
  ) {
    const log = await this.auditService.getLogs(currentUser.tenantId, { 
      limit: 1, 
      offset: 0 
    });
    
    const foundLog = log.logs.find(l => l.id === id);
    
    if (!foundLog) {
      throw new BadRequestException('Audit log not found');
    }

    return {
      message: 'Audit log retrieved successfully',
      data: foundLog,
    };
  }

  @Get('stats')
  @ROLES('DIRECTOR_COMUNICACION', 'LIDER')
  async getStats(@CURRENT_USER() currentUser: ICurrentUser) {
    const stats = await this.auditService.getAuditStats(currentUser.tenantId);
    
    return {
      message: 'Audit statistics retrieved successfully',
      data: stats,
    };
  }

  @Get('anomalies')
  @ROLES('DIRECTOR_COMUNICACION')
  async getAnomalies(@CURRENT_USER() currentUser: ICurrentUser) {
    const anomalies = await this.auditService.detectAnomalies(currentUser.tenantId);
    
    return {
      message: 'Audit anomalies detected successfully',
      data: anomalies,
      total: anomalies.length,
    };
  }

  @Post('verify')
  @ROLES('DIRECTOR_COMUNICACION')
  @HttpCode(HttpStatus.OK)
  async verifyIntegrity(@CURRENT_USER() currentUser: ICurrentUser) {
    const report = await this.auditService.verifyIntegrity(currentUser.tenantId);
    
    return {
      message: 'Integrity verification completed',
      data: report,
    };
  }

  @Get('export/:format')
  @ROLES('DIRECTOR_COMUNICACION')
  async exportLogs(
    @Param('format') format: string,
    @Query() filters: AuditFiltersDto,
    @CURRENT_USER() currentUser: ICurrentUser,
    @Res() res: Response,
  ) {
    if (!Object.values(ExportFormat).includes(format as ExportFormat)) {
      throw new BadRequestException('Invalid export format. Supported: csv, json, pdf');
    }

    const buffer = await this.auditService.exportLogs(
      currentUser.tenantId,
      filters,
      format as 'csv' | 'json' | 'pdf'
    );

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `audit-logs-${timestamp}.${format}`;
    
    let contentType: string;
    switch (format) {
      case 'csv':
        contentType = 'text/csv';
        break;
      case 'json':
        contentType = 'application/json';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
      default:
        contentType = 'application/octet-stream';
    }

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  @Get('dashboard')
  @ROLES('DIRECTOR_COMUNICACION', 'LIDER')
  async getDashboardData(@CURRENT_USER() currentUser: ICurrentUser) {
    const [stats, anomalies] = await Promise.all([
      this.auditService.getAuditStats(currentUser.tenantId),
      this.auditService.detectAnomalies(currentUser.tenantId),
    ]);

    return {
      message: 'Audit dashboard data retrieved successfully',
      data: {
        stats,
        anomalies: anomalies.slice(0, 10), // Top 10 most recent anomalies
        summary: {
          totalLogs: stats.totalLogs,
          todayActivity: stats.todayLogs,
          criticalAnomalies: anomalies.filter(a => a.severity === 'CRITICAL').length,
          highAnomalies: anomalies.filter(a => a.severity === 'HIGH').length,
        },
      },
    };
  }
}
