"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./database/prisma.service");
const redis_service_1 = require("./config/redis.service");
let AppService = class AppService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    getHello() {
        return 'Thoth Analytics API - Government Communication Intelligence System';
    }
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'thoth-analytics-api',
        };
    }
    async getDbHealth() {
        try {
            const dbInfo = await this.prisma.getDatabaseInfo();
            return {
                status: dbInfo.connected ? 'connected' : 'disconnected',
                database: 'postgresql',
                version: dbInfo.version,
                timestamp: new Date().toISOString(),
            };
        }
        catch {
            return {
                status: 'disconnected',
                database: 'postgresql',
                timestamp: new Date().toISOString(),
            };
        }
    }
    async getRedisHealth() {
        try {
            const isHealthy = await this.redis.isHealthy();
            return {
                status: isHealthy ? 'connected' : 'disconnected',
                cache: 'redis',
                timestamp: new Date().toISOString(),
            };
        }
        catch {
            return {
                status: 'disconnected',
                cache: 'redis',
                timestamp: new Date().toISOString(),
            };
        }
    }
    async getFullHealth() {
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
        }
        catch {
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
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], AppService);
//# sourceMappingURL=app.service.js.map