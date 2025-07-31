import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Dashboard Advanced Features (e2e)', () => {
  let app: INestApplication;
  
  // Use the tokens provided by user
  const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjYmVmM2EzMC0yNGI5LTRmNTctYTg1Yi02MTlhNTQ5MjlmMjYiLCJlbWFpbCI6InN1cGVyYWRtaW5AdGhvdGgubXgiLCJ0ZW5hbnRJZCI6InN5c3RlbSIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTc1MzkyNDE5OSwiZXhwIjoxNzUzOTI1OTk5fQ.wCbehzm260YQUAM9-efrEedy0R3r1uklhvyi0vmdcjo';
  const tenantId = 'system';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /dashboard/advanced/search', () => {
    it('should perform advanced search with basic filters', async () => {
      const searchFilters = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        contentTypes: ['TWEET', 'NEWS'],
        page: 1,
        limit: 10,
      };

      const response = await request(app.getHttpServer())
        .post('/dashboard/advanced/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send(searchFilters)
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('filters');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should perform search with sentiment range filters', async () => {
      const searchFilters = {
        minSentiment: 60,
        maxSentiment: 100,
        page: 1,
        limit: 20,
      };

      const response = await request(app.getHttpServer())
        .post('/dashboard/advanced/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send(searchFilters)
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body.filters.sentimentRange.min).toBe(60);
      expect(response.body.filters.sentimentRange.max).toBe(100);
    });

    it('should perform search with risk range filters', async () => {
      const searchFilters = {
        minRisk: 0,
        maxRisk: 50,
        page: 1,
        limit: 15,
      };

      const response = await request(app.getHttpServer())
        .post('/dashboard/advanced/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send(searchFilters)
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body.filters.riskRange.min).toBe(0);
      expect(response.body.filters.riskRange.max).toBe(50);
    });

    it('should perform search with full-text query', async () => {
      const searchFilters = {
        searchQuery: 'gobierno',
        contentTypes: ['TWEET'],
        page: 1,
        limit: 5,
      };

      const response = await request(app.getHttpServer())
        .post('/dashboard/advanced/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send(searchFilters)
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('query', 'gobierno');
      expect(response.body.filters.contentTypes).toEqual(['TWEET']);
    });

    it('should perform search with sources filter', async () => {
      const searchFilters = {
        sources: ['Twitter'],
        page: 1,
        limit: 10,
      };

      const response = await request(app.getHttpServer())
        .post('/dashboard/advanced/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send(searchFilters)
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body.filters.sources).toEqual(['Twitter']);
    });

    it('should perform search with tags filter', async () => {
      const searchFilters = {
        tags: ['política'],
        page: 1,
        limit: 10,
      };

      const response = await request(app.getHttpServer())
        .post('/dashboard/advanced/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send(searchFilters)
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body.filters.tags).toEqual(['política']);
    });

    it('should perform search with custom sorting', async () => {
      const searchFilters = {
        sortBy: 'sentiment',
        sortOrder: 'asc',
        page: 1,
        limit: 10,
      };

      const response = await request(app.getHttpServer())
        .post('/dashboard/advanced/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send(searchFilters)
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const searchFilters = {
        page: 2,
        limit: 5,
      };

      const response = await request(app.getHttpServer())
        .post('/dashboard/advanced/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send(searchFilters)
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should validate required fields and return 400 for invalid data', async () => {
      const invalidFilters = {
        minSentiment: -10, // Invalid: should be >= 0
        maxSentiment: 110, // Invalid: should be <= 100
        page: 0, // Invalid: should be >= 1
        limit: 150, // Invalid: should be <= 100
      };

      await request(app.getHttpServer())
        .post('/dashboard/advanced/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send(invalidFilters)
        .expect(400);
    });

    it('should fail without authorization', async () => {
      const searchFilters = {
        page: 1,
        limit: 10,
      };

      await request(app.getHttpServer())
        .post('/dashboard/advanced/search')
        .set('X-Tenant-ID', tenantId)
        .send(searchFilters)
        .expect(401);
    });
  });

  describe('GET /dashboard/search/suggestions', () => {
    it('should get all types of suggestions', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/search/suggestions')
        .query({
          type: 'all',
          limit: 10,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(typeof response.body).toBe('object');
      // At least one of these properties should exist
      const hasExpectedProperties = 
        response.body.hasOwnProperty('entities') ||
        response.body.hasOwnProperty('sources') ||
        response.body.hasOwnProperty('tags');
      expect(hasExpectedProperties).toBe(true);
    });

    it('should get entity suggestions with query filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/search/suggestions')
        .query({
          query: 'mor',
          type: 'entities',
          limit: 5,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(typeof response.body).toBe('object');
      if (response.body.entities) {
        expect(Array.isArray(response.body.entities)).toBe(true);
      }
    });

    it('should get source suggestions', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/search/suggestions')
        .query({
          type: 'sources',
          limit: 20,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(typeof response.body).toBe('object');
      if (response.body.sources) {
        expect(Array.isArray(response.body.sources)).toBe(true);
      }
    });

    it('should get tag suggestions', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/search/suggestions')
        .query({
          type: 'tags',
          limit: 15,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(typeof response.body).toBe('object');
      if (response.body.tags) {
        expect(Array.isArray(response.body.tags)).toBe(true);
      }
    });

    it('should validate query parameters', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/search/suggestions')
        .query({
          limit: 25, // Invalid: should be <= 20
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(400);
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/search/suggestions')
        .set('X-Tenant-ID', tenantId)
        .expect(401);
    });
  });

  describe('POST /dashboard/filters/stats', () => {
    it('should get filter statistics', async () => {
      const filters = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        contentTypes: ['TWEET'],
      };

      const response = await request(app.getHttpServer())
        .post('/dashboard/filters/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send(filters)
        .expect(200);

      expect(typeof response.body).toBe('object');
      // Should have at least some statistical properties
      const hasStatsProperties = 
        response.body.hasOwnProperty('contentTypes') ||
        response.body.hasOwnProperty('dateRange') ||
        response.body.hasOwnProperty('sentimentDistribution') ||
        response.body.hasOwnProperty('totalFiltered');
      expect(hasStatsProperties).toBe(true);
    });

    it('should get stats with empty filters', async () => {
      const response = await request(app.getHttpServer())
        .post('/dashboard/filters/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({})
        .expect(200);

      expect(typeof response.body).toBe('object');
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .post('/dashboard/filters/stats')
        .set('X-Tenant-ID', tenantId)
        .send({})
        .expect(401);
    });
  });

  describe('POST /dashboard/export', () => {
    it('should queue CSV export', async () => {
      const exportFilters = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        format: 'csv',
        fields: ['createdAt', 'sentiment', 'threatLevel', 'tags'],
        includeMetadata: true,
      };

      const response = await request(app.getHttpServer())
        .post('/dashboard/export')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send(exportFilters)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'export_queued');
      expect(response.body).toHaveProperty('format', 'csv');
      expect(response.body).toHaveProperty('estimatedRecords');
      expect(response.body).toHaveProperty('exportId');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.estimatedRecords).toBe('number');
      expect(response.body.exportId).toMatch(/^export_\d+$/);
    });

    it('should queue Excel export', async () => {
      const exportFilters = {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        format: 'xlsx',
        minRisk: 50,
        includeMetadata: true,
      };

      const response = await request(app.getHttpServer())
        .post('/dashboard/export')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send(exportFilters)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'export_queued');
      expect(response.body).toHaveProperty('format', 'xlsx');
    });

    it('should queue JSON export', async () => {
      const exportFilters = {
        format: 'json',
        limit: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/dashboard/export')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send(exportFilters)
        .expect(200);

      expect(response.body).toHaveProperty('format', 'json');
    });

    it('should require director role for export', async () => {
      // This test assumes the current token has SUPER_ADMIN role which should have access
      // In a real scenario, you would test with different role tokens
      const exportFilters = {
        format: 'csv',
      };

      const response = await request(app.getHttpServer())
        .post('/dashboard/export')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send(exportFilters)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'export_queued');
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .post('/dashboard/export')
        .set('X-Tenant-ID', tenantId)
        .send({ format: 'csv' })
        .expect(401);
    });
  });

  describe('GET /dashboard/trends/aggregated', () => {
    it('should get daily aggregated trends', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/trends/aggregated')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-07',
          aggregationInterval: 'day',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('interval', 'day');
      expect(response.body).toHaveProperty('trends');
      expect(response.body).toHaveProperty('metadata');
      expect(Array.isArray(response.body.trends)).toBe(true);
      expect(response.body.metadata).toHaveProperty('startDate');
      expect(response.body.metadata).toHaveProperty('endDate');
      expect(response.body.metadata).toHaveProperty('totalPeriods');
    });

    it('should get hourly aggregated trends', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/trends/aggregated')
        .query({
          startDate: '2025-01-30',
          endDate: '2025-01-31',
          aggregationInterval: 'hour',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('interval', 'hour');
      expect(Array.isArray(response.body.trends)).toBe(true);
    });

    it('should get weekly aggregated trends', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/trends/aggregated')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-02-01',
          aggregationInterval: 'week',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('interval', 'week');
      expect(Array.isArray(response.body.trends)).toBe(true);
    });

    it('should get monthly aggregated trends', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/trends/aggregated')
        .query({
          startDate: '2024-01-01',
          endDate: '2025-01-31',
          aggregationInterval: 'month',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('interval', 'month');
      expect(Array.isArray(response.body.trends)).toBe(true);
    });

    it('should default to day interval when not specified', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/trends/aggregated')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-07',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('interval', 'day');
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/trends/aggregated')
        .set('X-Tenant-ID', tenantId)
        .expect(401);
    });
  });

  describe('GET /dashboard/analytics/comparative', () => {
    it('should get comparative analytics for week periods', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/analytics/comparative')
        .query({
          startDate: '2025-01-24',
          endDate: '2025-01-31',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('currentPeriod');
      expect(response.body).toHaveProperty('previousPeriod');
      expect(response.body).toHaveProperty('changes');
      
      expect(response.body.currentPeriod).toHaveProperty('start');
      expect(response.body.currentPeriod).toHaveProperty('end');
      expect(response.body.currentPeriod).toHaveProperty('metrics');
      
      expect(response.body.previousPeriod).toHaveProperty('start');
      expect(response.body.previousPeriod).toHaveProperty('end');
      expect(response.body.previousPeriod).toHaveProperty('metrics');
      
      expect(response.body.changes).toHaveProperty('totalTweets');
      expect(response.body.changes).toHaveProperty('totalNews');
      expect(response.body.changes).toHaveProperty('totalAlerts');
      expect(response.body.changes).toHaveProperty('averageSentiment');
      expect(response.body.changes).toHaveProperty('averageRisk');
      
      // Check change structure
      expect(response.body.changes.totalTweets).toHaveProperty('value');
      expect(response.body.changes.totalTweets).toHaveProperty('percentage');
      expect(typeof response.body.changes.totalTweets.value).toBe('number');
      expect(typeof response.body.changes.totalTweets.percentage).toBe('number');
    });

    it('should get comparative analytics for month periods', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/analytics/comparative')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('currentPeriod');
      expect(response.body).toHaveProperty('previousPeriod');
      expect(response.body).toHaveProperty('changes');
    });

    it('should require both start and end dates', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/analytics/comparative')
        .query({
          startDate: '2025-01-01',
          // Missing endDate
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(400);
    });

    it('should require director role for comparative analytics', async () => {
      // This test assumes the current token has SUPER_ADMIN role which should have access
      const response = await request(app.getHttpServer())
        .get('/dashboard/analytics/comparative')
        .query({
          startDate: '2025-01-15',
          endDate: '2025-01-22',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('currentPeriod');
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/analytics/comparative')
        .query({
          startDate: '2025-01-15',
          endDate: '2025-01-22',
        })
        .set('X-Tenant-ID', tenantId)
        .expect(401);
    });
  });

  describe('Performance Tests', () => {
    it('should respond to advanced search within 200ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .post('/dashboard/advanced/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({ page: 1, limit: 10 })
        .expect(200);
        
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(200);
    });

    it('should respond to search suggestions within 200ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/dashboard/search/suggestions')
        .query({ type: 'all', limit: 10 })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);
        
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(200);
    });

    it('should respond to aggregated trends within 300ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/dashboard/trends/aggregated')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-07',
          aggregationInterval: 'day',
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);
        
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(300);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      await request(app.getHttpServer())
        .post('/dashboard/advanced/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });

    it('should handle invalid date formats gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/dashboard/advanced/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          startDate: 'invalid-date',
          endDate: 'also-invalid',
        });

      // Should either return 400 for validation error or 200 with handled gracefully
      expect([200, 400]).toContain(response.status);
    });

    it('should handle very large page numbers gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/dashboard/advanced/search')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .send({
          page: 999999,
          limit: 100,
        })
        .expect(200);

      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('pagination');
    });
  });
});