import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../config/redis.service';
import { FilterService } from './services/filter.service';
import { AdvancedFiltersDto, SearchSuggestionsDto, ExportFiltersDto, AggregationInterval } from './dto/advanced-filters.dto';

describe('DashboardService - Advanced Features', () => {
  let service: DashboardService;

  const mockPrismaService = {
    aiAnalysis: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockFilterService = {
    buildWhereClause: jest.fn(),
    buildOrderByClause: jest.fn(),
    searchContent: jest.fn(),
    getSearchSuggestions: jest.fn(),
    getFilterStats: jest.fn(),
    groupResults: jest.fn(),
    calculatePagination: jest.fn(),
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
        {
          provide: FilterService,
          useValue: mockFilterService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('advancedSearch', () => {
    const tenantId = 'test-tenant';
    const mockAnalysisResults = [
      {
        id: 'analysis-1',
        tenantId,
        sentiment: 'positive',
        threatLevel: 'LOW',
        tags: ['política'],
        createdAt: new Date('2025-01-15'),
        tweet: {
          id: 'tweet-1',
          authorName: 'user1',
          content: 'Test tweet content',
          createdAt: new Date('2025-01-15'),
        },
        news: null,
      },
      {
        id: 'analysis-2',
        tenantId,
        sentiment: 'negative',
        threatLevel: 'MEDIUM',
        tags: ['economía'],
        createdAt: new Date('2025-01-16'),
        tweet: null,
        news: {
          id: 'news-1',
          title: 'Test news title',
          content: 'Test news content',
          extractedAt: new Date('2025-01-16'),
          url: 'https://example.com',
        },
      },
    ];

    beforeEach(() => {
      mockFilterService.buildWhereClause.mockReturnValue({ tenantId });
      mockFilterService.buildOrderByClause.mockReturnValue({ createdAt: 'desc' });
      mockFilterService.calculatePagination.mockReturnValue({
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
      mockPrismaService.aiAnalysis.findMany.mockResolvedValue(mockAnalysisResults);
      mockPrismaService.aiAnalysis.count.mockResolvedValue(2);
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue('OK');
    });

    it('should perform advanced search without cache', async () => {
      const filters: AdvancedFiltersDto = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        contentTypes: ['TWEET', 'NEWS'],
        page: 1,
        limit: 20,
      };

      const result = await service.advancedSearch(tenantId, filters);

      expect(mockFilterService.buildWhereClause).toHaveBeenCalledWith(tenantId, filters);
      expect(mockFilterService.buildOrderByClause).toHaveBeenCalledWith(filters);
      expect(mockPrismaService.aiAnalysis.findMany).toHaveBeenCalledWith({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: {
          tweet: {
            select: {
              id: true,
              authorName: true,
              createdAt: true,
              content: true,
            },
          },
          news: {
            select: {
              id: true,
              title: true,
              content: true,
              extractedAt: true,
              url: true,
            },
          },
        },
      });

      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('filters');
      expect(result.results).toHaveLength(2);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should return cached results when available', async () => {
      const cachedResult = { results: [], pagination: {}, filters: {} };
      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedResult));

      const filters: AdvancedFiltersDto = {};
      const result = await service.advancedSearch(tenantId, filters);

      expect(result).toEqual(cachedResult);
      expect(mockPrismaService.aiAnalysis.findMany).not.toHaveBeenCalled();
    });

    it('should perform full-text search when searchQuery is provided', async () => {
      const filters: AdvancedFiltersDto = {
        searchQuery: 'reforma electoral',
        contentTypes: ['TWEET'],
      };
      const contentIds = ['tweet-1', 'tweet-2'];
      mockFilterService.searchContent.mockResolvedValue(contentIds);

      await service.advancedSearch(tenantId, filters);

      expect(mockFilterService.searchContent).toHaveBeenCalledWith(
        tenantId,
        'reforma electoral',
        ['TWEET'],
      );
      expect(mockFilterService.buildWhereClause).toHaveBeenCalledWith(tenantId, filters);
    });

    it('should group results when groupBy is specified', async () => {
      const filters: AdvancedFiltersDto = {
        groupBy: 'source',
      };
      const groupedResults = {
        'Twitter': [mockAnalysisResults[0]],
        'El Universal': [mockAnalysisResults[1]],
      };
      mockFilterService.groupResults.mockResolvedValue(groupedResults);

      const result = await service.advancedSearch(tenantId, filters);

      expect(mockFilterService.groupResults).toHaveBeenCalledWith(mockAnalysisResults, 'source');
      expect(result.results).toEqual(groupedResults);
    });

    it('should handle pagination correctly', async () => {
      const filters: AdvancedFiltersDto = {
        page: 2,
        limit: 10,
      };

      await service.advancedSearch(tenantId, filters);

      expect(mockPrismaService.aiAnalysis.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      mockPrismaService.aiAnalysis.findMany.mockRejectedValue(new Error('Database error'));

      const filters: AdvancedFiltersDto = {};

      await expect(service.advancedSearch(tenantId, filters)).rejects.toThrow('Database error');
    });
  });

  describe('getSearchSuggestions', () => {
    const tenantId = 'test-tenant';

    beforeEach(() => {
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue('OK');
    });

    it('should get search suggestions without cache', async () => {
      const suggestionsDto: SearchSuggestionsDto = {
        query: 'mor',
        type: 'entities',
        limit: 5,
      };
      const mockSuggestions = {
        entities: ['Morena', 'Morelia'],
      };
      mockFilterService.getSearchSuggestions.mockResolvedValue(mockSuggestions);

      const result = await service.getSearchSuggestions(tenantId, suggestionsDto);

      expect(mockFilterService.getSearchSuggestions).toHaveBeenCalledWith(tenantId, suggestionsDto);
      expect(result).toEqual(mockSuggestions);
      expect(mockRedisService.set).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(mockSuggestions),
        60,
      );
    });

    it('should return cached suggestions when available', async () => {
      const cachedSuggestions = { entities: ['AMLO', 'Morena'] };
      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedSuggestions));

      const suggestionsDto: SearchSuggestionsDto = {};
      const result = await service.getSearchSuggestions(tenantId, suggestionsDto);

      expect(result).toEqual(cachedSuggestions);
      expect(mockFilterService.getSearchSuggestions).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockFilterService.getSearchSuggestions.mockRejectedValue(new Error('Service error'));

      const suggestionsDto: SearchSuggestionsDto = {};
      const result = await service.getSearchSuggestions(tenantId, suggestionsDto);

      expect(result).toEqual({ entities: [], sources: [], tags: [] });
    });
  });

  describe('getFilterStats', () => {
    const tenantId = 'test-tenant';

    beforeEach(() => {
      mockRedisService.get.mockResolvedValue(null);
      mockRedisService.set.mockResolvedValue('OK');
    });

    it('should get filter statistics without cache', async () => {
      const filters: AdvancedFiltersDto = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };
      const mockStats = {
        contentTypes: [
          { type: 'TWEET', count: 150 },
          { type: 'NEWS', count: 75 },
        ],
        dateRange: {
          min_date: new Date('2025-01-01'),
          max_date: new Date('2025-01-31'),
        },
        sentimentDistribution: [
          { sentiment: 50, _count: 25 },
          { sentiment: 75, _count: 30 },
        ],
        totalFiltered: 225,
      };
      mockFilterService.getFilterStats.mockResolvedValue(mockStats);

      const result = await service.getFilterStats(tenantId, filters);

      expect(mockFilterService.getFilterStats).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(mockStats);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      mockFilterService.getFilterStats.mockRejectedValue(new Error('Stats error'));

      const filters: AdvancedFiltersDto = {};

      await expect(service.getFilterStats(tenantId, filters)).rejects.toThrow('Stats error');
    });
  });

  describe('exportDashboardData', () => {
    const tenantId = 'test-tenant';

    beforeEach(() => {
      mockFilterService.buildWhereClause.mockReturnValue({ tenantId });
      mockPrismaService.aiAnalysis.count.mockResolvedValue(500);
    });

    it('should prepare CSV export', async () => {
      const exportFilters: ExportFiltersDto = {
        format: 'csv',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        fields: ['createdAt', 'sentiment', 'threatLevel'],
        includeMetadata: true,
      };

      const result = await service.exportDashboardData(tenantId, exportFilters);

      expect(result).toHaveProperty('status', 'export_queued');
      expect(result).toHaveProperty('format', 'csv');
      expect(result).toHaveProperty('estimatedRecords', 500);
      expect(result).toHaveProperty('exportId');
      expect(result.exportId).toMatch(/^export_\d+$/);
    });

    it('should prepare Excel export', async () => {
      const exportFilters: ExportFiltersDto = {
        format: 'xlsx',
        minRisk: 70,
      };

      const result = await service.exportDashboardData(tenantId, exportFilters);

      expect(result.format).toBe('xlsx');
      expect(mockFilterService.buildWhereClause).toHaveBeenCalledWith(tenantId, exportFilters);
    });

    it('should handle export errors', async () => {
      mockPrismaService.aiAnalysis.count.mockRejectedValue(new Error('Count error'));

      const exportFilters: ExportFiltersDto = {};

      await expect(service.exportDashboardData(tenantId, exportFilters)).rejects.toThrow('Count error');
    });
  });

  describe('getAggregatedTrends', () => {
    const tenantId = 'test-tenant';

    beforeEach(() => {
      mockPrismaService.$queryRaw.mockResolvedValue([
        { period: '2025-01-01', avg_sentiment: 65, avg_risk: 30, count: 50 },
        { period: '2025-01-02', avg_sentiment: 70, avg_risk: 25, count: 45 },
      ]);
    });

    it('should get daily aggregated trends', async () => {
      const filters: AdvancedFiltersDto = {
        startDate: '2025-01-01',
        endDate: '2025-01-07',
        aggregationInterval: AggregationInterval.DAY,
      };

      const result = await service.getAggregatedTrends(tenantId, filters);

      expect(result).toHaveProperty('interval', AggregationInterval.DAY);
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('metadata');
      expect(result.trends).toHaveLength(2);
      expect(result.metadata.totalPeriods).toBe(2);
    });

    it('should get hourly aggregated trends', async () => {
      const filters: AdvancedFiltersDto = {
        aggregationInterval: AggregationInterval.HOUR,
      };

      await service.getAggregatedTrends(tenantId, filters);

      expect(mockPrismaService.$queryRaw).toHaveBeenCalledWith(
        expect.anything(),
        'YYYY-MM-DD HH24:00:00', 
        'test-tenant',
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('should get weekly aggregated trends', async () => {
      const filters: AdvancedFiltersDto = {
        aggregationInterval: AggregationInterval.WEEK,
      };

      await service.getAggregatedTrends(tenantId, filters);

      expect(mockPrismaService.$queryRaw).toHaveBeenCalledWith(
        expect.anything(),
        'IYYY-IW',
        'test-tenant',
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('should get monthly aggregated trends', async () => {
      const filters: AdvancedFiltersDto = {
        aggregationInterval: AggregationInterval.MONTH,
      };

      await service.getAggregatedTrends(tenantId, filters);

      expect(mockPrismaService.$queryRaw).toHaveBeenCalledWith(
        expect.anything(),
        'YYYY-MM',
        'test-tenant',
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('should handle aggregation errors', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Query error'));

      const filters: AdvancedFiltersDto = {};

      await expect(service.getAggregatedTrends(tenantId, filters)).rejects.toThrow('Query error');
    });
  });

  describe('getComparativeAnalytics', () => {
    const tenantId = 'test-tenant';

    beforeEach(() => {
      // Mock getMetrics method on the service instance
      jest.spyOn(service, 'getMetrics').mockResolvedValue({
        totalTweets: 100,
        totalNews: 50,
        totalAnalysis: 75,
        totalAlerts: 10,
        activeAlerts: 5,
        averageRiskScore: 45,
        averageSentimentScore: 65,
        processingQueueSize: 20,
        lastUpdate: new Date(),
      });
    });

    it('should get comparative analytics for two periods', async () => {
      const filters: AdvancedFiltersDto = {
        startDate: '2025-01-15',
        endDate: '2025-01-22',
      };

      const result = await service.getComparativeAnalytics(tenantId, filters);

      expect(result).toHaveProperty('currentPeriod');
      expect(result).toHaveProperty('previousPeriod');
      expect(result).toHaveProperty('changes');
      expect(result.currentPeriod.start).toEqual(new Date('2025-01-15'));
      expect(result.currentPeriod.end).toEqual(new Date('2025-01-22'));
      expect(result.changes).toHaveProperty('totalTweets');
      expect(result.changes).toHaveProperty('totalNews');
      expect(result.changes).toHaveProperty('averageSentiment');
    });

    it('should calculate percentage changes correctly', async () => {
      // Mock different values for current and previous periods
      jest.spyOn(service, 'getMetrics')
        .mockResolvedValueOnce({
          totalTweets: 150,
          totalNews: 75,
          totalAnalysis: 100,
          totalAlerts: 15,
          activeAlerts: 8,
          averageRiskScore: 60,
          averageSentimentScore: 80,
          processingQueueSize: 25,
          lastUpdate: new Date(),
        })
        .mockResolvedValueOnce({
          totalTweets: 100,
          totalNews: 50,
          totalAnalysis: 75,
          totalAlerts: 10,
          activeAlerts: 5,
          averageRiskScore: 45,
          averageSentimentScore: 65,
          processingQueueSize: 20,
          lastUpdate: new Date(),
        });

      const filters: AdvancedFiltersDto = {
        startDate: '2025-01-15',
        endDate: '2025-01-22',
      };

      const result = await service.getComparativeAnalytics(tenantId, filters);

      expect(result.changes.totalTweets.value).toBe(50);
      expect(result.changes.totalTweets.percentage).toBe(50);
      expect(result.changes.totalNews.value).toBe(25);
      expect(result.changes.totalNews.percentage).toBe(50);
    });

    it('should handle zero division in percentage calculation', async () => {
      jest.spyOn(service, 'getMetrics')
        .mockResolvedValueOnce({
          totalTweets: 100,
          totalNews: 50,
          totalAnalysis: 75,
          totalAlerts: 10,
          activeAlerts: 5,
          averageRiskScore: 45,
          averageSentimentScore: 65,
          processingQueueSize: 20,
          lastUpdate: new Date(),
        })
        .mockResolvedValueOnce({
          totalTweets: 0,
          totalNews: 0,
          totalAnalysis: 0,
          totalAlerts: 0,
          activeAlerts: 0,
          averageRiskScore: 0,
          averageSentimentScore: 0,
          processingQueueSize: 0,
          lastUpdate: new Date(),
        });

      const filters: AdvancedFiltersDto = {
        startDate: '2025-01-15',
        endDate: '2025-01-22',
      };

      const result = await service.getComparativeAnalytics(tenantId, filters);

      expect(result.changes.totalTweets.percentage).toBe(100);
      expect(result.changes.totalNews.percentage).toBe(100);
    });

    it('should throw error when date range is not provided', async () => {
      const filters: AdvancedFiltersDto = {};

      await expect(service.getComparativeAnalytics(tenantId, filters)).rejects.toThrow(
        'Start date and end date are required for comparative analytics',
      );
    });

    it('should handle getMetrics errors', async () => {
      jest.spyOn(service, 'getMetrics').mockRejectedValue(new Error('Metrics error'));

      const filters: AdvancedFiltersDto = {
        startDate: '2025-01-15',
        endDate: '2025-01-22',
      };

      await expect(service.getComparativeAnalytics(tenantId, filters)).rejects.toThrow('Metrics error');
    });
  });
});