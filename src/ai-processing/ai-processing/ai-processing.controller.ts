import { Controller, Get, Post, Body, Param, Query, Put, Delete } from '@nestjs/common';
import { AiAnalysisService, CompleteAnalysisResult } from '../ai-analysis/ai-analysis.service';
import { PrismaService } from '../../database/prisma.service';
import { QueueProcessorService } from '../queue-processor/queue-processor.service';
// TODO: Enable auth when guards are working
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../../auth/guards/roles.guard';
// import { ROLES } from '../../auth/decorators/roles.decorator';
// import { GetUser } from '../../auth/decorators/get-user.decorator';

export class ManualAnalysisDto {
  contentType!: 'tweet' | 'news';
  contentId!: string;
  title!: string;
  content!: string;
}

export class AnalysisStatsDto {
  totalAnalyses: number;
  todayAnalyses: number;
  totalCost: number;
  todayCost: number;
  averageProcessingTime: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
    mixed: number;
  };

  constructor() {
    this.totalAnalyses = 0;
    this.todayAnalyses = 0;
    this.totalCost = 0;
    this.todayCost = 0;
    this.averageProcessingTime = 0;
    this.riskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
    this.sentimentDistribution = { positive: 0, neutral: 0, negative: 0, mixed: 0 };
  }
}

// TODO: Enable auth guards
// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai-processing')
export class AiProcessingController {
  constructor(
    private readonly aiAnalysisService: AiAnalysisService,
    private readonly prisma: PrismaService,
    private readonly queueProcessor: QueueProcessorService,
  ) {}

  @Post('analyze')
  // @ROLES('DIRECTOR_COMUNICACION', 'LIDER')
  async performManualAnalysis(
    @Body() manualAnalysisDto: ManualAnalysisDto,
    // @GetUser() user: any,
  ): Promise<CompleteAnalysisResult> {
    // TODO: Get tenantId from authenticated user
    const tenantId = 'hidalgo-gobierno-estatal';
    return await this.aiAnalysisService.performCompleteAnalysis(
      manualAnalysisDto.contentId,
      manualAnalysisDto.contentType,
      manualAnalysisDto.title,
      manualAnalysisDto.content,
      tenantId,
    );
  }

  @Get('analysis/:id')
  // @ROLES('DIRECTOR_COMUNICACION', 'LIDER', 'DIRECTOR_AREA')
  async getAnalysisById(@Param('id') id: string /*, @GetUser() user: any*/) {
    // TODO: Get tenantId from authenticated user
    const tenantId = 'hidalgo-gobierno-estatal';
    const analysis = await this.prisma.aiAnalysis.findFirst({
      where: { 
        id: id,
        tenantId: tenantId 
      },
      include: {
        tweet: {
          select: {
            tweetId: true,
            authorName: true,
            authorHandle: true,
            content: true,
            publishedAt: true,
          }
        },
        news: {
          select: {
            title: true,
            content: true,
            url: true,
            extractedAt: true,
          }
        }
      }
    });

    if (!analysis) {
      throw new Error('Analysis not found');
    }

    return analysis;
  }

