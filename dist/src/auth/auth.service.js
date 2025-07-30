"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const prisma_service_1 = require("../database/prisma.service");
let AuthService = class AuthService {
    constructor(jwtService, configService, prismaService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.prismaService = prismaService;
    }
    async hashPassword(password) {
        const saltRounds = this.configService.get('BCRYPT_SALT_ROUNDS', 12);
        return bcrypt.hash(password, saltRounds);
    }
    async comparePasswords(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
    generateTokenPair(payload) {
        const accessTokenExpiresIn = this.configService.get('JWT_EXPIRES_IN', '30m');
        const refreshTokenExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
        const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
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
    async validateUser(email, password, tenantId) {
        const whereClause = {
            email,
            status: 'ACTIVE',
        };
        const potentialSuperAdmin = await this.prismaService.user.findFirst({
            where: { email, role: 'SUPER_ADMIN', status: 'ACTIVE' },
        });
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
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.password === null || user.password === undefined || user.password === '') {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await this.comparePasswords(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const { password: userPassword, ...result } = user;
        void userPassword;
        return {
            ...result,
            tenantId: result.tenantId || 'system',
        };
    }
    async login(email, password, tenantId) {
        const user = await this.validateUser(email, password, tenantId);
        const payload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role,
        };
        return this.generateTokenPair(payload);
    }
    validateToken(token) {
        try {
            return this.jwtService.verify(token);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    validateRefreshToken(refreshToken) {
        const refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
        if (typeof refreshSecret !== 'string' || refreshSecret.trim() === '') {
            throw new common_1.UnauthorizedException('JWT_REFRESH_SECRET is not configured');
        }
        try {
            return this.jwtService.verify(refreshToken, {
                secret: refreshSecret,
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
    }
    async refreshTokens(refreshToken) {
        const payload = this.validateRefreshToken(refreshToken);
        const user = await this.prismaService.user.findUnique({
            where: { id: payload.sub },
        });
        if (!user || user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        const newPayload = {
            sub: user.id,
            email: user.email,
            tenantId: user.tenantId || 'system',
            role: user.role,
        };
        return this.generateTokenPair(newPayload);
    }
    parseExpirationTime(expiration) {
        const timeValue = parseInt(expiration.slice(0, -1));
        const timeUnit = expiration.slice(-1);
        if (isNaN(timeValue)) {
            return 1800;
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
                return 1800;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map