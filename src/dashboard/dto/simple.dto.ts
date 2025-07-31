export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  contentType?: 'TWEET' | 'NEWS' | 'ALL';
  sources?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface DashboardMetrics {
  totalTweets: number;
  totalNews: number;
  totalAnalysis: number;
  totalAlerts: number;
  activeAlerts: number;
  averageRiskScore: number;
  averageSentimentScore: number;
  processingQueueSize: number;
  lastUpdate: Date;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  sentimentTrends: any[];
  riskDistribution: any[];
  topEntities: any[];
  sourceMetrics: any[];
  activityByHour: any[];
  alertsSummary: any;
  generatedAt: Date;
}
