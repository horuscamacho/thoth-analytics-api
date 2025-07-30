import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
    app = module.createNestApplication();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have onModuleInit method', () => {
    expect(service.onModuleInit).toBeDefined();
    expect(typeof service.onModuleInit).toBe('function');
  });

  describe('onModuleInit', () => {
    it('should call $connect when initialized', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
      connectSpy.mockRestore();
    });

    it('should handle connection errors gracefully', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockRejectedValue(new Error('Connection failed'));

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
      expect(connectSpy).toHaveBeenCalled();
      connectSpy.mockRestore();
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect when module is destroyed', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('✅ Prisma disconnected from database');
      
      disconnectSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('database operations', () => {
    it('should have access to all Prisma models', () => {
      expect(service.user).toBeDefined();
      expect(service.tenant).toBeDefined();
      expect(service.auditLog).toBeDefined();
      expect(service.tweet).toBeDefined();
      expect(service.news).toBeDefined();
      expect(service.alert).toBeDefined();
      expect(service.aiAnalysis).toBeDefined();
    });

    it('should support transactions', () => {
      expect(service.$transaction).toBeDefined();
      expect(typeof service.$transaction).toBe('function');
    });

    it('should support raw queries', () => {
      expect(service.$queryRaw).toBeDefined();
      expect(typeof service.$queryRaw).toBe('function');
    });

    it('should support executing raw SQL', () => {
      expect(service.$executeRaw).toBeDefined();
      expect(typeof service.$executeRaw).toBe('function');
    });
  });

  describe('connection management', () => {
    it('should have connect method', () => {
      expect(service.$connect).toBeDefined();
      expect(typeof service.$connect).toBe('function');
    });

    it('should have disconnect method', () => {
      expect(service.$disconnect).toBeDefined();
      expect(typeof service.$disconnect).toBe('function');
    });

    it('should handle multiple connects gracefully', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();

      await Promise.all([
        service.$connect(),
        service.$connect(),
        service.$connect()
      ]);

      expect(connectSpy).toHaveBeenCalledTimes(3);
      connectSpy.mockRestore();
    });

    it('should handle disconnect after connect', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue();
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue();

      await service.$connect();
      await service.$disconnect();

      expect(connectSpy).toHaveBeenCalled();
      expect(disconnectSpy).toHaveBeenCalled();
      
      connectSpy.mockRestore();
      disconnectSpy.mockRestore();
    });
  });

  describe('health check methods', () => {
    describe('isHealthy', () => {
      it('should return true when database is healthy', async () => {
        const queryRawSpy = jest.spyOn(service, '$queryRaw').mockResolvedValue([{ 1: 1 }]);

        const result = await service.isHealthy();

        expect(result).toBe(true);
        expect(queryRawSpy).toHaveBeenCalledWith(['SELECT 1']);
        queryRawSpy.mockRestore();
      });

      it('should return false when database query fails', async () => {
        const queryRawSpy = jest.spyOn(service, '$queryRaw').mockRejectedValue(new Error('Database error'));

        const result = await service.isHealthy();

        expect(result).toBe(false);
        queryRawSpy.mockRestore();
      });
    });

    describe('getDatabaseInfo', () => {
      it('should return database version and connection status', async () => {
        const mockVersion = 'PostgreSQL 14.0';
        const queryRawSpy = jest.spyOn(service, '$queryRaw').mockResolvedValue([{ version: mockVersion }]);

        const result = await service.getDatabaseInfo();

        expect(result).toEqual({
          version: mockVersion,
          connected: true,
        });
        expect(queryRawSpy).toHaveBeenCalledWith(['SELECT version()']);
        queryRawSpy.mockRestore();
      });

      it('should return unknown version when query fails', async () => {
        const queryRawSpy = jest.spyOn(service, '$queryRaw').mockRejectedValue(new Error('Database error'));

        const result = await service.getDatabaseInfo();

        expect(result).toEqual({
          version: 'unknown',
          connected: false,
        });
        queryRawSpy.mockRestore();
      });

      it('should handle empty result array', async () => {
        const queryRawSpy = jest.spyOn(service, '$queryRaw').mockResolvedValue([]);

        const result = await service.getDatabaseInfo();

        expect(result).toEqual({
          version: 'unknown',
          connected: true,
        });
        queryRawSpy.mockRestore();
      });
    });
  });

  describe('error handling', () => {
    it('should handle connection timeouts', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockRejectedValue(new Error('Connection timeout'));

      await expect(service.$connect()).rejects.toThrow('Connection timeout');
      connectSpy.mockRestore();
    });

    it('should handle database unavailable errors', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockRejectedValue(new Error('Database unavailable'));

      await expect(service.$connect()).rejects.toThrow('Database unavailable');
      connectSpy.mockRestore();
    });
  });
});