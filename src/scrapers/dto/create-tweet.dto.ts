import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsArray,
  IsOptional,
  IsUrl,
  ArrayMaxSize,
  MaxLength,
  MinLength,
  ValidateNested,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EngagementDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  retweetCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  likeCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  replyCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quoteCount?: number;
}

export class MediaUrlDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  url!: string;

  @IsString()
  @IsOptional()
  type?: string; // 'photo', 'video', 'gif'

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  // Nuevos campos agregados para tweet_media según migración
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  altText?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  width?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  height?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fileSizeBytes?: number;

  @IsOptional()
  @IsBoolean()
  containsText?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  ocrText?: string;
}

export class CreateTweetDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  tweetId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  mediaSourceId!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  authorName!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  authorHandle!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @IsDateString()
  publishedAt!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  hashtags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  mentions?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MediaUrlDto)
  @ArrayMaxSize(20)
  mediaUrls?: MediaUrlDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => EngagementDto)
  engagement?: EngagementDto;

  @IsString()
  @IsNotEmpty()
  @MinLength(32)
  @MaxLength(32)
  tenantId!: string;

  // Nuevos campos agregados según migración 20250730191420_add_missing_fields
  @IsOptional()
  @IsNumber()
  @Min(0)
  mediaCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  retweetCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  likeCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  replyCount?: number;

  @IsOptional()
  @IsBoolean()
  isRetweet?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  originalTweetId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  locationMentioned?: string;
}