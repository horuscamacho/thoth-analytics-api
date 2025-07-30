import { IsEnum } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  PDF = 'pdf', 
  JSON = 'json'
}

export class ExportAuditLogsDto {
  @IsEnum(ExportFormat)
  format!: ExportFormat;
}