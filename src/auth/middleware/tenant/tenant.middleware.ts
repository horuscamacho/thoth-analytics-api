import { BadRequestException, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

interface IRequestWithTenant extends Request {
  tenantId?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: IRequestWithTenant, _res: Response, next: NextFunction): void {
    const tenantIdHeader = req.headers['x-tenant-id'];
    const tenantId = Array.isArray(tenantIdHeader) ? tenantIdHeader[0] : tenantIdHeader;

    if (typeof tenantId !== 'string' || tenantId.trim() === '') {
      throw new BadRequestException('X-Tenant-ID header is required');
    }

    // Attach tenant ID to request for use in services
    req.tenantId = tenantId;

    next();
  }
}
