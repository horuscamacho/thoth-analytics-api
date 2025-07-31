import { IsOptional, IsArray, IsString, IsNumber, Min, Max, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SortField {
  CREATED_AT = 'createdAt',
  SENTIMENT = 'sentiment',
  RISK_SCORE = 'riskScore',
  RELEVANCE = 'relevance',
  SOURCE = 'source',
  ENTITY_COUNT = 'entityCount',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum AggregationInterval {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class AdvancedFiltersDto {
  @ApiPropertyOptional({ description: 'Start date for filtering (ISO 8601)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering (ISO 8601)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Content types to filter', 
    enum: ['TWEET', 'NEWS'],
    isArray: true 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contentTypes?: string[];

  @ApiPropertyOptional({ 
    description: 'Specific sources to filter',
    isArray: true 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sources?: string[];

  @ApiPropertyOptional({ 
    description: 'Entity names to filter',
    isArray: true 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entities?: string[];

  @ApiPropertyOptional({ 
    description: 'Tags to filter',
    isArray: true 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ 
    description: 'Minimum sentiment score',
    minimum: 0,
    maximum: 100 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  minSentiment?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum sentiment score',
    minimum: 0,
    maximum: 100 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  maxSentiment?: number;

  @ApiPropertyOptional({ 
    description: 'Minimum risk score',
    minimum: 0,
    maximum: 100 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  minRisk?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum risk score',
    minimum: 0,
    maximum: 100 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  maxRisk?: number;

  @ApiPropertyOptional({ 
    description: 'Search query for full-text search' 
  })
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @ApiPropertyOptional({ 
    description: 'Alert severity levels to filter',
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    isArray: true 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alertSeverities?: string[];

  @ApiPropertyOptional({ 
    description: 'Alert statuses to filter',
    enum: ['UNREAD', 'READ', 'ARCHIVED'],
    isArray: true 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alertStatuses?: string[];

  @ApiPropertyOptional({ 
    description: 'Field to sort by',
    enum: SortField 
  })
  @IsOptional()
  @IsEnum(SortField)
  sortBy?: SortField;

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC 
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ 
    description: 'Page number for pagination',
    minimum: 1,
    default: 1 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 20 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;

  @ApiPropertyOptional({ 
    description: 'Aggregation interval for time-series data',
    enum: AggregationInterval,
    default: AggregationInterval.DAY 
  })
  @IsOptional()
  @IsEnum(AggregationInterval)
  aggregationInterval?: AggregationInterval = AggregationInterval.DAY;

  @ApiPropertyOptional({ 
    description: 'Include archived items',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeArchived?: boolean = false;

  @ApiPropertyOptional({ 
    description: 'Group results by field',
    enum: ['source', 'contentType', 'entity', 'tag', 'severity'] 
  })
  @IsOptional()
  @IsString()
  groupBy?: string;
}

export class SearchSuggestionsDto {
  @ApiPropertyOptional({ description: 'Search query for suggestions' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ 
    description: 'Type of suggestions to return',
    enum: ['entities', 'sources', 'tags', 'all'],
    default: 'all' 
  })
  @IsOptional()
  @IsString()
  type?: string = 'all';

  @ApiPropertyOptional({ 
    description: 'Maximum number of suggestions',
    minimum: 1,
    maximum: 20,
    default: 10 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  limit?: number = 10;
}

export class ExportFiltersDto extends AdvancedFiltersDto {
  @ApiPropertyOptional({ 
    description: 'Export format',
    enum: ['csv', 'xlsx', 'json', 'pdf'],
    default: 'csv' 
  })
  @IsOptional()
  @IsString()
  format?: string = 'csv';

  @ApiPropertyOptional({ 
    description: 'Fields to include in export',
    isArray: true 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({ 
    description: 'Include metadata in export',
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeMetadata?: boolean = true;
}