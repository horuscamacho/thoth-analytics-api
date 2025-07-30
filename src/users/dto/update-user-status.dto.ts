import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserStatusDto {
  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  @MaxLength(500, { message: 'Reason must not exceed 500 characters' })
  reason?: string;
}
