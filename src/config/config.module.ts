import { Global, Module } from '@nestjs/common';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService, ConfigModule as NestConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [NestConfigModule],
      useFactory: (configService: ConfigService): CacheModuleOptions => {
        const config = configService.get<CacheModuleOptions>('redis');
        if (!config || typeof config !== 'object') {
          throw new Error('Redis configuration not found');
        }
        return config;
      },
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [CacheModule, RedisService],
})
export class ConfigModule {}
