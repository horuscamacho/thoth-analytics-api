import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  // Basic cache operations
  async get<T>(key: string): Promise<T | null> {
    try {
      const result = await this.cacheManager.get<T>(key);
      return result ?? null;
    } catch (error) {
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error(`Redis GET error for key ${key}:`, error);
      }
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error(`Redis SET error for key ${key}:`, error);
      }
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error(`Redis DEL error for key ${key}:`, error);
      }
    }
  }

  async reset(): Promise<void> {
    try {
      // Type assertion for reset method
      const cacheManager = this.cacheManager as { reset?: () => Promise<void> };
      if (cacheManager.reset) {
        await cacheManager.reset();
      }
    } catch (error) {
      // Log error for debugging in development
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Redis RESET error:', error instanceof Error ? error.message : String(error));
      }
    }
  }

  // Session management
  async setSession(
    sessionId: string,
    sessionData: Record<string, unknown>,
    ttl = 86400,
  ): Promise<void> {
    const key = `session:${sessionId}`;
    await this.set(key, sessionData, ttl);
  }

  async getSession<T>(sessionId: string): Promise<T | null> {
    const key = `session:${sessionId}`;
    return await this.get<T>(key);
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`;
    await this.del(key);
  }

  // Auth token caching
  async setAuthToken(
    userId: string,
    tokenData: Record<string, unknown>,
    ttl = 604800,
  ): Promise<void> {
    const key = `auth:${userId}`;
    await this.set(key, tokenData, ttl);
  }

  async getAuthToken<T>(userId: string): Promise<T | null> {
    const key = `auth:${userId}`;
    return await this.get<T>(key);
  }

  async deleteAuthToken(userId: string): Promise<void> {
    const key = `auth:${userId}`;
    await this.del(key);
  }

  // API Response caching
  async setCachedResponse(
    endpoint: string,
    tenantId: string,
    data: Record<string, unknown>,
    ttl = 300,
  ): Promise<void> {
    const key = `api:${tenantId}:${endpoint}`;
    await this.set(key, data, ttl);
  }

  async getCachedResponse<T>(endpoint: string, tenantId: string): Promise<T | null> {
    const key = `api:${tenantId}:${endpoint}`;
    return await this.get<T>(key);
  }

  // Analytics caching
  async setCachedAnalysis(
    analysisId: string,
    result: Record<string, unknown>,
    ttl = 1800,
  ): Promise<void> {
    const key = `analysis:${analysisId}`;
    await this.set(key, result, ttl);
  }

  async getCachedAnalysis<T>(analysisId: string): Promise<T | null> {
    const key = `analysis:${analysisId}`;
    return await this.get<T>(key);
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      const testKey = 'health:check';
      const testValue = Date.now().toString();

      await this.set(testKey, testValue, 10);
      const retrieved = await this.get(testKey);
      await this.del(testKey);

      return retrieved === testValue;
    } catch {
      return false;
    }
  }

  // Utility methods
  async getStats(): Promise<{
    connected: boolean;
    keyCount?: number;
    memory?: string;
  }> {
    try {
      const isConnected = await this.isHealthy();

      // Note: Getting detailed stats would require direct Redis connection
      // For now, we'll just return basic connectivity info
      return {
        connected: isConnected,
      };
    } catch {
      return {
        connected: false,
      };
    }
  }
}
