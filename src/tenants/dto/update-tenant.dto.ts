import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @IsOptional()
  @IsEnum(['GOVERNMENT_STATE', 'GOVERNMENT_MUNICIPAL', 'HIGH_PROFILE'], {
    message: 'Type must be one of: GOVERNMENT_STATE, GOVERNMENT_MUNICIPAL, HIGH_PROFILE',
  })
  type?: 'GOVERNMENT_STATE' | 'GOVERNMENT_MUNICIPAL' | 'HIGH_PROFILE';

  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'], {
    message: 'Status must be one of: ACTIVE, INACTIVE, SUSPENDED',
  })
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

  @IsOptional()
  settings?: Record<string, unknown>;
}