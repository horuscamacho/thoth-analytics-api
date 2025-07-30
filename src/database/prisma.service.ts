import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Database disconnected');
  }

  async getDatabaseInfo(): Promise<{ connected: boolean; version?: string }> {
    try {
      const result = await this.$queryRaw<{ version: string }[]>`SELECT version()`;
      return {
        connected: true,
        version: result[0]?.version || 'Unknown',
      };
    } catch (error) {
      return {
        connected: false,
      };
    }
  }
}