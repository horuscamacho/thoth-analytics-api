import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardData, DashboardFilters, DashboardMetrics } from './dto/simple.dto';

describe('DashboardController', () => {
  let controller: DashboardController;
  let dashboardService: DashboardService;

  const mockDashboardService = {
    getDashboardData: jest.fn(),
    getMetrics: jest.fn(),
    getSentimentTrends: jest.fn(),
    getRiskTrends: jest.fn(),
    getTopEntities: jest.fn(),
    getSourceMetrics: jest.fn(),
    getActivityByHour: jest.fn(),
    getAlertsSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    dashboardService = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboardOverview', () => {
    it('should return dashboard overview data', async () => {
      const tenantId = 'test-tenant-id';
      const filters: DashboardFilters = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };
      const mockRequest = {
        user: { tenantId },
      };

      const expectedResult: DashboardData = {
        metrics: {
          totalTweets: 100,
          totalNews: 50,
          totalAnalysis: 75,
          totalAlerts: 10,
          activeAlerts: 5,
          averageRiskScore: 60,
          averageSentimentScore: 70,
          processingQueueSize: 20,
          lastUpdate: new Date(),
        },
        sentimentTrends: [],
        riskDistribution: [],
        topEntities: [],
        sourceMetrics: [],
        activityByHour: [],
        alertsSummary: {
          total: 10,
          unread: 5,
          read: 3,
          archived: 2,
          critical: 1,
          high: 2,
          medium: 4,
          low: 3,
        },
        generatedAt: new Date(),
      };

      mockDashboardService.getDashboardData.mockResolvedValue(expectedResult);

      const result = await controller.getDashboardOverview(filters, mockRequest);

      expect(dashboardService.getDashboardData).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(expectedResult);
    });

    it('should handle empty filters', async () => {
      const tenantId = 'test-tenant-id';
      const filters: DashboardFilters = {};
      const mockRequest = {
        user: { tenantId },
      };

      const expectedResult: DashboardData = {
        metrics: {
          totalTweets: 0,
          totalNews: 0,
          totalAnalysis: 0,
          totalAlerts: 0,
          activeAlerts: 0,
          averageRiskScore: 0,
          averageSentimentScore: 0,
          processingQueueSize: 0,
          lastUpdate: new Date(),
        },
        sentimentTrends: [],
        riskDistribution: [],
        topEntities: [],
        sourceMetrics: [],
        activityByHour: [],
        alertsSummary: {},
        generatedAt: new Date(),
      };

      mockDashboardService.getDashboardData.mockResolvedValue(expectedResult);

      const result = await controller.getDashboardOverview(filters, mockRequest);

      expect(dashboardService.getDashboardData).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getMetrics', () => {
    it('should return dashboard metrics', async () => {
      const tenantId = 'test-tenant-id';
      const filters: DashboardFilters = {};
      const mockRequest = {
        user: { tenantId },
      };

      const expectedMetrics: DashboardMetrics = {
        totalTweets: 150,
        totalNews: 75,
        totalAnalysis: 100,
        totalAlerts: 15,
        activeAlerts: 8,
        averageRiskScore: 65,
        averageSentimentScore: 72,
        processingQueueSize: 25,
        lastUpdate: new Date(),
      };

      mockDashboardService.getMetrics.mockResolvedValue(expectedMetrics);

      const result = await controller.getMetrics(filters, mockRequest);

      expect(dashboardService.getMetrics).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(expectedMetrics);
    });
  });

  describe('getSentimentTrends', () => {
    it('should return sentiment trends data', async () => {
      const tenantId = 'test-tenant-id';
      const filters: DashboardFilters = {
        startDate: '2025-01-01',
        endDate: '2025-01-07',
      };
      const mockRequest = {
        user: { tenantId },
      };

      const expectedTrends = [
        {
          date: new Date('2025-01-01'),
          sentiment: 75,
          count: 10,
        },
        {
          date: new Date('2025-01-02'),
          sentiment: 60,
          count: 15,
        },
      ];

      mockDashboardService.getSentimentTrends.mockResolvedValue(expectedTrends);

      const result = await controller.getSentimentTrends(filters, mockRequest);

      expect(dashboardService.getSentimentTrends).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(expectedTrends);
    });
  });

  describe('getRiskTrends', () => {
    it('should return risk trends data', async () => {
      const tenantId = 'test-tenant-id';
      const filters: DashboardFilters = {};
      const mockRequest = {
        user: { tenantId },
      };

      const expectedRiskTrends = [
        {
          date: new Date('2025-01-01'),
          riskScore: 50,
          count: 8,
        },
        {
          date: new Date('2025-01-02'),
          riskScore: 75,
          count: 12,
        },
      ];

      mockDashboardService.getRiskTrends.mockResolvedValue(expectedRiskTrends);

      const result = await controller.getRiskTrends(filters, mockRequest);

      expect(dashboardService.getRiskTrends).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(expectedRiskTrends);
    });
  });

  describe('getTopEntities', () => {
    it('should return top entities data', async () => {
      const tenantId = 'test-tenant-id';
      const filters: DashboardFilters = {};
      const mockRequest = {
        user: { tenantId },
      };

      const expectedEntities = [
        {
          name: 'AMLO',
          count: 45,
          type: 'entity',
        },
        {
          name: 'Morena',
          count: 32,
          type: 'entity',
        },
        {
          name: 'Claudia Sheinbaum',
          count: 28,
          type: 'entity',
        },
      ];

      mockDashboardService.getTopEntities.mockResolvedValue(expectedEntities);

      const result = await controller.getTopEntities(filters, mockRequest);

      expect(dashboardService.getTopEntities).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(expectedEntities);
    });
  });

  describe('getSourceMetrics', () => {
    it('should return source metrics data', async () => {
      const tenantId = 'test-tenant-id';
      const filters: DashboardFilters = {};
      const mockRequest = {
        user: { tenantId },
      };

      const expectedSourceMetrics = [
        {
          source: 'Twitter API',
          count: 150,
          type: 'content',
        },
        {
          source: 'El Universal',
          count: 75,
          type: 'content',
        },
        {
          source: 'Milenio',
          count: 50,
          type: 'content',
        },
      ];

      mockDashboardService.getSourceMetrics.mockResolvedValue(expectedSourceMetrics);

      const result = await controller.getSourceMetrics(filters, mockRequest);

      expect(dashboardService.getSourceMetrics).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(expectedSourceMetrics);
    });
  });

  describe('getHourlyActivity', () => {
    it('should return hourly activity data', async () => {
      const tenantId = 'test-tenant-id';
      const filters: DashboardFilters = {};
      const mockRequest = {
        user: { tenantId },
      };

      const expectedActivity = new Array(24).fill(0).map((_, hour) => ({
        hour,
        tweets: Math.floor(Math.random() * 10),
        news: Math.floor(Math.random() * 5),
        total: Math.floor(Math.random() * 15),
      }));

      mockDashboardService.getActivityByHour.mockResolvedValue(expectedActivity);

      const result = await controller.getHourlyActivity(filters, mockRequest);

      expect(dashboardService.getActivityByHour).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(expectedActivity);
      expect(result).toHaveLength(24);
    });
  });

  describe('getAlertsSummary', () => {
    it('should return alerts summary data', async () => {
      const tenantId = 'test-tenant-id';
      const filters: DashboardFilters = {};
      const mockRequest = {
        user: { tenantId },
      };

      const expectedAlertsSummary = {
        total: 25,
        unread: 10,
        read: 12,
        archived: 3,
        critical: 2,
        high: 8,
        medium: 10,
        low: 5,
      };

      mockDashboardService.getAlertsSummary.mockResolvedValue(expectedAlertsSummary);

      const result = await controller.getAlertsSummary(filters, mockRequest);

      expect(dashboardService.getAlertsSummary).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(expectedAlertsSummary);
    });
  });

  describe('getHealth', () => {
    it('should return health status', async () => {
      const result = await controller.getHealth();

      expect(result).toEqual({
        status: 'ok',
        service: 'dashboard',
        timestamp: expect.any(String),
        version: '1.0.0',
      });
    });

    it('should return timestamp in ISO format', async () => {
      const result = await controller.getHealth();

      // Verify timestamp is a valid ISO string
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });
  });

  describe('Error handling', () => {
    it('should handle service errors gracefully in getDashboardOverview', async () => {
      const tenantId = 'test-tenant-id';
      const filters: DashboardFilters = {};
      const mockRequest = {
        user: { tenantId },
      };

      mockDashboardService.getDashboardData.mockRejectedValue(new Error('Service error'));

      await expect(controller.getDashboardOverview(filters, mockRequest)).rejects.toThrow(
        'Service error',
      );

      expect(dashboardService.getDashboardData).toHaveBeenCalledWith(tenantId, filters);
    });

    it('should handle service errors gracefully in getMetrics', async () => {
      const tenantId = 'test-tenant-id';
      const filters: DashboardFilters = {};
      const mockRequest = {
        user: { tenantId },
      };

      mockDashboardService.getMetrics.mockRejectedValue(new Error('Database connection failed'));

      await expect(controller.getMetrics(filters, mockRequest)).rejects.toThrow(
        'Database connection failed',
      );

      expect(dashboardService.getMetrics).toHaveBeenCalledWith(tenantId, filters);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should extract tenantId from authenticated user request', async () => {
      const tenantId = 'specific-tenant-123';
      const filters: DashboardFilters = {};
      const mockRequest = {
        user: {
          tenantId,
          id: 'user-123',
          role: 'DIRECTOR_COMUNICACION',
          email: 'director@example.com',
        },
      };

      const expectedMetrics: DashboardMetrics = {
        totalTweets: 100,
        totalNews: 50,
        totalAnalysis: 75,
        totalAlerts: 10,
        activeAlerts: 5,
        averageRiskScore: 60,
        averageSentimentScore: 70,
        processingQueueSize: 20,
        lastUpdate: new Date(),
      };

      mockDashboardService.getMetrics.mockResolvedValue(expectedMetrics);

      const result = await controller.getMetrics(filters, mockRequest);

      expect(dashboardService.getMetrics).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(expectedMetrics);
    });
  });
});
