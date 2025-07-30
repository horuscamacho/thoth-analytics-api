import { Test, TestingModule } from '@nestjs/testing';
import { QueueProcessorService } from './queue-processor.service';
import { PrismaService } from '../../database/prisma.service';
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service';
import { QueueStatus } from '@prisma/client';

describe('QueueProcessorService', () => {
  let service: QueueProcessorService;
  let prismaService: PrismaService;
  let aiAnalysisService: AiAnalysisService;

  const mockJob = {
    id: 'test-job-id',
    tenantId: 'test-tenant',
    tweetId: 'tweet-123',
    newsId: null,
    queueType: 'AI_ANALYSIS',
    priority: 5,
    status: QueueStatus.PENDING,
    attempts: 0,
    scheduledAt: new Date(),
    createdAt: new Date(),
  };

  const mockTweet = {
    id: 'tweet-123',
    authorHandle: '@testuser',
    content: 'Test tweet content',
  };

  const mockAnalysisResult = {
    id: 'analysis-123',
    textAnalysis: { aiSummary: 'Test summary' } as any,
    sentimentAnalysis: { overallSentiment: 'neutral' } as any,
    entityRecognition: { persons: [] } as any,
    riskAssessment: { overallRiskScore: 30 } as any,
    processingTime: 1000,
    totalCost: 0.001,
    inputTokens: 100,
    outputTokens: 50,
    analysisDate: new Date().toISOString(),
  };

  const mockPrismaService = {
    aiProcessingQueue: {
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    tweet: {
      findUnique: jest.fn(),
    },
    news: {
      findUnique: jest.fn(),
    },
    alert: {
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockAiAnalysisService = {
    performCompleteAnalysis: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueProcessorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AiAnalysisService,
          useValue: mockAiAnalysisService,
        },
      ],
    }).compile();

    service = module.get<QueueProcessorService>(QueueProcessorService);
    prismaService = module.get<PrismaService>(PrismaService);
    aiAnalysisService = module.get<AiAnalysisService>(AiAnalysisService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Stop processing to avoid interference between tests
    service.stopProcessing();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startProcessing', () => {
    it('should start the processing interval', () => {
      const startProcessingSpy = jest.spyOn(service, 'startProcessing');
      service.startProcessing();
      
      expect(startProcessingSpy).toHaveBeenCalled();
      expect(service['processingInterval']).toBeDefined();
    });

    it('should not start multiple intervals', () => {
      service.startProcessing();
      const firstInterval = service['processingInterval'];
      
      service.startProcessing();
      expect(service['processingInterval']).toBe(firstInterval);
    });
  });

  describe('stopProcessing', () => {
    it('should stop the processing interval', () => {
      service.startProcessing();
      expect(service['processingInterval']).toBeDefined();
      
      service.stopProcessing();
      expect(service['processingInterval']).toBeNull();
    });
  });

  describe('processQueue', () => {
    it('should process pending jobs', async () => {
      mockPrismaService.aiProcessingQueue.findMany.mockResolvedValue([mockJob]);
      mockPrismaService.tweet.findUnique.mockResolvedValue(mockTweet);
      mockAiAnalysisService.performCompleteAnalysis.mockResolvedValue(mockAnalysisResult);
      
      // Mock the update calls
      mockPrismaService.aiProcessingQueue.update.mockResolvedValue(mockJob);

      await service['processQueue']();

      expect(mockPrismaService.aiProcessingQueue.findMany).toHaveBeenCalledWith({
        where: {
          status: QueueStatus.PENDING,
          attempts: { lt: 3 },
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledAt: 'asc' },
        ],
        take: 5,
        select: expect.any(Object),
      });

      expect(mockAiAnalysisService.performCompleteAnalysis).toHaveBeenCalledWith(
        'tweet-123',
        'tweet',
        'Tweet de @testuser',
        'Test tweet content',
        'test-tenant'
      );
    });

    it('should skip processing when already processing', async () => {
      service['isProcessing'] = true;
      
      await service['processQueue']();
      
      expect(mockPrismaService.aiProcessingQueue.findMany).not.toHaveBeenCalled();
    });

    it('should handle empty queue', async () => {
      mockPrismaService.aiProcessingQueue.findMany.mockResolvedValue([]);
      
      await service['processQueue']();
      
      expect(mockAiAnalysisService.performCompleteAnalysis).not.toHaveBeenCalled();
    });
  });

  describe('handleJobError', () => {
    it('should retry retryable errors', async () => {
      const retryableError = new Error('rate limit exceeded');
      const job = { ...mockJob, attempts: 1 };

      mockPrismaService.aiProcessingQueue.update.mockResolvedValue(job);

      await service['handleJobError'](job, retryableError);

      expect(mockPrismaService.aiProcessingQueue.update).toHaveBeenCalledWith({
        where: { id: job.id },
        data: expect.objectContaining({
          status: QueueStatus.PENDING,
          attempts: 2,
          scheduledAt: expect.any(Date),
        }),
      });
    });

    it('should mark job as failed after max retries', async () => {
      const error = new Error('Permanent error');
      const job = { ...mockJob, attempts: 3 };

      mockPrismaService.aiProcessingQueue.update.mockResolvedValue(job);

      await service['handleJobError'](job, error);

      expect(mockPrismaService.aiProcessingQueue.update).toHaveBeenCalledWith({
        where: { id: job.id },
        data: expect.objectContaining({
          status: QueueStatus.FAILED,
          processedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors', () => {
      const retryableErrors = [
        new Error('rate limit exceeded'),
        new Error('timeout'),
        new Error('ECONNRESET'),
        new Error('OpenAI API error'),
        new Error('429 Too Many Requests'),
      ];

      retryableErrors.forEach(error => {
        expect(service['isRetryableError'](error)).toBe(true);
      });
    });

    it('should identify non-retryable errors', () => {
      const nonRetryableErrors = [
        new Error('Invalid API key'),
        new Error('JSON parse error'),
        new Error('Validation failed'),
      ];

      nonRetryableErrors.forEach(error => {
        expect(service['isRetryableError'](error)).toBe(false);
      });
    });
  });

  describe('checkAndCreateAlert', () => {
    it('should create alert for high risk content', async () => {
      const highRiskAnalysis = {
        ...mockAnalysisResult,
        riskAssessment: { overallRiskScore: 80 },
        sentimentAnalysis: { primarySentiment: 'negative' },
      };

      await service['checkAndCreateAlert'](highRiskAnalysis, 'test-tenant');

      expect(mockPrismaService.alert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'test-tenant',
          type: 'THREAT_DETECTED',
          severity: 'CRITICAL',
          title: '=¨ Contenido de Riesgo Crítico Detectado',
        }),
      });
    });

    it('should not create alert for low risk content', async () => {
      const lowRiskAnalysis = {
        ...mockAnalysisResult,
        riskAssessment: { overallRiskScore: 30 },
        sentimentAnalysis: { primarySentiment: 'neutral' },
      };

      await service['checkAndCreateAlert'](lowRiskAnalysis, 'test-tenant');

      expect(mockPrismaService.alert.create).not.toHaveBeenCalled();
    });
  });

  describe('retryFailedJob', () => {
    it('should reset failed job for retry', async () => {
      const failedJob = { ...mockJob, status: QueueStatus.FAILED };
      mockPrismaService.aiProcessingQueue.findUnique.mockResolvedValue(failedJob);
      mockPrismaService.aiProcessingQueue.update.mockResolvedValue(failedJob);

      await service.retryFailedJob('test-job-id');

      expect(mockPrismaService.aiProcessingQueue.update).toHaveBeenCalledWith({
        where: { id: 'test-job-id' },
        data: expect.objectContaining({
          status: QueueStatus.PENDING,
          attempts: 0,
          scheduledAt: expect.any(Date),
        }),
      });
    });

    it('should throw error for non-failed job', async () => {
      const activeJob = { ...mockJob, status: QueueStatus.PROCESSING };
      mockPrismaService.aiProcessingQueue.findUnique.mockResolvedValue(activeJob);

      await expect(service.retryFailedJob('test-job-id')).rejects.toThrow(
        'Job is not in FAILED status'
      );
    });
  });

  describe('cancelPendingJob', () => {
    it('should cancel pending job', async () => {
      const pendingJob = { ...mockJob, status: QueueStatus.PENDING };
      mockPrismaService.aiProcessingQueue.findUnique.mockResolvedValue(pendingJob);
      mockPrismaService.aiProcessingQueue.update.mockResolvedValue(pendingJob);

      await service.cancelPendingJob('test-job-id');

      expect(mockPrismaService.aiProcessingQueue.update).toHaveBeenCalledWith({
        where: { id: 'test-job-id' },
        data: expect.objectContaining({
          status: QueueStatus.FAILED,
          processedAt: expect.any(Date),
        }),
      });
    });

    it('should throw error for non-pending job', async () => {
      const processingJob = { ...mockJob, status: QueueStatus.PROCESSING };
      mockPrismaService.aiProcessingQueue.findUnique.mockResolvedValue(processingJob);

      await expect(service.cancelPendingJob('test-job-id')).rejects.toThrow(
        'Only PENDING jobs can be cancelled'
      );
    });
  });

  describe('getWorkerStats', () => {
    it('should return worker statistics', async () => {
      mockPrismaService.aiProcessingQueue.count
        .mockResolvedValueOnce(5) // pending
        .mockResolvedValueOnce(2) // processing
        .mockResolvedValueOnce(10) // completed
        .mockResolvedValueOnce(1); // failed

      mockPrismaService.$queryRaw.mockResolvedValue([{ avg_time: 1500 }]);

      const stats = await service.getWorkerStats();

      expect(stats).toEqual({
        isRunning: false, // Not started in this test
        stats: {
          pending: 5,
          processing: 2,
          completed: 10,
          failed: 1,
          total: 18,
          averageProcessingTimeMs: 1500,
        },
        config: {
          batchSize: 5,
          processingIntervalMs: 30000,
          maxRetries: 3,
        },
      });
    });
  });
});