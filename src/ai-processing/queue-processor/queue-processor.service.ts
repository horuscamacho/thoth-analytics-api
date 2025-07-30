import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service';
import { QueueStatus, Prisma } from '@prisma/client';

@Injectable()
export class QueueProcessorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueProcessorService.name);
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private readonly batchSize = 5;
  private readonly processingIntervalMs = 30000; // 30 segundos
  private readonly maxRetries = 3;
  private readonly retryDelayMs = 5000; // 5 segundos base

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiAnalysisService: AiAnalysisService,
  ) {}

  onModuleInit() {
    this.startProcessing();
  }

  onModuleDestroy() {
    this.stopProcessing();
  }

  startProcessing() {
    if (this.processingInterval) {
      return;
    }

    this.logger.log('🚀 Starting Queue Processor Worker');
    
    // Procesar inmediatamente al iniciar
    this.processQueue();
    
    // Configurar intervalo de procesamiento
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.processingIntervalMs);
  }

  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      this.logger.log('🛑 Queue Processor Worker stopped');
    }
  }

  private async processQueue() {
    if (this.isProcessing) {
      this.logger.debug('Queue processor is already running, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      // Obtener jobs pendientes ordenados por prioridad y fecha
      const pendingJobs = await this.prisma.aiProcessingQueue.findMany({
        where: {
          status: QueueStatus.PENDING,
          attempts: { lt: this.maxRetries },
        },
        orderBy: [
          { priority: 'desc' }, // CRITICAL > HIGH > NORMAL > LOW
          { scheduledAt: 'asc' }, // Los más antiguos primero
        ],
        take: this.batchSize,
        select: {
          id: true,
          tenantId: true,
          tweetId: true,
          newsId: true,
          queueType: true,
          priority: true,
          status: true,
          attempts: true,
          scheduledAt: true,
          createdAt: true,
        },
      });

      if (pendingJobs.length === 0) {
        this.logger.debug('No pending jobs found');
        return;
      }

      this.logger.log(`📋 Processing ${pendingJobs.length} jobs from queue`);

      // Procesar jobs en paralelo (respetando batchSize)
      const processingPromises = pendingJobs.map((job: any) => this.processJob(job));
      await Promise.allSettled(processingPromises);

    } catch (error) {
      this.logger.error('Error processing queue', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processJob(job: any) {
    const startTime = Date.now();
    
    try {
      // Marcar como en procesamiento
      await this.prisma.aiProcessingQueue.update({
        where: { id: job.id },
        data: {
          status: QueueStatus.PROCESSING,
          processingStartedAt: new Date(),
        },
      });

      this.logger.debug(`🔄 Processing job ${job.id} - Type: ${job.queueType}, Priority: ${job.priority}`);

      // Obtener el contenido de tweet o news
      let title = '';
      let content = '';
      
      if (job.queueType === 'AI_ANALYSIS' && job.tweetId) {
        const tweet = await this.prisma.tweet.findUnique({
          where: { id: job.tweetId }
        });
        if (!tweet) throw new Error('Tweet not found');
        title = `Tweet de @${tweet.authorHandle}`;
        content = tweet.content;
      } else if (job.queueType === 'AI_ANALYSIS' && job.newsId) {
        const news = await this.prisma.news.findUnique({
          where: { id: job.newsId }
        });
        if (!news) throw new Error('News not found');
        title = news.title || 'Sin título';
        content = news.content || '';
      } else {
        throw new Error('Invalid job: missing content reference');
      }

      // Realizar análisis completo
      const analysisResult = await this.aiAnalysisService.performCompleteAnalysis(
        job.tweetId || job.newsId!,
        job.tweetId ? 'tweet' : 'news',
        title,
        content,
        job.tenantId,
      );

      const processingTime = Date.now() - startTime;

      // Marcar como completado
      await this.prisma.aiProcessingQueue.update({
        where: { id: job.id },
        data: {
          status: QueueStatus.COMPLETED,
          processedAt: new Date(),
          analysisId: analysisResult.id,
          errorDetails: Prisma.JsonNull,
        },
      });

      this.logger.log(`✅ Job ${job.id} completed in ${processingTime}ms - Analysis ID: ${analysisResult.id}`);

      // Verificar si necesita generar alerta
      await this.checkAndCreateAlert(analysisResult, job.tenantId);

    } catch (error) {
      await this.handleJobError(job, error);
    }
  }

  private async handleJobError(job: any, error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isRetryable = this.isRetryableError(error);
    const newRetryCount = job.attempts + 1;

    this.logger.error(`❌ Error processing job ${job.id}: ${errorMessage}`, error);

    if (isRetryable && newRetryCount < this.maxRetries) {
      // Calcular delay exponencial
      const retryDelay = this.retryDelayMs * Math.pow(2, job.attempts);
      const nextRetryAt = new Date(Date.now() + retryDelay);

      await this.prisma.aiProcessingQueue.update({
        where: { id: job.id },
        data: {
          status: QueueStatus.PENDING,
          attempts: newRetryCount,
          scheduledAt: nextRetryAt,
          errorDetails: {
            lastError: errorMessage,
            lastErrorAt: new Date().toISOString(),
            retryCount: newRetryCount,
            nextRetryAt: nextRetryAt.toISOString(),
          } as any,
        },
      });

      this.logger.warn(`🔄 Job ${job.id} scheduled for retry #${newRetryCount} at ${nextRetryAt.toISOString()}`);
    } else {
      // Marcar como fallido permanentemente
      await this.prisma.aiProcessingQueue.update({
        where: { id: job.id },
        data: {
          status: QueueStatus.FAILED,
          processedAt: new Date(),
          errorDetails: {
            finalError: errorMessage,
            failedAt: new Date().toISOString(),
            totalRetries: job.attempts,
            errorStack: error.stack,
          } as any,
        },
      });

      this.logger.error(`💀 Job ${job.id} permanently failed after ${job.attempts} retries`);
    }
  }

  private isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    
    // Errores que SÍ se pueden reintentar
    const retryablePatterns = [
      'rate limit',
      'timeout',
      'econnreset',
      'econnrefused',
      'etimedout',
      'socket hang up',
      '429',
      '503',
      '502',
      '500',
      'openai',
    ];

    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  private async checkAndCreateAlert(analysis: any, tenantId: string) {
    try {
      // Extraer risk score del análisis
      const riskScore = analysis.riskAssessment?.overallRiskScore || 0;
      const sentiment = analysis.sentimentAnalysis?.primarySentiment || 'neutral';
      
      // Criterios para generar alerta
      const shouldAlert = 
        riskScore >= 70 || // Risk score alto o crítico
        sentiment === 'negative' && riskScore >= 50; // Sentimiento negativo con riesgo medio

      if (shouldAlert) {
        const alertType = 'THREAT_DETECTED';
        const title = riskScore >= 80 
          ? '🚨 Contenido de Riesgo Crítico Detectado'
          : '⚠️ Contenido de Alto Riesgo Detectado';

        await this.prisma.alert.create({
          data: {
            tenantId,
            type: alertType,
            title,
            message: `Se detectó contenido con riesgo ${riskScore}% y sentimiento ${sentiment}. Requiere atención inmediata.`,
            severity: riskScore >= 80 ? 'CRITICAL' : 'WARNING',
            metadata: {
              analysisId: analysis.id,
              riskScore,
              sentiment,
              contentType: analysis.tweetId ? 'tweet' : 'news',
              categories: analysis.riskAssessment?.categories || [],
            } as any,
            status: 'UNREAD',
          },
        });

        this.logger.warn(`🚨 Alert created for analysis ${analysis.id} - Risk: ${riskScore}%`);
      }
    } catch (error) {
      this.logger.error('Error creating alert', error);
      // No fallar el job por error en alertas
    }
  }

  // Métodos públicos para gestión manual
  async retryFailedJob(jobId: string): Promise<void> {
    const job = await this.prisma.aiProcessingQueue.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== QueueStatus.FAILED) {
      throw new Error('Job is not in FAILED status');
    }

    await this.prisma.aiProcessingQueue.update({
      where: { id: jobId },
      data: {
        status: QueueStatus.PENDING,
        attempts: 0,
        scheduledAt: new Date(),
        errorDetails: Prisma.JsonNull,
      },
    });

    this.logger.log(`♻️ Job ${jobId} reset for retry`);
  }

  async cancelPendingJob(jobId: string): Promise<void> {
    const job = await this.prisma.aiProcessingQueue.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== QueueStatus.PENDING) {
      throw new Error('Only PENDING jobs can be cancelled');
    }

    await this.prisma.aiProcessingQueue.update({
      where: { id: jobId },
      data: {
        status: QueueStatus.FAILED,
        processedAt: new Date(),
        errorDetails: {
          reason: 'Manually cancelled',
          cancelledAt: new Date().toISOString(),
        } as any,
      },
    });

    this.logger.log(`🚫 Job ${jobId} cancelled`);
  }

  // Método para obtener estadísticas del worker
  async getWorkerStats() {
    const [pending, processing, completed, failed] = await Promise.all([
      this.prisma.aiProcessingQueue.count({ where: { status: QueueStatus.PENDING } }),
      this.prisma.aiProcessingQueue.count({ where: { status: QueueStatus.PROCESSING } }),
      this.prisma.aiProcessingQueue.count({ where: { status: QueueStatus.COMPLETED } }),
      this.prisma.aiProcessingQueue.count({ where: { status: QueueStatus.FAILED } }),
    ]);

    const avgProcessingTime = await this.prisma.$queryRaw<any[]>`
      SELECT AVG(EXTRACT(EPOCH FROM ("processedAt" - "processingStartedAt")) * 1000) as avg_time
      FROM "ai_processing_queue"
      WHERE status = 'COMPLETED' 
      AND "processingStartedAt" IS NOT NULL
      AND "processedAt" IS NOT NULL
    `;

    return {
      isRunning: this.processingInterval !== null,
      stats: {
        pending,
        processing,
        completed,
        failed,
        total: pending + processing + completed + failed,
        averageProcessingTimeMs: avgProcessingTime[0]?.avg_time || 0,
      },
      config: {
        batchSize: this.batchSize,
        processingIntervalMs: this.processingIntervalMs,
        maxRetries: this.maxRetries,
      },
    };
  }
}