import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUrl,
  MaxLength,
  MinLength,
  IsDateString,
} from 'class-validator';

export class CreateNewsDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  @MaxLength(32)
  tweetId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  mediaSourceId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  content?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(2000)
  url?: string;

  @IsDateString()
  extractedAt!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  @MaxLength(32)
  tenantId!: string;
}