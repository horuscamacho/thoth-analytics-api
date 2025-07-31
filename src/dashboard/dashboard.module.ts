import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { FilterService } from './services/filter.service';
import { DatabaseModule } from '../database/database.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [DashboardController],
  providers: [DashboardService, FilterService],
  exports: [DashboardService, FilterService],
})
export class DashboardModule {}
