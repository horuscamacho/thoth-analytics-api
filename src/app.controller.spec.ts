import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './database/prisma.service';
import { RedisService } from './config/redis.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockPrismaService = {
      getDatabaseInfo: jest.fn().mockResolvedValue({
        connected: true,
        version: '15.0',
      }),
    };
    const mockRedisService = {
      isHealthy: jest.fn().mockResolvedValue(true),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
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

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return Thoth Analytics API message', () => {
      expect(appController.getHello()).toBe(
        'Thoth Analytics API - Government Communication Intelligence System',
      );
    });
  });
});
