import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'colorless',
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      // eslint-disable-next-line no-console
      console.log('✅ Prisma connected to database');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    // eslint-disable-next-line no-console
    console.log('✅ Prisma disconnected from database');
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  // Get database info
  async getDatabaseInfo(): Promise<{ version: string; connected: boolean }> {
    try {
      const result = await this.$queryRaw<[{ version: string }]>`SELECT version()`;
      return {
        version: result[0]?.version || 'unknown',
        connected: true,
      };
    } catch {
      return {
        version: 'unknown',
        connected: false,
      };
    }
  }
}
