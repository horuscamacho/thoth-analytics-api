import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiAnalysisService } from './ai-analysis/ai-analysis.service';
import { AiProcessingController } from './ai-processing/ai-processing.controller';
import { PromptsService } from './prompts/prompts.service';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { QueueProcessorService } from './queue-processor/queue-processor.service';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuditModule,
  ],
  providers: [AiAnalysisService, PromptsService, QueueProcessorService],
  controllers: [AiProcessingController],
  exports: [AiAnalysisService]
})
export class AiProcessingModule {}
