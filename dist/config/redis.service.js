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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
let RedisService = class RedisService {
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
    }
    async get(key) {
        try {
            const result = await this.cacheManager.get(key);
            return result ?? null;
        }
        catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error(`Redis GET error for key ${key}:`, error);
            }
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            await this.cacheManager.set(key, value, ttl);
        }
        catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error(`Redis SET error for key ${key}:`, error);
            }
        }
    }
    async del(key) {
        try {
            await this.cacheManager.del(key);
        }
        catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error(`Redis DEL error for key ${key}:`, error);
            }
        }
    }
    async reset() {
        try {
            const cacheManager = this.cacheManager;
            if (cacheManager.reset) {
                await cacheManager.reset();
            }
        }
        catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Redis RESET error:', error instanceof Error ? error.message : String(error));
            }
        }
    }
    async setSession(sessionId, sessionData, ttl = 86400) {
        const key = `session:${sessionId}`;
        await this.set(key, sessionData, ttl);
    }
    async getSession(sessionId) {
        const key = `session:${sessionId}`;
        return await this.get(key);
    }
    async deleteSession(sessionId) {
        const key = `session:${sessionId}`;
        await this.del(key);
    }
    async setAuthToken(userId, tokenData, ttl = 604800) {
        const key = `auth:${userId}`;
        await this.set(key, tokenData, ttl);
    }
    async getAuthToken(userId) {
        const key = `auth:${userId}`;
        return await this.get(key);
    }
    async deleteAuthToken(userId) {
        const key = `auth:${userId}`;
        await this.del(key);
    }
    async setCachedResponse(endpoint, tenantId, data, ttl = 300) {
        const key = `api:${tenantId}:${endpoint}`;
        await this.set(key, data, ttl);
    }
    async getCachedResponse(endpoint, tenantId) {
        const key = `api:${tenantId}:${endpoint}`;
        return await this.get(key);
    }
    async setCachedAnalysis(analysisId, result, ttl = 1800) {
        const key = `analysis:${analysisId}`;
        await this.set(key, result, ttl);
    }
    async getCachedAnalysis(analysisId) {
        const key = `analysis:${analysisId}`;
        return await this.get(key);
    }
    async isHealthy() {
        try {
            const testKey = 'health:check';
            const testValue = Date.now().toString();
            await this.set(testKey, testValue, 10);
            const retrieved = await this.get(testKey);
            await this.del(testKey);
            return retrieved === testValue;
        }
        catch {
            return false;
        }
    }
    async getStats() {
        try {
            const isConnected = await this.isHealthy();
            return {
                connected: isConnected,
            };
        }
        catch {
            return {
                connected: false,
            };
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], RedisService);
//# sourceMappingURL=redis.service.js.map