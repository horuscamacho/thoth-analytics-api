import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../config/redis.service';
import { DashboardFilters } from './dto/simple.dto';

describe('DashboardService', () => {
  let service: DashboardService;
  let redisService: RedisService;

  const mockPrismaService = {
    tweet: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    news: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    aiAnalysis: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    alert: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    aiProcessingQueue: {
      count: jest.fn(),
    },
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMetrics', () => {
    const tenantId = 'test-tenant-id';
    const filters: DashboardFilters = {};

    it('should return cached metrics if available', async () => {
      const cachedMetrics = {
        totalTweets: 100,
        totalNews: 50,
        totalAnalysis: 75,
        totalAlerts: 10,
        activeAlerts: 5,
        averageRiskScore: 60,
        averageSentimentScore: 70,
        processingQueueSize: 20,
        lastUpdate: '2025-07-30T22:56:29.264Z',
      };

      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedMetrics));

      const result = await service.getMetrics(tenantId, filters);

      expect(redisService.get).toHaveBeenCalledWith(
        `metrics:${tenantId}:${JSON.stringify(filters)}`,
      );
      expect(result).toEqual(cachedMetrics);
    });

    it('should calculate metrics from database when not cached', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.tweet.count.mockResolvedValue(100);
      mockPrismaService.news.count.mockResolvedValue(50);
      mockPrismaService.aiAnalysis.count.mockResolvedValue(75);
      mockPrismaService.alert.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);

      // Mock for getAverageSentiment and getAverageRisk
      mockPrismaService.aiAnalysis.findMany
        .mockResolvedValueOnce([{ sentiment: 'positive' }, { sentiment: 'neutral' }])
        .mockResolvedValueOnce([{ threatLevel: 'HIGH' }, { threatLevel: 'MEDIUM' }]);

      const result = await service.getMetrics(tenantId, filters);

      expect(mockPrismaService.tweet.count).toHaveBeenCalledWith({
        where: { tenantId },
      });
      expect(mockPrismaService.news.count).toHaveBeenCalledWith({
        where: { tenantId },
      });
      expect(mockPrismaService.aiAnalysis.count).toHaveBeenCalledWith({
        where: { tenantId, createdAt: undefined },
      });
      expect(mockPrismaService.alert.count).toHaveBeenCalledTimes(2);

      expect(result.totalTweets).toBe(100);
      expect(result.totalNews).toBe(50);
      expect(result.totalAnalysis).toBe(75);
      expect(result.totalAlerts).toBe(10);
      expect(result.activeAlerts).toBe(5);
    });

    it('should return mock data on database error', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.tweet.count.mockRejectedValue(new Error('Database error'));

      const result = await service.getMetrics(tenantId, filters);

      expect(result.totalTweets).toBe(0);
      expect(result.totalNews).toBe(0);
      expect(result.totalAnalysis).toBe(0);
      expect(result.totalAlerts).toBe(0);
      expect(result.activeAlerts).toBe(0);
    });

    it('should cache calculated metrics', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockPrismaService.tweet.count.mockResolvedValue(100);
      mockPrismaService.news.count.mockResolvedValue(50);
      mockPrismaService.aiAnalysis.count.mockResolvedValue(75);
      mockPrismaService.alert.count.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
      mockPrismaService.aiAnalysis.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      await service.getMetrics(tenantId, filters);

      expect(redisService.set).toHaveBeenCalledWith(
        `metrics:${tenantId}:${JSON.stringify(filters)}`,
        expect.any(String),
        300,
      );
    });
  });

  describe('getSentimentTrends', () => {
    const tenantId = 'test-tenant-id';
    const filters: DashboardFilters = {};

    it('should return sentiment trends grouped by day', async () => {
      const mockSentimentData = [
        {
          createdAt: new Date('2025-01-01T10:00:00Z'),
          sentiment: 'positive',
        },
        {
          createdAt: new Date('2025-01-01T14:00:00Z'),
          sentiment: 'negative',
        },
        {
          createdAt: new Date('2025-01-02T10:00:00Z'),
          sentiment: 'neutral',
        },
      ];

      mockPrismaService.aiAnalysis.findMany.mockResolvedValue(mockSentimentData);

      const result = await service.getSentimentTrends(tenantId, filters);

      expect(result).toHaveLength(2); // 2 different days
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('sentiment');
      expect(result[0]).toHaveProperty('count');
    });

    it('should return empty array on database error', async () => {
      mockPrismaService.aiAnalysis.findMany.mockRejectedValue(new Error('Database error'));

      const result = await service.getSentimentTrends(tenantId, filters);

      expect(result).toEqual([]);
    });
  });

  describe('getRiskDistribution', () => {
    const tenantId = 'test-tenant-id';
    const filters: DashboardFilters = {};

    it('should return risk distribution with percentages', async () => {
      const mockRiskData = [
        { threatLevel: 'HIGH', _count: 30 },
        { threatLevel: 'MEDIUM', _count: 50 },
        { threatLevel: 'LOW', _count: 20 },
      ];

      mockPrismaService.aiAnalysis.groupBy.mockResolvedValue(mockRiskData);

      const result = await service.getRiskDistribution(tenantId, filters);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        level: 'HIGH',
        count: 30,
        percentage: 30, // 30/100 * 100
      });
      expect(result[1]).toEqual({
        level: 'MEDIUM',
        count: 50,
        percentage: 50, // 50/100 * 100
      });
      expect(result[2]).toEqual({
        level: 'LOW',
        count: 20,
        percentage: 20, // 20/100 * 100
      });
    });

    it('should return empty array on database error', async () => {
      mockPrismaService.aiAnalysis.groupBy.mockRejectedValue(new Error('Database error'));

      const result = await service.getRiskDistribution(tenantId, filters);

      expect(result).toEqual([]);
    });
  });

  describe('getTopEntities', () => {
    const tenantId = 'test-tenant-id';
    const filters: DashboardFilters = {};

    it('should extract entities from tags and response', async () => {
      const mockAnalyses = [
        {
          tags: ['AMLO', 'Morena'],
          response: { entities: ['Claudia Sheinbaum'] },
        },
        {
          tags: ['PAN', 'Oposición'],
          response: { entities: ['AMLO'] },
        },
      ];

      mockPrismaService.aiAnalysis.findMany.mockResolvedValue(mockAnalyses);

      const result = await service.getTopEntities(tenantId, filters);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('count');
      expect(result[0]).toHaveProperty('type', 'entity');

      // AMLO should appear twice (tags + response) so should be first
      const amloEntity = result.find((e) => e.name === 'AMLO');
      expect(amloEntity?.count).toBe(2);
    });

    it('should handle response parsing errors gracefully', async () => {
      const mockAnalyses = [
        {
          tags: ['ValidTag'],
          response: 'invalid-json-string',
        },
      ];

      mockPrismaService.aiAnalysis.findMany.mockResolvedValue(mockAnalyses);

      const result = await service.getTopEntities(tenantId, filters);

      expect(result).toEqual([{ name: 'ValidTag', count: 1, type: 'entity' }]);
    });
  });

  describe('getSourceMetrics', () => {
    const tenantId = 'test-tenant-id';
    const filters: DashboardFilters = {};

    it('should combine tweet and news sources', async () => {
      const mockTweets = [
        { mediaSource: { name: 'Twitter API' } },
        { mediaSource: { name: 'Twitter API' } },
      ];
      const mockNews = [
        { mediaSource: { name: 'El Universal' } },
        { mediaSource: { name: 'Milenio' } },
      ];

      mockPrismaService.tweet.findMany.mockResolvedValue(mockTweets);
      mockPrismaService.news.findMany.mockResolvedValue(mockNews);

      const result = await service.getSourceMetrics(tenantId, filters);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        source: 'Twitter API',
        count: 2,
        type: 'content',
      });
      // Should be sorted by count descending
      expect(result[0]?.count || 0).toBeGreaterThanOrEqual(result[1]?.count || 0);
    });
  });

  describe('getActivityByHour', () => {
    const tenantId = 'test-tenant-id';
    const filters: DashboardFilters = {};

    it('should return 24-hour activity distribution', async () => {
      const mockTweets = [
        { publishedAt: new Date('2025-01-01T10:30:00Z') }, // Hour 10
        { publishedAt: new Date('2025-01-01T10:45:00Z') }, // Hour 10
        { publishedAt: new Date('2025-01-01T14:15:00Z') }, // Hour 14
      ];
      const mockNews = [
        { extractedAt: new Date('2025-01-01T10:00:00Z') }, // Hour 10
        { extractedAt: new Date('2025-01-01T16:30:00Z') }, // Hour 16
      ];

      mockPrismaService.tweet.findMany.mockResolvedValue(mockTweets);
      mockPrismaService.news.findMany.mockResolvedValue(mockNews);

      const result = await service.getActivityByHour(tenantId, filters);

      expect(result).toHaveLength(24);
      expect(result[10]).toEqual({
        hour: 10,
        tweets: 2,
        news: 1,
        total: 3,
      });
      expect(result[14]).toEqual({
        hour: 14,
        tweets: 1,
        news: 0,
        total: 1,
      });
      expect(result[16]).toEqual({
        hour: 16,
        tweets: 0,
        news: 1,
        total: 1,
      });
    });
  });

  describe('mapSentimentToScore', () => {
    it('should map sentiment strings to numeric scores', () => {
      // Using any to access private method for testing
      const mapSentimentToScore = (service as any).mapSentimentToScore.bind(service);

      expect(mapSentimentToScore('very_positive')).toBe(100);
      expect(mapSentimentToScore('positive')).toBe(75);
      expect(mapSentimentToScore('neutral')).toBe(50);
      expect(mapSentimentToScore('negative')).toBe(25);
      expect(mapSentimentToScore('very_negative')).toBe(0);
      expect(mapSentimentToScore('unknown')).toBe(50); // default
    });
  });

  describe('mapThreatLevelToScore', () => {
    it('should map threat levels to numeric scores', () => {
      // Using any to access private method for testing
      const mapThreatLevelToScore = (service as any).mapThreatLevelToScore.bind(service);

      expect(mapThreatLevelToScore('CRITICAL')).toBe(100);
      expect(mapThreatLevelToScore('HIGH')).toBe(75);
      expect(mapThreatLevelToScore('MEDIUM')).toBe(50);
      expect(mapThreatLevelToScore('LOW')).toBe(25);
      expect(mapThreatLevelToScore('NONE')).toBe(0);
      expect(mapThreatLevelToScore(null)).toBe(0);
      expect(mapThreatLevelToScore('UNKNOWN')).toBe(0); // default
    });
  });

  describe('buildDateFilter', () => {
    it('should build correct date filter from filters', () => {
      // Using any to access private method for testing
      const buildDateFilter = (service as any).buildDateFilter.bind(service);

      const filters: DashboardFilters = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };

      const result = buildDateFilter(filters);

      expect(result.createdAt.gte).toEqual(new Date('2025-01-01'));
      expect(result.createdAt.lte).toEqual(new Date('2025-01-31'));
    });

    it('should return empty filter when no dates provided', () => {
      const buildDateFilter = (service as any).buildDateFilter.bind(service);

      const filters: DashboardFilters = {};
      const result = buildDateFilter(filters);

      expect(result).toEqual({});
    });
  });

  describe('getDashboardData', () => {
    const tenantId = 'test-tenant-id';
    const filters: DashboardFilters = {};

    it('should return cached dashboard data if available', async () => {
      const cachedData = {
        metrics: { totalTweets: 100 },
        sentimentTrends: [],
        riskDistribution: [],
        topEntities: [],
        sourceMetrics: [],
        activityByHour: [],
        alertsSummary: {},
        generatedAt: '2025-07-30T22:56:29.288Z',
      };

      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedData));

      const result = await service.getDashboardData(tenantId, filters);

      expect(redisService.get).toHaveBeenCalledWith(
        `dashboard:${tenantId}:${JSON.stringify(filters)}`,
      );
      expect(result).toEqual(cachedData);
    });

    it('should compile dashboard data from all sources when not cached', async () => {
      mockRedisService.get.mockResolvedValue(null);

      // Mock all the service methods that getDashboardData calls
      jest.spyOn(service, 'getMetrics').mockResolvedValue({
        totalTweets: 100,
        totalNews: 50,
        totalAnalysis: 75,
        totalAlerts: 10,
        activeAlerts: 5,
        averageRiskScore: 60,
        averageSentimentScore: 70,
        processingQueueSize: 20,
        lastUpdate: new Date(),
      });

      jest.spyOn(service, 'getSentimentTrends').mockResolvedValue([]);
      jest.spyOn(service, 'getRiskDistribution').mockResolvedValue([]);
      jest.spyOn(service, 'getTopEntities').mockResolvedValue([]);
      jest.spyOn(service, 'getSourceMetrics').mockResolvedValue([]);
      jest.spyOn(service, 'getActivityByHour').mockResolvedValue([]);
      jest.spyOn(service, 'getAlertsSummary').mockResolvedValue({});

      const result = await service.getDashboardData(tenantId, filters);

      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('sentimentTrends');
      expect(result).toHaveProperty('riskDistribution');
      expect(result).toHaveProperty('topEntities');
      expect(result).toHaveProperty('sourceMetrics');
      expect(result).toHaveProperty('activityByHour');
      expect(result).toHaveProperty('alertsSummary');
      expect(result).toHaveProperty('generatedAt');

      expect(result.metrics.totalTweets).toBe(100);
    });
  });
});
