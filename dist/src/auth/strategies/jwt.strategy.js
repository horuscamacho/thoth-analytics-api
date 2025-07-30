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
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../database/prisma.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(configService, prismaService) {
        const secret = configService.get('JWT_SECRET');
        if (typeof secret !== 'string' || secret.trim() === '') {
            throw new Error('JWT_SECRET is required');
        }
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
            passReqToCallback: true,
        });
        this.prismaService = prismaService;
    }
    async validate(request, payload) {
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
            throw new common_1.UnauthorizedException('User not found');
        }
        if (user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('User account is not active');
        }
        if (user.tenantId !== payload.tenantId) {
            throw new common_1.UnauthorizedException('Tenant mismatch');
        }
        const tenantHeader = request.headers['x-tenant-id'];
        const requestTenantId = Array.isArray(tenantHeader) ? tenantHeader[0] : tenantHeader;
        if (typeof requestTenantId === 'string' &&
            requestTenantId.trim() !== '' &&
            user.tenantId !== requestTenantId) {
            throw new common_1.UnauthorizedException('Tenant header mismatch');
        }
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            tenantId: user.tenantId,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map