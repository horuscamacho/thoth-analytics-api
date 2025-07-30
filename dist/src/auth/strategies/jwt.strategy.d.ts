import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { IJwtPayload } from '../auth.service';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prismaService;
    constructor(configService: ConfigService, prismaService: PrismaService);
    validate(request: {
        headers: Record<string, string | string[]>;
    }, payload: IJwtPayload): Promise<{
        id: string;
        email: string;
        username: string;
        role: string;
        tenantId: string;
    }>;
}
export {};
