import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PUBLIC } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @PUBLIC()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @PUBLIC()
  @Get('health')
  getHealth(): { status: string; timestamp: string; service: string } {
    return this.appService.getHealth();
  }

  @PUBLIC()
  @Get('health/db')
  async getDbHealth(): Promise<{ status: string; database: string; timestamp: string }> {
    return this.appService.getDbHealth();
  }

  @PUBLIC()
  @Get('health/redis')
  async getRedisHealth(): Promise<{ status: string; cache: string; timestamp: string }> {
    return this.appService.getRedisHealth();
  }

  @PUBLIC()
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
