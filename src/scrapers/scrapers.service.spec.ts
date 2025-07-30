import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ScrapersService } from './scrapers.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTweetDto } from './dto/create-tweet.dto';

describe('ScrapersService', () => {
  let service: ScrapersService;
  let prismaService: jest.Mocked<PrismaService>;
  let auditService: jest.Mocked<AuditService>;

  const mockPrismaService = {
    tweet: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    news: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    mediaSource: {
      findUnique: jest.fn(),
    },
    aiProcessingQueue: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  } as any;

  const mockAuditService = {
    logAction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrapersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<ScrapersService>(ScrapersService);
    prismaService = module.get(PrismaService) as any;
    auditService = module.get(AuditService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTweet', () => {
    const mockCreateTweetDto: CreateTweetDto = {
      tweetId: 'tweet123',
      mediaSourceId: 'media123',
      authorName: 'Test Author',
      authorHandle: '@testauthor',
      content: 'Test tweet content',
      publishedAt: '2025-07-30T10:00:00Z',
      hashtags: ['#test'],
      mentions: ['@mention'],
      tenantId: 'tenant123',
    };

    it('should create a new tweet successfully', async () => {
      // Mock no existing tweet
      prismaService.tweet.findFirst.mockResolvedValue(null);
      
      // Mock media source exists
      prismaService.mediaSource.findUnique.mockResolvedValue({ id: 'media123' });

      // Mock transaction success
      const mockTweet = { id: 'new-tweet-id', tweetId: 'tweet123', contentHash: 'hash123' };
      const mockAiJob = { id: 'ai-job-id' };
      prismaService.$transaction.mockResolvedValue({ tweet: mockTweet, aiJob: mockAiJob });

      // Mock audit service
      auditService.logAction.mockResolvedValue(undefined);

      const result = await service.createTweet(mockCreateTweetDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Tweet created successfully');
      expect(result.data.id).toBe('new-tweet-id');
      expect(result.data.isDuplicate).toBe(false);
      expect(result.data.aiJobId).toBe('ai-job-id');

      expect(prismaService.tweet.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { tweetId: 'tweet123' },
            { contentHash: expect.any(String) }
          ]
        }
      });
      expect(prismaService.$transaction).toHaveBeenCalled();
      expect(auditService.logAction).toHaveBeenCalled();
    });

    it('should handle duplicate tweet', async () => {
      // Mock existing tweet
      const existingTweet = { 
        id: 'existing-id', 
        tweetId: 'tweet123', 
        contentHash: 'hash123' 
      };
      prismaService.tweet.findFirst.mockResolvedValue(existingTweet);

      const result = await service.createTweet(mockCreateTweetDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Tweet already exists');
      expect(result.data.isDuplicate).toBe(true);
      expect(result.data.id).toBe('existing-id');
      
      // Should not call transaction or audit for duplicates
      expect(prismaService.$transaction).not.toHaveBeenCalled();
      expect(auditService.logAction).not.toHaveBeenCalled();
    });

    it('should throw error if media source not found', async () => {
      prismaService.tweet.findFirst.mockResolvedValue(null);
      prismaService.mediaSource.findUnique.mockResolvedValue(null);

      await expect(service.createTweet(mockCreateTweetDto))
        .rejects.toThrow(BadRequestException);
      
      expect(prismaService.mediaSource.findUnique).toHaveBeenCalledWith({
        where: { id: 'media123' }
      });
    });
  });

  describe('getHealthCheck', () => {
    it('should return healthy status when database is accessible', async () => {
      prismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.getHealthCheck();

      expect(result.status).toBe('healthy');
      expect(result.services.database).toBe('healthy');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.uptime).toBeGreaterThan(0);
    });

    it('should return down status when database is not accessible', async () => {
      prismaService.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const result = await service.getHealthCheck();

      expect(result.status).toBe('down');
      expect(result.services.database).toBe('down');
    });
  });

  describe('getStats', () => {
    it('should return service statistics', async () => {
      const result = await service.getStats();

      expect(result.message).toBe('Scrapers statistics retrieved successfully');
      expect(result.data).toHaveProperty('tweetsReceived');
      expect(result.data).toHaveProperty('newsReceived');
      expect(result.data).toHaveProperty('duplicatesBlocked');
      expect(result.data).toHaveProperty('aiJobsCreated');
      expect(result.data).toHaveProperty('avgResponseTime');
      expect(result.data).toHaveProperty('uptime');
      expect(typeof result.data.uptime).toBe('number');
    });
  });
});
