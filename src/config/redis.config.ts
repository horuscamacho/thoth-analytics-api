import { registerAs } from '@nestjs/config';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

export default registerAs(
  'redis',
  (): CacheModuleOptions => ({
    store: redisStore as unknown as string,
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
    db: parseInt(process.env.REDIS_DB ?? '0', 10),
    ttl: 300, // 5 minutes default TTL
    max: 1000, // Maximum number of items in cache
    retryAttempts: 3,
    retryDelay: 3000,
    connectTimeout: 10000,
    lazyConnect: true,
  }),
);
