import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
interface IRequestWithTenant extends Request {
    tenantId?: string;
}
export declare class TenantMiddleware implements NestMiddleware {
    use(req: IRequestWithTenant, _res: Response, next: NextFunction): void;
}
export {};
