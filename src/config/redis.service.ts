import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisConfig: any = {
      password: this.configService.get('redis.password'),
      database: this.configService.get('redis.db'),
    };

    // Only add socket config if host/port are provided
    const host = this.configService.get('redis.host');
    const port = this.configService.get('redis.port');
    
    if (host && port) {
      redisConfig.socket = {
        host,
        port,
      };
    }

    this.client = createClient(redisConfig);

    this.client.on('error', (err) => console.error('Redis Client Error', err));
    await this.client.connect();
    console.log('✅ Redis connected successfully');
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect();
      console.log('❌ Redis disconnected');
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}