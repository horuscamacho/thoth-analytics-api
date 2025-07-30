import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

interface IUser {
  id: string;
  email: string;
  username: string;
  role: string;
  tenantId: string | null;
  status: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  suspendedAt: Date | null;
  suspendedBy: string | null;
  suspensionReason: string | null;
  temporaryPassword?: string;
}

interface IUserFilters {
  status?: string;
  role?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createUser(
    createUserDto: CreateUserDto,
    tenantId: string,
  ): Promise<IUser & { temporaryPassword: string }> {
    // Validate unique email within tenant
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: createUserDto.email,
        tenantId: tenantId,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists in this tenant');
    }

    // Generate temporary password
    const temporaryPassword = this.generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    // Create user
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
        temporaryPasswordExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
      },
    });

    // Log user creation for audit
    await this.auditService.logAction(
      tenantId,
      null, // No user ID since this is system action
      AuditAction.USER_CREATED,
      AuditEntityType.USER,
      user.id,
      null, // No old values for creation
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
      },
      {
        createdRole: createUserDto.role,
        createdEmail: createUserDto.email,
      }
    );

    return {
      ...user,
      temporaryPassword,
    };
  }

  async getUsers(tenantId: string, filters: IUserFilters = {}): Promise<IUser[]> {
    const where: any = { tenantId };

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

  async getUserById(id: string, tenantId: string): Promise<IUser> {
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
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async suspendUser(
    id: string,
    tenantId: string,
    suspendedBy: string,
    reason?: string,
  ): Promise<IUser> {
    // Check if user exists
    const existingUser = await this.getUserById(id, tenantId);

    if (existingUser.status === 'SUSPENDED') {
      throw new BadRequestException('User is already suspended');
    }

    // Update user status
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

    // Log suspension for audit
    await this.auditService.logAction(
      tenantId,
      suspendedBy,
      AuditAction.USER_SUSPENDED,
      AuditEntityType.USER,
      id,
      { status: existingUser.status },
      { status: 'SUSPENDED', suspendedAt: new Date(), suspendedBy, suspensionReason: reason },
      { reason, previousStatus: existingUser.status }
    );

    // TODO: Invalidate user sessions (implement with Redis if needed)

    return user;
  }

  async reactivateUser(id: string, tenantId: string, reactivatedBy: string): Promise<IUser> {
    // Check if user exists
    const existingUser = await this.getUserById(id, tenantId);

    if (existingUser.status !== 'SUSPENDED') {
      throw new BadRequestException('User is not suspended');
    }

    // Update user status
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

    // Log reactivation for audit
    await this.auditService.logAction(
      tenantId,
      reactivatedBy,
      AuditAction.USER_REACTIVATED,
      AuditEntityType.USER,
      id,
      { status: existingUser.status },
      { status: 'ACTIVE', suspendedAt: null, suspendedBy: null, suspensionReason: null },
      { previousStatus: existingUser.status }
    );

    return user;
  }

  async deleteUser(
    id: string,
    tenantId: string,
    deletedBy: string,
    reason: string,
  ): Promise<{ id: string }> {
    // Check if user exists
    const existingUser = await this.getUserById(id, tenantId);

    // Prevent self-deletion
    if (id === deletedBy) {
      throw new BadRequestException('Cannot delete your own account');
    }

    // Log deletion before actual deletion for audit
    await this.auditService.logAction(
      tenantId,
      deletedBy,
      AuditAction.USER_DELETED,
      AuditEntityType.USER,
      id,
      {
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        role: existingUser.role,
        status: existingUser.status,
      },
      null, // No new values for deletion
      {
        reason,
        deletedUserData: {
          email: existingUser.email,
          username: existingUser.username,
          role: existingUser.role,
          status: existingUser.status,
        },
      }
    );

    // Delete user (cascade deletion will handle related data)
    await this.prisma.user.delete({
      where: { id },
    });

    return { id };
  }

  private generateTemporaryPassword(): string {
    // Generate secure temporary password: 12 characters with mixed case, numbers, symbols
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';
    // Ensure at least one character from each set
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill remaining 8 characters randomly
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

}
