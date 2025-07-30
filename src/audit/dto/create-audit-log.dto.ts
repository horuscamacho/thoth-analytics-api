import { IsEnum, IsOptional, IsString, IsObject, IsIP } from 'class-validator';
import { AuditAction, AuditEntityType, SecurityLevel } from '@prisma/client';

export class CreateAuditLogDto {
  @IsString()
  tenantId!: string;

  @IsOptional()
  @IsString()
  userId?: string | null | undefined;

  @IsEnum(AuditAction)
  action!: AuditAction;

  @IsEnum(AuditEntityType)
  entityType!: AuditEntityType;

  @IsOptional()
  @IsString()
  entityId?: string | undefined;

  @IsOptional()
  @IsObject()
  oldValues?: any;

  @IsOptional()
  @IsObject()
  newValues?: any;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  clientFingerprint?: string;

  @IsOptional()
  @IsEnum(SecurityLevel)
  securityLevel?: SecurityLevel;
}