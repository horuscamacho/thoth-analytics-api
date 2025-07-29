import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string; service: string } {
    return this.appService.getHealth();
  }

  @Get('health/db')
  async getDbHealth(): Promise<{ status: string; database: string; timestamp: string }> {
    return this.appService.getDbHealth();
  }

  @Get('health/redis')
  async getRedisHealth(): Promise<{ status: string; cache: string; timestamp: string }> {
    return this.appService.getRedisHealth();
  }

  @Get('health/full')
  async getFullHealth(): Promise<{
    status: string;
    services: {
      api: string;
      database: string;
      redis: string;
    };
    timestamp: string;
  }> {
    return this.appService.getFullHealth();
  }
}
