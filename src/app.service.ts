import { Injectable } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { RedisService } from './config/redis.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  getHello(): string {
    return 'Thoth Analytics API - Government Communication Intelligence System';
  }

  getHealth(): { status: string; timestamp: string; service: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'thoth-analytics-api',
    };
  }

  async getDbHealth(): Promise<{
    status: string;
    database: string;
    version?: string;
    timestamp: string;
  }> {
    try {
      const dbInfo = await this.prisma.getDatabaseInfo();
      const result: any = {
        status: dbInfo.connected ? 'connected' : 'disconnected',
        database: 'postgresql',
        timestamp: new Date().toISOString(),
      };
      
      if (dbInfo.version) {
        result.version = dbInfo.version;
      }
      
      return result;
    } catch {
      return {
        status: 'disconnected',
        database: 'postgresql',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getRedisHealth(): Promise<{
    status: string;
    cache: string;
    timestamp: string;
  }> {
    try {
      const isHealthy = await this.redis.isHealthy();
      return {
        status: isHealthy ? 'connected' : 'disconnected',
        cache: 'redis',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'disconnected',
        cache: 'redis',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getFullHealth(): Promise<{
    status: string;
    services: {
      api: string;
      database: string;
      redis: string;
    };
    timestamp: string;
  }> {
    try {
      const [dbHealth, redisHealth] = await Promise.all([
        this.getDbHealth(),
        this.getRedisHealth(),
      ]);

      const allHealthy = dbHealth.status === 'connected' && redisHealth.status === 'connected';

      return {
        status: allHealthy ? 'healthy' : 'degraded',
        services: {
          api: 'ok',
          database: dbHealth.status,
          redis: redisHealth.status,
        },
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'unhealthy',
        services: {
          api: 'error',
          database: 'unknown',
          redis: 'unknown',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }
}
