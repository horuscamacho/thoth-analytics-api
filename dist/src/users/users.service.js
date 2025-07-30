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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
let UsersService = class UsersService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async createUser(createUserDto, tenantId) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                email: createUserDto.email,
                tenantId: tenantId,
            },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already exists in this tenant');
        }
        const temporaryPassword = this.generateTemporaryPassword();
        const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
        const user = await this.prisma.user.create({
            data: {
                id: crypto.randomUUID(),
                email: createUserDto.email,
                username: createUserDto.username,
                password: hashedPassword,
                role: createUserDto.role,
                tenantId: tenantId,
                status: 'ACTIVE',
                isTemporaryPassword: true,
                temporaryPasswordExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                createdAt: new Date(),
            },
        });
        await this.auditService.logAction(tenantId, null, client_1.AuditAction.USER_CREATED, client_1.AuditEntityType.USER, user.id, null, {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            status: user.status,
        }, {
            createdRole: createUserDto.role,
            createdEmail: createUserDto.email,
        });
        return {
            ...user,
            temporaryPassword,
        };
    }
    async getUsers(tenantId, filters = {}) {
        const where = { tenantId };
        if (filters.status) {
            where.status = filters.status;
        }
        if (filters.role) {
            where.role = filters.role;
        }
        const users = await this.prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                status: true,
                createdAt: true,
                lastLoginAt: true,
                suspendedAt: true,
                suspendedBy: true,
                suspensionReason: true,
                tenantId: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return users;
    }
    async getUserById(id, tenantId) {
        const user = await this.prisma.user.findFirst({
            where: {
                id,
                tenantId,
            },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                status: true,
                createdAt: true,
                lastLoginAt: true,
                suspendedAt: true,
                suspendedBy: true,
                suspensionReason: true,
                tenantId: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async suspendUser(id, tenantId, suspendedBy, reason) {
        const existingUser = await this.getUserById(id, tenantId);
        if (existingUser.status === 'SUSPENDED') {
            throw new common_1.BadRequestException('User is already suspended');
        }
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                status: 'SUSPENDED',
                suspendedAt: new Date(),
                suspendedBy,
                suspensionReason: reason || null,
            },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                status: true,
                createdAt: true,
                lastLoginAt: true,
                suspendedAt: true,
                suspendedBy: true,
                suspensionReason: true,
                tenantId: true,
            },
        });
        await this.auditService.logAction(tenantId, suspendedBy, client_1.AuditAction.USER_SUSPENDED, client_1.AuditEntityType.USER, id, { status: existingUser.status }, { status: 'SUSPENDED', suspendedAt: new Date(), suspendedBy, suspensionReason: reason }, { reason, previousStatus: existingUser.status });
        return user;
    }
    async reactivateUser(id, tenantId, reactivatedBy) {
        const existingUser = await this.getUserById(id, tenantId);
        if (existingUser.status !== 'SUSPENDED') {
            throw new common_1.BadRequestException('User is not suspended');
        }
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                status: 'ACTIVE',
                suspendedAt: null,
                suspendedBy: null,
                suspensionReason: null,
            },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                status: true,
                createdAt: true,
                lastLoginAt: true,
                suspendedAt: true,
                suspendedBy: true,
                suspensionReason: true,
                tenantId: true,
            },
        });
        await this.auditService.logAction(tenantId, reactivatedBy, client_1.AuditAction.USER_REACTIVATED, client_1.AuditEntityType.USER, id, { status: existingUser.status }, { status: 'ACTIVE', suspendedAt: null, suspendedBy: null, suspensionReason: null }, { previousStatus: existingUser.status });
        return user;
    }
    async deleteUser(id, tenantId, deletedBy, reason) {
        const existingUser = await this.getUserById(id, tenantId);
        if (id === deletedBy) {
            throw new common_1.BadRequestException('Cannot delete your own account');
        }
        await this.auditService.logAction(tenantId, deletedBy, client_1.AuditAction.USER_DELETED, client_1.AuditEntityType.USER, id, {
            id: existingUser.id,
            email: existingUser.email,
            username: existingUser.username,
            role: existingUser.role,
            status: existingUser.status,
        }, null, {
            reason,
            deletedUserData: {
                email: existingUser.email,
                username: existingUser.username,
                role: existingUser.role,
                status: existingUser.status,
            },
        });
        await this.prisma.user.delete({
            where: { id },
        });
        return { id };
    }
    generateTemporaryPassword() {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*';
        const allChars = uppercase + lowercase + numbers + symbols;
        let password = '';
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        for (let i = 4; i < 12; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        return password
            .split('')
            .sort(() => Math.random() - 0.5)
            .join('');
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map