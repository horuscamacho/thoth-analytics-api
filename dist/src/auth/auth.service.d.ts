import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
export interface IJwtPayload {
    sub: string;
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
export declare class AuthService {
    private readonly jwtService;
    private readonly configService;
    private readonly prismaService;
    constructor(jwtService: JwtService, configService: ConfigService, prismaService: PrismaService);
    hashPassword(password: string): Promise<string>;
    comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean>;
    generateTokenPair(payload: IJwtPayload): ITokenPair;
    validateUser(email: string, password: string, tenantId: string): Promise<{
        id: string;
        email: string;
        username: string;
        role: string;
        tenantId: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    login(email: string, password: string, tenantId: string): Promise<ITokenPair>;
    validateToken(token: string): IJwtPayload;
    validateRefreshToken(refreshToken: string): IJwtPayload;
    refreshTokens(refreshToken: string): Promise<ITokenPair>;
    private parseExpirationTime;
}
