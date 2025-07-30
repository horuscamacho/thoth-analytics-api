export class ScraperResponseDto {
  message!: string;
  data?: any;
  success!: boolean;
  timestamp!: string;
  processingTime?: number;
}

export class TweetResponseDto extends ScraperResponseDto {
  data!: {
    id: string;
    tweetId: string;
    contentHash: string;
    aiJobId?: string;
    isDuplicate: boolean;
  };
}

export class NewsResponseDto extends ScraperResponseDto {
  data!: {
    id: string;
    tweetId: string;
    contentHash: string;
    aiJobId?: string;
    isDuplicate: boolean;
  };
}

export class HealthCheckDto {
  status!: 'healthy' | 'degraded' | 'down';
  timestamp!: string;
  uptime!: number;
  version!: string;
  services!: {
    database: 'healthy' | 'down';
    redis?: 'healthy' | 'down';
  };
  responseTime!: number;
}

export class StatsResponseDto {
  message!: string;
  data!: {
    tweetsReceived: number;
    newsReceived: number;
    duplicatesBlocked: number;
    aiJobsCreated: number;
    avgResponseTime: number;
    uptime: number;
  };
  timestamp!: string;
}