import { Cache } from 'cache-manager';
export declare class RedisService {
    private readonly cacheManager;
    constructor(cacheManager: Cache);
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    reset(): Promise<void>;
    setSession(sessionId: string, sessionData: Record<string, unknown>, ttl?: number): Promise<void>;
    getSession<T>(sessionId: string): Promise<T | null>;
    deleteSession(sessionId: string): Promise<void>;
    setAuthToken(userId: string, tokenData: Record<string, unknown>, ttl?: number): Promise<void>;
    getAuthToken<T>(userId: string): Promise<T | null>;
    deleteAuthToken(userId: string): Promise<void>;
    setCachedResponse(endpoint: string, tenantId: string, data: Record<string, unknown>, ttl?: number): Promise<void>;
    getCachedResponse<T>(endpoint: string, tenantId: string): Promise<T | null>;
    setCachedAnalysis(analysisId: string, result: Record<string, unknown>, ttl?: number): Promise<void>;
    getCachedAnalysis<T>(analysisId: string): Promise<T | null>;
    isHealthy(): Promise<boolean>;
    getStats(): Promise<{
        connected: boolean;
        keyCount?: number;
        memory?: string;
    }>;
}
