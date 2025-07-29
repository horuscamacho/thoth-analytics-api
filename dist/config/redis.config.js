"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
const cache_manager_redis_store_1 = require("cache-manager-redis-store");
exports.default = (0, config_1.registerAs)('redis', () => ({
    store: cache_manager_redis_store_1.redisStore,
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
    db: parseInt(process.env.REDIS_DB ?? '0', 10),
    ttl: 300,
    max: 1000,
    retryAttempts: 3,
    retryDelay: 3000,
    connectTimeout: 10000,
    lazyConnect: true,
}));
//# sourceMappingURL=redis.config.js.map