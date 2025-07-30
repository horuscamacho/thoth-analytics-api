import { Test, TestingModule } from '@nestjs/testing';
import { ScrapersController } from './scrapers.controller';
import { ScrapersService } from './scrapers.service';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { CreateNewsDto } from './dto/create-news.dto';
import { ThrottlerModule } from '@nestjs/throttler';

describe('ScrapersController', () => {
  let controller: ScrapersController;
  let service: jest.Mocked<ScrapersService>;

  const mockScrapersService = {
    createTweet: jest.fn(),
    createNews: jest.fn(),
    getHealthCheck: jest.fn(),
    getStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([{
          name: 'default',
          ttl: 60000,
          limit: 100,
        }])
      ],
      controllers: [ScrapersController],
      providers: [
        {
          provide: ScrapersService,
          useValue: mockScrapersService,
        },
      ],
    }).compile();

    controller = module.get<ScrapersController>(ScrapersController);
    service = module.get(ScrapersService);
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
      tenantId: 'tenant123',
    };

    it('should create a tweet successfully', async () => {
      const mockResponse = {
        message: 'Tweet created successfully',
        success: true,
        timestamp: '2025-07-30T10:00:00Z',
        data: {
          id: 'tweet-id',
          tweetId: 'tweet123',
          contentHash: 'hash123',
          aiJobId: 'ai-job-id',
          isDuplicate: false,
        },
      };

      service.createTweet.mockResolvedValue(mockResponse);

      const result = await controller.createTweet(mockCreateTweetDto);

      expect(result).toEqual(mockResponse);
      expect(service.createTweet).toHaveBeenCalledWith(mockCreateTweetDto);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      service.createTweet.mockRejectedValue(error);

      await expect(controller.createTweet(mockCreateTweetDto))
        .rejects.toThrow('Service error');
    });
  });

  describe('createNews', () => {
    const mockCreateNewsDto: CreateNewsDto = {
      tweetId: 'tweet123',
      mediaSourceId: 'media123',
      title: 'Test News',
      content: 'Test news content',
      url: 'https://example.com/news',
      extractedAt: '2025-07-30T10:00:00Z',
      tenantId: 'tenant123',
    };

    it('should create news successfully', async () => {
      const mockResponse = {
        message: 'News created successfully',
        success: true,
        timestamp: '2025-07-30T10:00:00Z',
        data: {
          id: 'news-id',
          tweetId: 'tweet123',
          contentHash: 'hash123',
          aiJobId: 'ai-job-id',
          isDuplicate: false,
        },
      };

      service.createNews.mockResolvedValue(mockResponse);

      const result = await controller.createNews(mockCreateNewsDto);

      expect(result).toEqual(mockResponse);
      expect(service.createNews).toHaveBeenCalledWith(mockCreateNewsDto);
    });
  });

  describe('getHealthCheck', () => {
    it('should return health status', async () => {
      const mockHealthResponse = {
        status: 'healthy' as const,
        timestamp: '2025-07-30T10:00:00Z',
        uptime: 1000,
        version: '1.0.0',
        services: {
          database: 'healthy' as const,
        },
        responseTime: 50,
      };

      service.getHealthCheck.mockResolvedValue(mockHealthResponse);

      const result = await controller.getHealthCheck();

      expect(result).toEqual(mockHealthResponse);
      expect(service.getHealthCheck).toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    it('should return service statistics', async () => {
      const mockStatsResponse = {
        message: 'Statistics retrieved successfully',
        timestamp: '2025-07-30T10:00:00Z',
        data: {
          tweetsReceived: 100,
          newsReceived: 50,
          duplicatesBlocked: 10,
          aiJobsCreated: 90,
          avgResponseTime: 150,
          uptime: 1000,
        },
      };

      service.getStats.mockResolvedValue(mockStatsResponse);

      const result = await controller.getStats();

      expect(result).toEqual(mockStatsResponse);
      expect(service.getStats).toHaveBeenCalled();
    });
  });
});
