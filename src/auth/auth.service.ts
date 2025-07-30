import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';

export interface IJwtPayload {
  sub: string; // User ID
  email: string;
  tenantId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
    return bcrypt.hash(password, saltRounds);
  }

  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  generateTokenPair(payload: IJwtPayload): ITokenPair {
    const accessTokenExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '30m');
    const refreshTokenExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (typeof refreshSecret !== 'string' || refreshSecret.trim() === '') {
      throw new Error('JWT_REFRESH_SECRET is required');
    }

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshTokenExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpirationTime(accessTokenExpiresIn),
    };
  }

  async validateUser(
    email: string,
    password: string,
    tenantId: string,
  ): Promise<{
    id: string;
    email: string;
    username: string;
    role: string;
    tenantId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }> {
    // For super admin, tenantId validation is not required
    const whereClause: any = {
      email,
      status: 'ACTIVE',
    };

    // Check if this is a super admin first
    const potentialSuperAdmin = await this.prismaService.user.findFirst({
      where: { email, role: 'SUPER_ADMIN', status: 'ACTIVE' },
    });

    // Only add tenantId filter for non-super admin users
    if (!potentialSuperAdmin) {
      whereClause.tenantId = tenantId;
    }

    const user = await this.prismaService.user.findFirst({
      where: whereClause,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        tenantId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.password === null || user.password === undefined || user.password === '') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePasswords(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: userPassword, ...result } = user;
    void userPassword; // Acknowledge unused variable
    
    // For super admin, use 'system' as tenantId in tokens
    return {
      ...result,
      tenantId: result.tenantId || 'system',
    };
  }

  async login(email: string, password: string, tenantId: string): Promise<ITokenPair> {
    const user = await this.validateUser(email, password, tenantId);

    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    return this.generateTokenPair(payload);
  }

  validateToken(token: string): IJwtPayload {
    try {
      return this.jwtService.verify<IJwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  validateRefreshToken(refreshToken: string): IJwtPayload {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (typeof refreshSecret !== 'string' || refreshSecret.trim() === '') {
      throw new UnauthorizedException('JWT_REFRESH_SECRET is not configured');
    }

    try {
      return this.jwtService.verify<IJwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async refreshTokens(refreshToken: string): Promise<ITokenPair> {
    const payload = this.validateRefreshToken(refreshToken);

    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    const newPayload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId || 'system',
      role: user.role,
    };

    return this.generateTokenPair(newPayload);
  }

  private parseExpirationTime(expiration: string): number {
    const timeValue = parseInt(expiration.slice(0, -1));
    const timeUnit = expiration.slice(-1);

    if (isNaN(timeValue)) {
      return 1800; // Default 30 minutes
    }

    switch (timeUnit) {
      case 's':
        return timeValue;
      case 'm':
        return timeValue * 60;
      case 'h':
        return timeValue * 60 * 60;
      case 'd':
        return timeValue * 60 * 60 * 24;
      default:
        return 1800; // Default 30 minutes
    }
  }
}
