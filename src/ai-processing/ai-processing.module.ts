import { Module } from '@nestjs/common';
import { AiAnalysisService } from './ai-analysis/ai-analysis.service';
import { AiProcessingController } from './ai-processing/ai-processing.controller';
import { PromptsService } from './prompts/prompts.service';

@Module({
  providers: [AiAnalysisService, PromptsService],
  controllers: [AiProcessingController]
})
export class AiProcessingModule {}
