import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name!: string;

  @IsEnum(['GOVERNMENT_STATE', 'GOVERNMENT_MUNICIPAL', 'HIGH_PROFILE'], {
    message: 'Type must be one of: GOVERNMENT_STATE, GOVERNMENT_MUNICIPAL, HIGH_PROFILE',
  })
  @IsNotEmpty({ message: 'Type is required' })
  type!: 'GOVERNMENT_STATE' | 'GOVERNMENT_MUNICIPAL' | 'HIGH_PROFILE';

  @IsOptional()
  settings?: Record<string, unknown>;
}