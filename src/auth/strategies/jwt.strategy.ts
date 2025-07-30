import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { IJwtPayload } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (typeof secret !== 'string' || secret.trim() === '') {
      throw new Error('JWT_SECRET is required');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(
    request: { headers: Record<string, string | string[]> },
    payload: IJwtPayload,
  ): Promise<{ id: string; email: string; username: string; role: string; tenantId: string }> {
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    if (user.tenantId !== payload.tenantId) {
      throw new UnauthorizedException('Tenant mismatch');
    }

    // Validate tenant header matches user's tenant
    const tenantHeader = request.headers['x-tenant-id'];
    const requestTenantId = Array.isArray(tenantHeader) ? tenantHeader[0] : tenantHeader;

    if (
      typeof requestTenantId === 'string' &&
      requestTenantId.trim() !== '' &&
      user.tenantId !== requestTenantId
    ) {
      throw new UnauthorizedException('Tenant header mismatch');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      tenantId: user.tenantId,
    };
  }
}
