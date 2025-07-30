import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { AuditModule } from './audit/audit.module';
import { TweetsModule } from './tweets/tweets.module';
import { NewsModule } from './news/news.module';
import { AiAnalysisModule } from './ai-analysis/ai-analysis.module';
import { AlertsModule } from './alerts/alerts.module';
import { CommonModule } from './common/common.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { ScrapersModule } from './scrapers/scrapers.module';
import redisConfig from './config/redis.config';

@Module({
  imports: [
    // Configuration module - must be first
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [redisConfig],
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),

    // Database module - depends on config
    DatabaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    TenantsModule,
    AuditModule,
    TweetsModule,
    NewsModule,
    AiAnalysisModule,
    AlertsModule,
    CommonModule,
    ConfigModule,
    ScrapersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
