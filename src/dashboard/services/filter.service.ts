import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AdvancedFiltersDto, SearchSuggestionsDto } from '../dto/advanced-filters.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FilterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build Prisma where clause from advanced filters
   */
  buildWhereClause(tenantId: string, filters: AdvancedFiltersDto): any {
    const where: any = {
      tenantId,
    };

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    // Content type filter - use type field instead of contentType
    if (filters.contentTypes && filters.contentTypes.length > 0) {
      const types = filters.contentTypes.map(ct => 
        ct === 'TWEET' ? 'TWEET_ANALYSIS' : 
        ct === 'NEWS' ? 'NEWS_ANALYSIS' : ct
      );
      where.type = { in: types };
    }

    // Sources filter - Note: AiAnalysis doesn't have direct source field
    // This filter would need to be applied through relations if needed
    if (filters.sources && filters.sources.length > 0) {
      // Skip source filter for AiAnalysis since it doesn't have this field
      // Could be implemented through tweet/news relations if needed
    }

    // Sentiment range filter
    if (filters.minSentiment !== undefined || filters.maxSentiment !== undefined) {
      where.sentiment = {};
      if (filters.minSentiment !== undefined) {
        where.sentiment.gte = filters.minSentiment;
      }
      if (filters.maxSentiment !== undefined) {
        where.sentiment.lte = filters.maxSentiment;
      }
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    // Archive filter - Note: AiAnalysis doesn't have archived field
    // This functionality would need to be implemented differently if needed
    if (!filters.includeArchived) {
      // Skip archive filter since AiAnalysis doesn't have this field
      // Could implement through status field or separate archiving mechanism
    }

    return where;
  }

  /**
   * Build alert-specific where clause
   */
  buildAlertWhereClause(tenantId: string, filters: AdvancedFiltersDto): any {
    const where: any = {
      tenantId,
    };

    // Date range filter
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    // Alert severity filter
    if (filters.alertSeverities && filters.alertSeverities.length > 0) {
      where.severity = { in: filters.alertSeverities };
    }

    // Alert status filter
    if (filters.alertStatuses && filters.alertStatuses.length > 0) {
      where.status = { in: filters.alertStatuses };
    }

    // Risk score range filter for alerts
    if (filters.minRisk !== undefined || filters.maxRisk !== undefined) {
      where.threatLevel = {};
      if (filters.minRisk !== undefined) {
        where.threatLevel.gte = filters.minRisk;
      }
      if (filters.maxRisk !== undefined) {
        where.threatLevel.lte = filters.maxRisk;
      }
    }

    return where;
  }

  /**
   * Build orderBy clause from filters
   */
  buildOrderByClause(filters: AdvancedFiltersDto): any {
    if (!filters.sortBy) {
      return { createdAt: 'desc' };
    }

    return {
      [filters.sortBy]: filters.sortOrder || 'desc',
    };
  }

  /**
   * Apply full-text search to content
   */
  async searchContent(
    tenantId: string,
    searchQuery: string,
    contentType?: string[],
  ): Promise<string[]> {
    // Search in tweets
    const tweetResults = contentType && !contentType.includes('TWEET') ? [] : 
      await this.prisma.tweet.findMany({
        where: {
          tenantId,
          content: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
        select: { id: true },
        take: 100,
      });

    // Search in news
    const newsResults = contentType && !contentType.includes('NEWS') ? [] :
      await this.prisma.news.findMany({
        where: {
          tenantId,
          OR: [
            {
              title: {
                contains: searchQuery,
                mode: 'insensitive',
              },
            },
            {
              content: {
                contains: searchQuery,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: { id: true },
        take: 100,
      });

    return [
      ...tweetResults.map(t => t.id),
      ...newsResults.map(n => n.id),
    ];
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(
    tenantId: string,
    suggestionsDto: SearchSuggestionsDto,
  ): Promise<any> {
    const { query, type, limit } = suggestionsDto;
    const suggestions: any = {};

    // Get entity suggestions from tags
    if (type === 'all' || type === 'entities') {
      const analyses = await this.prisma.aiAnalysis.findMany({
        where: {
          tenantId,
          tags: {
            isEmpty: false,
          },
        },
        select: {
          tags: true,
        },
        take: 100,
      });

      const entitySet = new Set<string>();
      analyses.forEach(item => {
        if (Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => {
            if (tag.startsWith('entity:')) {
              const entity = tag.replace('entity:', '');
              if (!query || entity.toLowerCase().includes(query.toLowerCase())) {
                entitySet.add(entity);
              }
            }
          });
        }
      });

      suggestions.entities = Array.from(entitySet).slice(0, limit);
    }

    // Get source suggestions
    if (type === 'all' || type === 'sources') {
      const sources = await this.prisma.$queryRaw<Array<{ source: string }>>`
        SELECT DISTINCT ms.name as source 
        FROM (
          SELECT "mediaSourceId" FROM tweets WHERE "tenantId" = ${tenantId} AND "mediaSourceId" IS NOT NULL
          UNION
          SELECT "mediaSourceId" FROM news WHERE "tenantId" = ${tenantId} AND "mediaSourceId" IS NOT NULL
        ) AS content
        JOIN media_sources ms ON ms.id = content."mediaSourceId"
        WHERE ms.name IS NOT NULL
        ${query ? Prisma.sql`AND LOWER(ms.name) LIKE LOWER(${`%${query}%`})` : Prisma.empty}
        LIMIT ${limit}
      `;

      suggestions.sources = sources.map(s => s.source);
    }

    // Get tag suggestions
    if (type === 'all' || type === 'tags') {
      const analyses = await this.prisma.aiAnalysis.findMany({
        where: {
          tenantId,
          tags: {
            isEmpty: false,
          },
        },
        select: {
          tags: true,
        },
        take: 100,
      });

      const tagSet = new Set<string>();
      analyses.forEach(item => {
        if (Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => {
            if (!query || tag.toLowerCase().includes(query.toLowerCase())) {
              tagSet.add(tag);
            }
          });
        }
      });

      suggestions.tags = Array.from(tagSet).slice(0, limit);
    }

    return suggestions;
  }

  /**
   * Calculate pagination metadata
   */
  calculatePagination(
    total: number,
    page: number = 1,
    limit: number = 20,
  ): {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Group results by specified field
   */
  async groupResults(
    data: any[],
    groupBy: string,
  ): Promise<Record<string, any[]>> {
    const grouped: Record<string, any[]> = {};

    data.forEach(item => {
      const key = item[groupBy] || 'unknown';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });

    return grouped;
  }

  /**
   * Get filter statistics
   */
  async getFilterStats(
    tenantId: string,
    filters: AdvancedFiltersDto,
  ): Promise<any> {
    const baseWhere = this.buildWhereClause(tenantId, filters);

    // Get content type distribution from AI Analysis
    const contentTypes = await this.prisma.aiAnalysis.groupBy({
      by: ['type'],
      where: {
        tenantId,
      },
      _count: true,
    });

    // Get date range from AI Analysis
    const dateRange = await this.prisma.$queryRaw<Array<{
      min_date: Date;
      max_date: Date;
    }>>`
      SELECT 
        MIN("createdAt") as min_date,
        MAX("createdAt") as max_date
      FROM ai_analyses
      WHERE "tenantId" = ${tenantId}
    `;

    // Get sentiment distribution
    const sentimentDist = await this.prisma.aiAnalysis.groupBy({
      by: ['sentiment'],
      where: baseWhere,
      _count: true,
      orderBy: {
        sentiment: 'asc',
      },
    });

    return {
      contentTypes,
      dateRange: dateRange[0],
      sentimentDistribution: sentimentDist,
      totalFiltered: await this.countFilteredResults(tenantId, filters),
    };
  }

  /**
   * Count total results with filters applied
   */
  private async countFilteredResults(
    tenantId: string,
    filters: AdvancedFiltersDto,
  ): Promise<number> {
    const where = this.buildWhereClause(tenantId, filters);
    
    const count = await this.prisma.aiAnalysis.count({ where });
    
    return count;
  }
}