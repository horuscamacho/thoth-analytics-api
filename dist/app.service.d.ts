import { PrismaService } from './database/prisma.service';
import { RedisService } from './config/redis.service';
export declare class AppService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: RedisService);
    getHello(): string;
    getHealth(): {
        status: string;
        timestamp: string;
        service: string;
    };
    getDbHealth(): Promise<{
        status: string;
        database: string;
        version?: string;
        timestamp: string;
    }>;
    getRedisHealth(): Promise<{
        status: string;
        cache: string;
        timestamp: string;
    }>;
    getFullHealth(): Promise<{
        status: string;
        services: {
            api: string;
            database: string;
            redis: string;
        };
        timestamp: string;
    }>;
}
