import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { CreateNewsDto } from './dto/create-news.dto';
import { TweetResponseDto, NewsResponseDto, HealthCheckDto, StatsResponseDto } from './dto/scraper-response.dto';
import { AuditAction, AuditEntityType, QueueType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class ScrapersService {
  private startTime = Date.now();
  private stats = {
    tweetsReceived: 0,
    newsReceived: 0,
    duplicatesBlocked: 0,
    aiJobsCreated: 0,
    responseTimes: [] as number[],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createTweet(createTweetDto: CreateTweetDto): Promise<TweetResponseDto> {
    const startTime = Date.now();
    
    try {
      // Generate content hash for duplicate detection
      const contentHash = this.generateContentHash(
        createTweetDto.content,
        createTweetDto.authorHandle,
        createTweetDto.publishedAt
      );

      // Check for duplicates
      const existingTweet = await this.prisma.tweet.findFirst({
        where: {
          OR: [
            { tweetId: createTweetDto.tweetId },
            { contentHash: contentHash }
          ]
        }
      });

      if (existingTweet) {
        this.stats.duplicatesBlocked++;
        return {
          message: 'Tweet already exists',
          success: true,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          data: {
            id: existingTweet.id,
            tweetId: existingTweet.tweetId,
            contentHash: existingTweet.contentHash,
            isDuplicate: true,
          }
        };
      }

      // Verify media source exists
      const mediaSource = await this.prisma.mediaSource.findUnique({
        where: { id: createTweetDto.mediaSourceId }
      });

      if (!mediaSource) {
        throw new BadRequestException(`Media source ${createTweetDto.mediaSourceId} not found`);
      }

      // Create tweet with transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create tweet
        const tweet = await tx.tweet.create({
          data: {
            id: crypto.randomUUID(),
            tenantId: createTweetDto.tenantId,
            tweetId: createTweetDto.tweetId,
            mediaSourceId: createTweetDto.mediaSourceId,
            authorName: createTweetDto.authorName,
            authorHandle: createTweetDto.authorHandle,
            content: createTweetDto.content,
            publishedAt: new Date(createTweetDto.publishedAt),
            hashtags: createTweetDto.hashtags || [],
            mentions: createTweetDto.mentions || [],
            mediaUrls: createTweetDto.mediaUrls ? JSON.parse(JSON.stringify(createTweetDto.mediaUrls)) : {},
            engagement: createTweetDto.engagement ? JSON.parse(JSON.stringify(createTweetDto.engagement)) : {},
            contentHash: contentHash,
            createdAt: new Date(),
          }
        });

        // Create AI processing job
        const aiJob = await tx.aiProcessingQueue.create({
          data: {
            id: crypto.randomUUID(),
            tenantId: createTweetDto.tenantId,
            tweetId: tweet.id,
            queueType: createTweetDto.mediaUrls && createTweetDto.mediaUrls.length > 0 
              ? QueueType.NEWS_ANALYSIS 
              : QueueType.TWEET_ANALYSIS,
            priority: 5,
            status: 'PENDING',
            scheduledAt: new Date(),
            createdAt: new Date(),
          }
        });

        return { tweet, aiJob };
      });

      // Log for audit
      await this.auditService.logAction(
        createTweetDto.tenantId,
        null, // System action
        AuditAction.DATA_ACCESSED,
        AuditEntityType.TWEET,
        result.tweet.id,
        null,
        {
          tweetId: result.tweet.tweetId,
          authorHandle: result.tweet.authorHandle,
          contentHash: result.tweet.contentHash,
        },
        { source: 'scraper', mediaSourceId: createTweetDto.mediaSourceId }
      );

      this.stats.tweetsReceived++;
      this.stats.aiJobsCreated++;
      this.updateResponseTime(Date.now() - startTime);

      return {
        message: 'Tweet created successfully',
        success: true,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        data: {
          id: result.tweet.id,
          tweetId: result.tweet.tweetId,
          contentHash: result.tweet.contentHash,
          aiJobId: result.aiJob.id,
          isDuplicate: false,
        }
      };

    } catch (error) {
      this.updateResponseTime(Date.now() - startTime);
      
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to create tweet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createNews(createNewsDto: CreateNewsDto): Promise<NewsResponseDto> {
    const startTime = Date.now();
    
    try {
      // Generate content hash for duplicate detection
      const contentHash = this.generateContentHash(
        createNewsDto.content || '',
        createNewsDto.url || '',
        createNewsDto.extractedAt
      );

      // Check if tweet exists
      const tweet = await this.prisma.tweet.findUnique({
        where: { id: createNewsDto.tweetId }
      });

      if (!tweet) {
        throw new NotFoundException(`Tweet ${createNewsDto.tweetId} not found`);
      }

      // Check for duplicates
      const existingNews = await this.prisma.news.findFirst({
        where: {
          OR: [
            { tweetId: createNewsDto.tweetId },
            { contentHash: contentHash }
          ]
        }
      });

      if (existingNews) {
        this.stats.duplicatesBlocked++;
        return {
          message: 'News already exists',
          success: true,
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          data: {
            id: existingNews.id,
            tweetId: existingNews.tweetId,
            contentHash: existingNews.contentHash,
            isDuplicate: true,
          }
        };
      }

      // Create news with transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create news
        const news = await tx.news.create({
          data: {
            id: crypto.randomUUID(),
            tenantId: createNewsDto.tenantId,
            tweetId: createNewsDto.tweetId,
            mediaSourceId: createNewsDto.mediaSourceId,
            title: createNewsDto.title || null,
            content: createNewsDto.content || null,
            url: createNewsDto.url || null,
            extractedAt: new Date(createNewsDto.extractedAt),
            contentHash: contentHash,
            createdAt: new Date(),
          }
        });

        // Create AI processing job for news analysis
        const aiJob = await tx.aiProcessingQueue.create({
          data: {
            id: crypto.randomUUID(),
            tenantId: createNewsDto.tenantId,
            newsId: news.id,
            queueType: QueueType.NEWS_ANALYSIS,
            priority: 3, // Higher priority for news analysis
            status: 'PENDING',
            scheduledAt: new Date(),
            createdAt: new Date(),
          }
        });

        return { news, aiJob };
      });

      // Log for audit
      await this.auditService.logAction(
        createNewsDto.tenantId,
        null, // System action
        AuditAction.DATA_ACCESSED,
        AuditEntityType.NEWS,
        result.news.id,
        null,
        {
          tweetId: result.news.tweetId,
          title: result.news.title,
          contentHash: result.news.contentHash,
        },
        { source: 'extractor', mediaSourceId: createNewsDto.mediaSourceId }
      );

      this.stats.newsReceived++;
      this.stats.aiJobsCreated++;
      this.updateResponseTime(Date.now() - startTime);

      return {
        message: 'News created successfully',
        success: true,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        data: {
          id: result.news.id,
          tweetId: result.news.tweetId,
          contentHash: result.news.contentHash,
          aiJobId: result.aiJob.id,
          isDuplicate: false,
        }
      };

    } catch (error) {
      this.updateResponseTime(Date.now() - startTime);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to create news: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getHealthCheck(): Promise<HealthCheckDto> {
    const startTime = Date.now();
    
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;
      const uptime = Date.now() - this.startTime;

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime / 1000), // in seconds
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: 'healthy',
        },
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const uptime = Date.now() - this.startTime;

      return {
        status: 'down',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime / 1000),
        version: process.env.npm_package_version || '1.0.0',
        services: {
          database: 'down',
        },
        responseTime,
      };
    }
  }

  async getStats(): Promise<StatsResponseDto> {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.stats.responseTimes.length > 0 
      ? this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length 
      : 0;

    return {
      message: 'Scrapers statistics retrieved successfully',
      timestamp: new Date().toISOString(),
      data: {
        tweetsReceived: this.stats.tweetsReceived,
        newsReceived: this.stats.newsReceived,
        duplicatesBlocked: this.stats.duplicatesBlocked,
        aiJobsCreated: this.stats.aiJobsCreated,
        avgResponseTime: Math.round(avgResponseTime),
        uptime: Math.floor(uptime / 1000),
      }
    };
  }

  private generateContentHash(content: string, identifier: string, timestamp: string): string {
    const data = `${content}|${identifier}|${timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private updateResponseTime(time: number): void {
    this.stats.responseTimes.push(time);
    // Keep only last 100 response times for average calculation
    if (this.stats.responseTimes.length > 100) {
      this.stats.responseTimes.shift();
    }
  }
}
