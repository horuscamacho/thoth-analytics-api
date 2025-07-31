import { Controller, Get, Query, Req, UseGuards, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../auth/guards/jwt/jwt.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { ROLES } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { DashboardData, DashboardFilters, DashboardMetrics } from './dto/simple.dto';
import { AdvancedFiltersDto, SearchSuggestionsDto, ExportFiltersDto } from './dto/advanced-filters.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview with all metrics and data' })
  @ApiResponse({ status: 200, description: 'Dashboard overview data retrieved successfully' })
  @ROLES(UserRole.DIRECTOR_COMUNICACION, UserRole.LIDER, UserRole.DIRECTOR_AREA, UserRole.ASISTENTE)
  async getDashboardOverview(
    @Query() filters: DashboardFilters,
    @Req() req: any,
  ): Promise<DashboardData> {
    return this.dashboardService.getDashboardData(req.user.tenantId, filters);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get dashboard metrics only (faster endpoint)' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved successfully' })
  @ROLES(UserRole.DIRECTOR_COMUNICACION, UserRole.LIDER, UserRole.DIRECTOR_AREA, UserRole.ASISTENTE)
  async getMetrics(@Query() filters: DashboardFilters, @Req() req: any): Promise<DashboardMetrics> {
    return this.dashboardService.getMetrics(req.user.tenantId, filters);
  }

  @Get('trends/sentiment')
  @ApiOperation({ summary: 'Get sentiment analysis trends over time' })
  @ApiResponse({ status: 200, description: 'Sentiment trends retrieved successfully' })
  @ROLES(UserRole.DIRECTOR_COMUNICACION, UserRole.LIDER, UserRole.DIRECTOR_AREA, UserRole.ASISTENTE)
  async getSentimentTrends(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.dashboardService.getSentimentTrends(req.user.tenantId, filters);
  }

  @Get('trends/risk')
  @ApiOperation({ summary: 'Get risk assessment trends over time' })
  @ApiResponse({ status: 200, description: 'Risk trends retrieved successfully' })
  @ROLES(UserRole.DIRECTOR_COMUNICACION, UserRole.LIDER, UserRole.DIRECTOR_AREA, UserRole.ASISTENTE)
  async getRiskTrends(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.dashboardService.getRiskTrends(req.user.tenantId, filters);
  }

  @Get('entities/top')
  @ApiOperation({ summary: 'Get top mentioned entities and topics' })
  @ApiResponse({ status: 200, description: 'Top entities retrieved successfully' })
  @ROLES(UserRole.DIRECTOR_COMUNICACION, UserRole.LIDER, UserRole.DIRECTOR_AREA, UserRole.ASISTENTE)
  async getTopEntities(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.dashboardService.getTopEntities(req.user.tenantId, filters);
  }

  @Get('sources/metrics')
  @ApiOperation({ summary: 'Get content sources performance metrics' })
  @ApiResponse({ status: 200, description: 'Source metrics retrieved successfully' })
  @ROLES(UserRole.DIRECTOR_COMUNICACION, UserRole.LIDER, UserRole.DIRECTOR_AREA, UserRole.ASISTENTE)
  async getSourceMetrics(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.dashboardService.getSourceMetrics(req.user.tenantId, filters);
  }

  @Get('activity/hourly')
  @ApiOperation({ summary: 'Get content activity by hour of day' })
  @ApiResponse({ status: 200, description: 'Hourly activity retrieved successfully' })
  @ROLES(UserRole.DIRECTOR_COMUNICACION, UserRole.LIDER, UserRole.DIRECTOR_AREA, UserRole.ASISTENTE)
  async getHourlyActivity(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.dashboardService.getActivityByHour(req.user.tenantId, filters);
  }

  @Get('alerts/summary')
  @ApiOperation({ summary: 'Get alerts summary and active alerts count' })
  @ApiResponse({ status: 200, description: 'Alerts summary retrieved successfully' })
  @ROLES(UserRole.DIRECTOR_COMUNICACION, UserRole.LIDER, UserRole.DIRECTOR_AREA, UserRole.ASISTENTE)
  async getAlertsSummary(@Query() filters: DashboardFilters, @Req() req: any) {
    return this.dashboardService.getAlertsSummary(req.user.tenantId, filters);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint for dashboard service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async getHealth() {
    return {
      status: 'ok',
      service: 'dashboard',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Post('advanced/search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Advanced search with filters and full-text search' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ROLES(UserRole.DIRECTOR_COMUNICACION, UserRole.LIDER, UserRole.DIRECTOR_AREA, UserRole.ASISTENTE)
  async advancedSearch(@Body() filters: AdvancedFiltersDto, @Req() req: any) {
    return this.dashboardService.advancedSearch(req.user.tenantId, filters);
  }

  @Get('search/suggestions')
  @ApiOperation({ summary: 'Get search suggestions for autocomplete' })
  @ApiResponse({ status: 200, description: 'Search suggestions retrieved successfully' })
  @ROLES(UserRole.DIRECTOR_COMUNICACION, UserRole.LIDER, UserRole.DIRECTOR_AREA, UserRole.ASISTENTE)
  async getSearchSuggestions(@Query() suggestionsDto: SearchSuggestionsDto, @Req() req: any) {
    return this.dashboardService.getSearchSuggestions(req.user.tenantId, suggestionsDto);
  }

  @Post('filters/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get statistics for current filter selection' })
  @ApiResponse({ status: 200, description: 'Filter statistics retrieved successfully' })
  @ROLES(UserRole.DIRECTOR_COMUNICACION, UserRole.LIDER, UserRole.DIRECTOR_AREA, UserRole.ASISTENTE)
  async getFilterStats(@Body() filters: AdvancedFiltersDto, @Req() req: any) {
    return this.dashboardService.getFilterStats(req.user.tenantId, filters);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export dashboard data with filters' })
  @ApiResponse({ status: 200, description: 'Export generated successfully' })
  @ROLES(UserRole.DIRECTOR_COMUNICACION, UserRole.LIDER)
  async exportData(@Body() exportFilters: ExportFiltersDto, @Req() req: any) {
    return this.dashboardService.exportDashboardData(req.user.tenantId, exportFilters);
  }

  @Get('trends/aggregated')
  @ApiOperation({ summary: 'Get aggregated trends with custom intervals' })
  @ApiResponse({ status: 200, description: 'Aggregated trends retrieved successfully' })
  @ROLES(UserRole.DIRECTOR_COMUNICACION, UserRole.LIDER, UserRole.DIRECTOR_AREA, UserRole.ASISTENTE)
  async getAggregatedTrends(@Query() filters: AdvancedFiltersDto, @Req() req: any) {
    return this.dashboardService.getAggregatedTrends(req.user.tenantId, filters);
  }

  @Get('analytics/comparative')
  @ApiOperation({ summary: 'Get comparative analytics between periods' })
  @ApiResponse({ status: 200, description: 'Comparative analytics retrieved successfully' })
  @ROLES(UserRole.DIRECTOR_COMUNICACION, UserRole.LIDER)
  async getComparativeAnalytics(@Query() filters: AdvancedFiltersDto, @Req() req: any) {
    return this.dashboardService.getComparativeAnalytics(req.user.tenantId, filters);
  }
}
