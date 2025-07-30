import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ScrapersService } from './scrapers.service';
import { CreateTweetDto } from './dto/create-tweet.dto';
import { CreateNewsDto } from './dto/create-news.dto';
import { TweetResponseDto, NewsResponseDto, HealthCheckDto, StatsResponseDto } from './dto/scraper-response.dto';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

// Configuración de throttling basada en variables de entorno
const THROTTLING_ENABLED = process.env.THROTTLING_ENABLED !== 'false'; // Por defecto habilitado
const TWEETS_TTL = parseInt(process.env.THROTTLING_TWEETS_TTL || '60'); // 60 seconds
const TWEETS_LIMIT = parseInt(process.env.THROTTLING_TWEETS_LIMIT || '100'); // 100 requests
const NEWS_TTL = parseInt(process.env.THROTTLING_NEWS_TTL || '60'); // 60 seconds  
const NEWS_LIMIT = parseInt(process.env.THROTTLING_NEWS_LIMIT || '50'); // 50 requests

@Controller('scrapers')
export class ScrapersController {
  constructor(private readonly scrapersService: ScrapersService) {}

  @Post('tweets')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(THROTTLING_ENABLED ? ThrottlerGuard : class {})
  @Throttle({ default: { ttl: TWEETS_TTL * 1000, limit: TWEETS_LIMIT } })
  async createTweet(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) createTweetDto: CreateTweetDto,
  ): Promise<TweetResponseDto> {
    return await this.scrapersService.createTweet(createTweetDto);
  }

  @Post('news')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(THROTTLING_ENABLED ? ThrottlerGuard : class {})
  @Throttle({ default: { ttl: NEWS_TTL * 1000, limit: NEWS_LIMIT } })
  async createNews(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) createNewsDto: CreateNewsDto,
  ): Promise<NewsResponseDto> {
    return await this.scrapersService.createNews(createNewsDto);
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async getHealthCheck(): Promise<HealthCheckDto> {
    return await this.scrapersService.getHealthCheck();
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @UseGuards(THROTTLING_ENABLED ? ThrottlerGuard : class {})
  @Throttle({ default: { ttl: 60 * 1000, limit: 10 } }) // 10 requests per minute for stats
  async getStats(): Promise<StatsResponseDto> {
    return await this.scrapersService.getStats();
  }
}
