export interface IDashboardMetrics {
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

export interface ISentimentTrend {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  averageScore: number;
}

export interface IRiskDistribution {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  count: number;
  percentage: number;
}

export interface ITopEntities {
  name: string;
  type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'POLITICAL_PARTY';
  mentions: number;
  sentiment: number;
  riskScore: number;
}

export interface ISourceMetrics {
  source: string;
  tweetsCount: number;
  newsCount: number;
  averageSentiment: number;
  averageRisk: number;
  lastActivity: Date;
}

export interface IActivityByHour {
  hour: number;
  tweets: number;
  news: number;
  analysis: number;
}

export interface IAlertsSummary {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface IDashboardData {
  metrics: IDashboardMetrics;
  sentimentTrends: ISentimentTrend[];
  riskDistribution: IRiskDistribution[];
  topEntities: ITopEntities[];
  sourceMetrics: ISourceMetrics[];
  activityByHour: IActivityByHour[];
  alertsSummary: IAlertsSummary;
  generatedAt: Date;
}

export interface IFilteredContent {
  id: string;
  title: string;
  content: string;
  source: string;
  type: 'TWEET' | 'NEWS';
  publishedAt: Date;
  sentiment: number;
  riskScore: number;
  entities: string[];
  categories: string[];
  analysisId?: string | null;
}

export interface IContentSearchResult {
  items: IFilteredContent[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface IExportOptions {
  format: 'PDF' | 'CSV' | 'JSON';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeMetrics: boolean;
  includeTrends: boolean;
  includeContent: boolean;
  contentLimit?: number;
}

export interface IRealtimeUpdate {
  type: 'METRICS' | 'ALERT' | 'CONTENT' | 'ANALYSIS';
  data: any;
  timestamp: Date;
  tenantId: string;
}
