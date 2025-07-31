import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('DashboardController (e2e)', () => {
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

  describe('GET /dashboard/overview', () => {
    it('should return dashboard overview data', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/overview')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveProperty('totalTweets');
      expect(response.body.metrics).toHaveProperty('totalNews');
      expect(response.body.metrics).toHaveProperty('totalAnalysis');
      expect(response.body.metrics).toHaveProperty('totalAlerts');
      expect(response.body.metrics).toHaveProperty('activeAlerts');
      expect(response.body.metrics).toHaveProperty('averageRiskScore');
      expect(response.body.metrics).toHaveProperty('averageSentimentScore');
      expect(response.body.metrics).toHaveProperty('processingQueueSize');
      expect(response.body.metrics).toHaveProperty('lastUpdate');
      
      expect(response.body).toHaveProperty('sentimentTrends');
      expect(response.body).toHaveProperty('riskDistribution');
      expect(response.body).toHaveProperty('topEntities');
      expect(response.body).toHaveProperty('sourceMetrics');
      expect(response.body).toHaveProperty('activityByHour');
      expect(response.body).toHaveProperty('alertsSummary');
      expect(response.body).toHaveProperty('generatedAt');
      
      expect(Array.isArray(response.body.sentimentTrends)).toBe(true);
      expect(Array.isArray(response.body.riskDistribution)).toBe(true);
      expect(Array.isArray(response.body.topEntities)).toBe(true);
      expect(Array.isArray(response.body.sourceMetrics)).toBe(true);
      expect(Array.isArray(response.body.activityByHour)).toBe(true);
    });

    it('should return dashboard overview with date filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/overview')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-31'
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('generatedAt');
    });

    it('should return dashboard overview with content type filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/overview')
        .query({
          contentType: 'TWEET'
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/overview')
        .set('X-Tenant-ID', tenantId)
        .expect(401);
    });

    it('should return data without tenant header for SUPER_ADMIN', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/overview')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
      
      // SUPER_ADMIN with tenantId 'system' doesn't require tenant header
      expect(response.body).toHaveProperty('metrics');
    });
  });

  describe('GET /dashboard/metrics', () => {
    it('should return dashboard metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/metrics')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('totalTweets');
      expect(response.body).toHaveProperty('totalNews');
      expect(response.body).toHaveProperty('totalAnalysis');
      expect(response.body).toHaveProperty('totalAlerts');
      expect(response.body).toHaveProperty('activeAlerts');
      expect(response.body).toHaveProperty('averageRiskScore');
      expect(response.body).toHaveProperty('averageSentimentScore');
      expect(response.body).toHaveProperty('processingQueueSize');
      expect(response.body).toHaveProperty('lastUpdate');
      
      expect(typeof response.body.totalTweets).toBe('number');
      expect(typeof response.body.totalNews).toBe('number');
      expect(typeof response.body.totalAnalysis).toBe('number');
      expect(typeof response.body.totalAlerts).toBe('number');
      expect(typeof response.body.activeAlerts).toBe('number');
      expect(typeof response.body.averageRiskScore).toBe('number');
      expect(typeof response.body.averageSentimentScore).toBe('number');
      expect(typeof response.body.processingQueueSize).toBe('number');
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/metrics')
        .set('X-Tenant-ID', tenantId)
        .expect(401);
    });
  });

  describe('GET /dashboard/trends/sentiment', () => {
    it('should return sentiment trends', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/trends/sentiment')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('date');
        expect(response.body[0]).toHaveProperty('sentiment');
        expect(response.body[0]).toHaveProperty('count');
      }
    });

    it('should return sentiment trends with date filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/trends/sentiment')
        .query({
          startDate: '2025-01-01',
          endDate: '2025-01-07'
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/trends/sentiment')
        .set('X-Tenant-ID', tenantId)
        .expect(401);
    });
  });

  describe('GET /dashboard/trends/risk', () => {
    it('should return risk trends', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/trends/risk')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('date');
        expect(response.body[0]).toHaveProperty('riskScore');
        expect(response.body[0]).toHaveProperty('count');
      }
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/trends/risk')
        .set('X-Tenant-ID', tenantId)
        .expect(401);
    });
  });

  describe('GET /dashboard/entities/top', () => {
    it('should return top entities', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/entities/top')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('count');
        expect(response.body[0]).toHaveProperty('type');
      }
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/entities/top')
        .set('X-Tenant-ID', tenantId)
        .expect(401);
    });
  });

  describe('GET /dashboard/sources/metrics', () => {
    it('should return source metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/sources/metrics')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('source');
        expect(response.body[0]).toHaveProperty('count');
        expect(response.body[0]).toHaveProperty('type');
      }
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/sources/metrics')
        .set('X-Tenant-ID', tenantId)
        .expect(401);
    });
  });

  describe('GET /dashboard/activity/hourly', () => {
    it('should return hourly activity data', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/activity/hourly')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(24);
      
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('hour');
        expect(response.body[0]).toHaveProperty('tweets');
        expect(response.body[0]).toHaveProperty('news');
        expect(response.body[0]).toHaveProperty('total');
        expect(typeof response.body[0].hour).toBe('number');
        expect(response.body[0].hour).toBeGreaterThanOrEqual(0);
        expect(response.body[0].hour).toBeLessThan(24);
      }
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/activity/hourly')
        .set('X-Tenant-ID', tenantId)
        .expect(401);
    });
  });

  describe('GET /dashboard/alerts/summary', () => {
    it('should return alerts summary', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/alerts/summary')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(typeof response.body).toBe('object');
      
      // Check for expected properties
      if (Object.keys(response.body).length > 0) {
        // At least some of these properties should exist
        const expectedProperties = ['total', 'unread', 'read', 'archived', 'critical', 'high', 'medium', 'low'];
        const hasExpectedProperties = expectedProperties.some(prop => response.body.hasOwnProperty(prop));
        expect(hasExpectedProperties).toBe(true);
      }
    });

    it('should fail without authorization', async () => {
      await request(app.getHttpServer())
        .get('/dashboard/alerts/summary')
        .set('X-Tenant-ID', tenantId)
        .expect(401);
    });
  });

  describe('GET /dashboard/health', () => {
    it('should return health status with authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/health')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'dashboard');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version', '1.0.0');
      
      // Verify timestamp is a valid ISO string
      expect(() => new Date(response.body.timestamp)).not.toThrow();
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    });
  });

  describe('Performance Tests', () => {
    it('should respond to overview endpoint within 200ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/dashboard/overview')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);
        
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(200);
    });

    it('should respond to metrics endpoint within 200ms', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/dashboard/metrics')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);
        
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid query parameters gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/overview')
        .query({
          startDate: 'invalid-date',
          contentType: 'INVALID_TYPE'
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId);

      // Should either return 400 for validation error or 200 with data (if service handles gracefully)
      expect([200, 400]).toContain(response.status);
    });

    it('should handle large page numbers gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/overview')
        .query({
          page: 999999,
          limit: 1000
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
    });
  });

  describe('Authorization Roles', () => {
    it('should allow SUPER_ADMIN access to all endpoints', async () => {
      // Test multiple endpoints with SUPER_ADMIN token
      const endpoints = [
        '/dashboard/overview',
        '/dashboard/metrics',
        '/dashboard/trends/sentiment',
        '/dashboard/trends/risk',
        '/dashboard/entities/top',
        '/dashboard/sources/metrics',
        '/dashboard/activity/hourly',
        '/dashboard/alerts/summary'
      ];

      for (const endpoint of endpoints) {
        await request(app.getHttpServer())
          .get(endpoint)
          .set('Authorization', `Bearer ${accessToken}`)
          .set('X-Tenant-ID', tenantId)
          .expect(200);
      }
    });
  });

  describe('Data Validation', () => {
    it('should return consistent data types in overview response', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/overview')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      const { metrics } = response.body;
      
      expect(typeof metrics.totalTweets).toBe('number');
      expect(typeof metrics.totalNews).toBe('number');
      expect(typeof metrics.totalAnalysis).toBe('number');
      expect(typeof metrics.totalAlerts).toBe('number');
      expect(typeof metrics.activeAlerts).toBe('number');
      expect(typeof metrics.averageRiskScore).toBe('number');
      expect(typeof metrics.averageSentimentScore).toBe('number');
      expect(typeof metrics.processingQueueSize).toBe('number');
      
      // Verify score ranges
      expect(metrics.averageRiskScore).toBeGreaterThanOrEqual(0);
      expect(metrics.averageRiskScore).toBeLessThanOrEqual(100);
      expect(metrics.averageSentimentScore).toBeGreaterThanOrEqual(0);
      expect(metrics.averageSentimentScore).toBeLessThanOrEqual(100);
    });

    it('should return valid hourly activity structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard/activity/hourly')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-ID', tenantId)
        .expect(200);

      expect(response.body).toHaveLength(24);
      
      response.body.forEach((hourData: any, index: number) => {
        expect(hourData.hour).toBe(index);
        expect(typeof hourData.tweets).toBe('number');
        expect(typeof hourData.news).toBe('number');
        expect(typeof hourData.total).toBe('number');
        expect(hourData.tweets).toBeGreaterThanOrEqual(0);
        expect(hourData.news).toBeGreaterThanOrEqual(0);
        expect(hourData.total).toBeGreaterThanOrEqual(0);
      });
    });
  });
});