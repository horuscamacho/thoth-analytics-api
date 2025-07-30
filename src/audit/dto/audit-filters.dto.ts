import { IsOptional, IsEnum, IsString, IsDateString, IsIP, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { AuditAction, AuditEntityType, SecurityLevel } from '@prisma/client';

export class AuditFiltersDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @IsEnum(AuditEntityType)
  entityType?: AuditEntityType;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsEnum(SecurityLevel)
  securityLevel?: SecurityLevel;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 50;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @IsString()
  search?: string; // Para búsqueda en metadata o valores
}