  @Get('analyses')
  // @ROLES('DIRECTOR_COMUNICACION', 'LIDER', 'DIRECTOR_AREA')
  async getAnalyses(
    // @GetUser() user: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('contentType') contentType?: 'tweet' | 'news',
    @Query('riskLevel') riskLevel?: 'low' | 'medium' | 'high' | 'critical',
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // TODO: Get tenantId from authenticated user
    const tenantId = 'hidalgo-gobierno-estatal';
    const where: any = {
      tenantId: tenantId,
    };

    // Filtro por tipo de contenido
    if (contentType) {
      if (contentType === 'tweet') {
        where.tweetId = { not: null };
      } else {
        where.newsId = { not: null };
      }
    }

    // Filtro por nivel de riesgo (usando JSON path)
    if (riskLevel) {
      const riskScore = {
        low: { gte: 0, lt: 30 },
        medium: { gte: 30, lt: 60 },
        high: { gte: 60, lt: 80 },
        critical: { gte: 80, lte: 100 }
      }[riskLevel];

      // Para PostgreSQL con JSON, necesitamos usar raw query
      const rawWhere = `"riskAssessment"->>'overallRiskScore' >= '${riskScore.gte}' AND "riskAssessment"->>'overallRiskScore' < '${riskScore.lt}'`;
      where.AND = [{ [Symbol.for('prisma.raw')]: rawWhere }];
    }

    const [analyses, total] = await Promise.all([
      this.prisma.aiAnalysis.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          tweet: {
            select: {
              tweetId: true,
              authorName: true,
              content: true,
              publishedAt: true,
            }
          },
          news: {
            select: {
              title: true,
              url: true,
              extractedAt: true,
            }
          }
        }
      }),
      this.prisma.aiAnalysis.count({ where })
    ]);

    return {
      data: analyses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      }
    };
  }

  @Get('stats')
  // @ROLES('DIRECTOR_COMUNICACION', 'LIDER')
  async getProcessingStats(/* @GetUser() user: any */): Promise<AnalysisStatsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalAnalyses,
      todayAnalyses,
    ] = await Promise.all([
      // Total análisis
      this.prisma.aiAnalysis.count({
        where: { tenantId: 'temp-tenant-id' }
      }),

      // Análisis de hoy
      this.prisma.aiAnalysis.count({
        where: {
          tenantId: 'temp-tenant-id',
          createdAt: { gte: today }
        }
      }),

    ]);

    // Para la distribución de riesgo y sentimiento, necesitaríamos queries más complejas
    // Por ahora, devolvemos la estructura básica
    const stats = new AnalysisStatsDto();
    stats.totalAnalyses = totalAnalyses;
    stats.todayAnalyses = todayAnalyses;
    stats.totalCost = 0; // TODO: Implement when schema is updated
    stats.averageProcessingTime = 0; // TODO: Implement when schema is updated

    // TODO: Implement cost tracking when schema is updated
    stats.todayCost = 0;

    return stats;
  }

  @Get('health')
  async getHealthStatus() {
    const startTime = Date.now();
    
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'healthy',
          openai: 'configured', // No podemos testear sin hacer una llamada real
        },
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'down',
          openai: 'unknown',
        },
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('queue/status')
  // @ROLES('DIRECTOR_COMUNICACION')
  async getQueueStatus(/* @GetUser() user: any */) {
    const [pending, processing, completed, failed] = await Promise.all([
      this.prisma.aiProcessingQueue.count({
        where: { tenantId: 'temp-tenant-id', status: 'PENDING' }
      }),
      this.prisma.aiProcessingQueue.count({
        where: { tenantId: 'temp-tenant-id', status: 'PROCESSING' }
      }),
      this.prisma.aiProcessingQueue.count({
        where: { tenantId: 'temp-tenant-id', status: 'COMPLETED' }
      }),
      this.prisma.aiProcessingQueue.count({
        where: { tenantId: 'temp-tenant-id', status: 'FAILED' }
      }),
    ]);

    return {
      pending,
      processing,
      completed,
      failed,
      total: pending + processing + completed + failed,
    };
  }

  @Get('queue/worker/stats')
  // @ROLES('DIRECTOR_COMUNICACION')
  async getWorkerStats(/* @GetUser() user: any */) {
    return await this.queueProcessor.getWorkerStats();
  }

  @Put('queue/retry/:id')
  // @ROLES('DIRECTOR_COMUNICACION')
  async retryFailedJob(
    @Param('id') jobId: string,
    /* @GetUser() user: any */
  ) {
    // TODO: Verify job belongs to user's tenant
    await this.queueProcessor.retryFailedJob(jobId);
    return { message: 'Job scheduled for retry', jobId };
  }

  @Delete('queue/cancel/:id')
  // @ROLES('DIRECTOR_COMUNICACION')
  async cancelPendingJob(
    @Param('id') jobId: string,
    /* @GetUser() user: any */
  ) {
    // TODO: Verify job belongs to user's tenant
    await this.queueProcessor.cancelPendingJob(jobId);
    return { message: 'Job cancelled', jobId };
  }

  @Post('queue/worker/start')
  // @ROLES('DIRECTOR_COMUNICACION')
  async startWorker() {
    this.queueProcessor.startProcessing();
    return { message: 'Queue processor started' };
  }

  @Post('queue/worker/stop')
  // @ROLES('DIRECTOR_COMUNICACION')
  async stopWorker() {
    this.queueProcessor.stopProcessing();
    return { message: 'Queue processor stopped' };
  }

  @Get('queue/jobs')
  // @ROLES('DIRECTOR_COMUNICACION', 'LIDER')
  async getQueueJobs(
    @Query('status') status?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      tenantId: 'temp-tenant-id', // TODO: Get from auth
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    const [jobs, total] = await Promise.all([
      this.prisma.aiProcessingQueue.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [
          { priority: 'desc' },
          { scheduledAt: 'desc' },
        ],
        include: {
        }
      }),
      this.prisma.aiProcessingQueue.count({ where })
    ]);

    return {
      data: jobs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      }
    };
  }
}
