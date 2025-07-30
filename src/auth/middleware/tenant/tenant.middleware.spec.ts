import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TenantMiddleware } from './tenant.middleware';

interface IRequestWithTenant extends Request {
  tenantId?: string;
}

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let mockRequest: Partial<IRequestWithTenant>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TenantMiddleware],
    }).compile();

    middleware = module.get<TenantMiddleware>(TenantMiddleware);

    mockRequest = {
      headers: {},
    };

    mockResponse = {};

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('use', () => {
    it('should extract tenant ID from headers and attach to request', () => {
      const tenantId = 'tenant-123';
      mockRequest.headers = {
        'x-tenant-id': tenantId,
      };

      middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);

      expect(mockRequest.tenantId).toBe(tenantId);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle tenant ID as string when passed as array', () => {
      const tenantId = 'tenant-456';
      mockRequest.headers = {
        'x-tenant-id': [tenantId], // Express can return headers as arrays
      };

      middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);

      expect(mockRequest.tenantId).toBe(tenantId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when tenant ID header is missing', () => {
      mockRequest.headers = {};

      expect(() => {
        middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);
      }).toThrow(BadRequestException);

      expect(() => {
        middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);
      }).toThrow('X-Tenant-ID header is required');

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when tenant ID header is empty string', () => {
      mockRequest.headers = {
        'x-tenant-id': '',
      };

      expect(() => {
        middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);
      }).toThrow(BadRequestException);

      expect(() => {
        middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);
      }).toThrow('X-Tenant-ID header is required');

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when tenant ID header is null', () => {
      mockRequest.headers = {
        'x-tenant-id': null as any,
      };

      expect(() => {
        middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);
      }).toThrow(BadRequestException);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when tenant ID header is undefined', () => {
      mockRequest.headers = {
        'x-tenant-id': undefined as any,
      };

      expect(() => {
        middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);
      }).toThrow(BadRequestException);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle different header casing variations', () => {
      const tenantId = 'tenant-789';

      // Test lowercase (should work since Express normalizes headers)
      mockRequest.headers = {
        'x-tenant-id': tenantId,
      };

      middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);

      expect(mockRequest.tenantId).toBe(tenantId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should work with UUID-style tenant IDs', () => {
      const tenantId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      mockRequest.headers = {
        'x-tenant-id': tenantId,
      };

      middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);

      expect(mockRequest.tenantId).toBe(tenantId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should work with short tenant IDs', () => {
      const tenantId = '1';
      mockRequest.headers = {
        'x-tenant-id': tenantId,
      };

      middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);

      expect(mockRequest.tenantId).toBe(tenantId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should work with long tenant IDs', () => {
      const tenantId = 'very-long-tenant-id-with-many-characters-and-dashes-123456789';
      mockRequest.headers = {
        'x-tenant-id': tenantId,
      };

      middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);

      expect(mockRequest.tenantId).toBe(tenantId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should work with alphanumeric tenant IDs', () => {
      const tenantId = 'abc123XYZ789';
      mockRequest.headers = {
        'x-tenant-id': tenantId,
      };

      middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);

      expect(mockRequest.tenantId).toBe(tenantId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should preserve other request properties', () => {
      const tenantId = 'tenant-preserve';
      mockRequest.headers = {
        'x-tenant-id': tenantId,
        authorization: 'Bearer token123',
        'content-type': 'application/json',
      };
      mockRequest.body = { data: 'test' };
      mockRequest.params = { id: '123' };
      mockRequest.query = { filter: 'active' };

      middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);

      expect(mockRequest.tenantId).toBe(tenantId);
      expect(mockRequest.headers.authorization).toBe('Bearer token123');
      expect(mockRequest.headers['content-type']).toBe('application/json');
      expect(mockRequest.body).toEqual({ data: 'test' });
      expect(mockRequest.params).toEqual({ id: '123' });
      expect(mockRequest.query).toEqual({ filter: 'active' });
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should not modify response object', () => {
      const tenantId = 'tenant-response';
      mockRequest.headers = {
        'x-tenant-id': tenantId,
      };

      const originalResponse = { ...mockResponse };

      middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);

      expect(mockResponse).toEqual(originalResponse);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle special characters in tenant ID', () => {
      const tenantId = 'tenant_123-ABC.test';
      mockRequest.headers = {
        'x-tenant-id': tenantId,
      };

      middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);

      expect(mockRequest.tenantId).toBe(tenantId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should handle whitespace in tenant ID', () => {
      const tenantId = ' tenant-with-spaces ';
      mockRequest.headers = {
        'x-tenant-id': tenantId,
      };

      middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);

      // Should preserve the original value (including whitespace)
      expect(mockRequest.tenantId).toBe(tenantId);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should be case-sensitive for tenant ID values', () => {
      const tenantId = 'TenantID123';
      mockRequest.headers = {
        'x-tenant-id': tenantId,
      };

      middleware.use(mockRequest as IRequestWithTenant, mockResponse as Response, mockNext);

      expect(mockRequest.tenantId).toBe(tenantId);
      expect(mockRequest.tenantId).not.toBe('tenantid123');
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
