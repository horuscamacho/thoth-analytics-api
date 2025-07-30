import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { ScrapersService } from './scrapers.service';
import { ScrapersController } from './scrapers.controller';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';

// Configuración de throttling condicional
const THROTTLING_ENABLED = process.env.THROTTLING_ENABLED !== 'false';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuditModule,
    // ThrottlerModule se importa condicionalmente
    ...(THROTTLING_ENABLED ? [
      ThrottlerModule.forRoot([{
        name: 'default',
        ttl: parseInt(process.env.THROTTLING_DEFAULT_TTL || '60') * 1000, // 60 seconds
        limit: parseInt(process.env.THROTTLING_DEFAULT_LIMIT || '100'), // 100 requests
      }])
    ] : []),
  ],
  providers: [ScrapersService],
  controllers: [ScrapersController],
  exports: [ScrapersService],
})
export class ScrapersModule {}
