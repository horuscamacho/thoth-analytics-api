import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditEntityType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UsersService - Extended Tests', () => {
  let service: UsersService;
  let auditService: AuditService;

  const mockUser = {
    id: 'user-123',
    tenantId: 'tenant-123',
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedPassword',
    role: 'DIRECTOR_COMUNICACION',
    status: 'ACTIVE',
    createdAt: new Date(),
    lastLoginAt: null,
    suspendedAt: null,
    suspendedBy: null,
    suspensionReason: null,
    isTemporaryPassword: true,
    temporaryPasswordExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    settings: null,
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockAuditService = {
    logAction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
    (mockedBcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  describe('getUsers', () => {
    it('should return users for tenant with no filters', async () => {
      const mockUsers = [mockUser];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getUsers('tenant-123');

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
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
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return users with status filter', async () => {
      const mockUsers = [mockUser];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getUsers('tenant-123', { status: 'ACTIVE' });

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', status: 'ACTIVE' },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return users with role filter', async () => {
      const mockUsers = [mockUser];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getUsers('tenant-123', { role: 'DIRECTOR_COMUNICACION' });

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', role: 'DIRECTOR_COMUNICACION' },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return users with combined filters', async () => {
      const mockUsers = [mockUser];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getUsers('tenant-123', { 
        status: 'ACTIVE', 
        role: 'DIRECTOR_COMUNICACION' 
      });

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { 
          tenantId: 'tenant-123', 
          status: 'ACTIVE', 
          role: 'DIRECTOR_COMUNICACION' 
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('suspendUser', () => {
    it('should suspend user successfully', async () => {
      const suspendedUser = { ...mockUser, status: 'SUSPENDED', suspendedAt: new Date(), suspendedBy: 'admin-456' };
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(suspendedUser);

      const result = await service.suspendUser('user-123', 'tenant-123', 'admin-456', 'Policy violation');

      expect(result).toEqual(suspendedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          status: 'SUSPENDED',
          suspendedAt: expect.any(Date),
          suspendedBy: 'admin-456',
          suspensionReason: 'Policy violation',
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
      
      expect(auditService.logAction).toHaveBeenCalledWith(
        'tenant-123',
        'admin-456',
        AuditAction.USER_SUSPENDED,
        AuditEntityType.USER,
        'user-123',
        expect.any(Object),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should throw BadRequestException if user already suspended', async () => {
      const suspendedUser = { ...mockUser, status: 'SUSPENDED' };
      mockPrismaService.user.findFirst.mockResolvedValue(suspendedUser);

      await expect(
        service.suspendUser('user-123', 'tenant-123', 'admin-456', 'Policy violation')
      ).rejects.toThrow(BadRequestException);
    });

    it('should suspend user without reason', async () => {
      const suspendedUser = { ...mockUser, status: 'SUSPENDED', suspendedAt: new Date(), suspendedBy: 'admin-456' };
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(suspendedUser);

      const result = await service.suspendUser('user-123', 'tenant-123', 'admin-456');

      expect(result).toEqual(suspendedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          status: 'SUSPENDED',
          suspendedAt: expect.any(Date),
          suspendedBy: 'admin-456',
          suspensionReason: null,
        },
        select: expect.any(Object),
      });
    });
  });

  describe('reactivateUser', () => {
    it('should reactivate suspended user successfully', async () => {
      const suspendedUser = { ...mockUser, status: 'SUSPENDED', suspendedAt: new Date(), suspendedBy: 'admin-456' };
      const reactivatedUser = { ...mockUser, status: 'ACTIVE', suspendedAt: null, suspendedBy: null, suspensionReason: null };
      
      mockPrismaService.user.findFirst.mockResolvedValue(suspendedUser);
      mockPrismaService.user.update.mockResolvedValue(reactivatedUser);

      const result = await service.reactivateUser('user-123', 'tenant-123', 'admin-456');

      expect(result).toEqual(reactivatedUser);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
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
      
      expect(auditService.logAction).toHaveBeenCalledWith(
        'tenant-123',
        'admin-456',
        AuditAction.USER_REACTIVATED,
        AuditEntityType.USER,
        'user-123',
        expect.any(Object),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should throw BadRequestException if user is not suspended', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(
        service.reactivateUser('user-123', 'tenant-123', 'admin-456')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.reactivateUser('user-123', 'tenant-123', 'admin-456')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.deleteUser('user-123', 'tenant-123', 'admin-456', 'Account closure request');

      expect(result).toEqual({ id: 'user-123' });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      
      expect(auditService.logAction).toHaveBeenCalledWith(
        'tenant-123',
        'admin-456',
        AuditAction.USER_DELETED,
        AuditEntityType.USER,
        'user-123',
        expect.any(Object),
        null,
        expect.any(Object)
      );
    });

    it('should throw BadRequestException for self-deletion', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(
        service.deleteUser('user-123', 'tenant-123', 'user-123', 'Self deletion')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteUser('user-123', 'tenant-123', 'admin-456', 'Account closure')
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle database errors during deletion', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockRejectedValue(new Error('Foreign key constraint'));

      await expect(
        service.deleteUser('user-123', 'tenant-123', 'admin-456', 'Account closure')
      ).rejects.toThrow('Foreign key constraint');
    });
  });

  describe('getUserById', () => {
    it('should return user by id and tenant', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.getUserById('user-123', 'tenant-123');

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-123', tenantId: 'tenant-123' },
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
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.getUserById('user-123', 'tenant-123')
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle invalid user id format', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.getUserById('invalid-id', 'tenant-123')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUser - Additional Tests', () => {
    const createUserDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      role: 'DIRECTOR_COMUNICACION' as const,
    };

    it('should handle bcrypt hashing errors', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      (mockedBcrypt.hash as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));

      await expect(
        service.createUser(createUserDto, 'tenant-123')
      ).rejects.toThrow('Bcrypt error');
    });

    it('should generate unique user IDs', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        ...createUserDto,
        id: 'unique-id-123',
      });

      await service.createUser(createUserDto, 'tenant-123');

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          id: expect.any(String),
          ...createUserDto,
          tenantId: 'tenant-123',
          password: expect.any(String),
          status: 'ACTIVE',
          isTemporaryPassword: true,
          temporaryPasswordExpiresAt: expect.any(Date),
          createdAt: expect.any(Date),
        },
      });
    });

    it('should set correct temporary password expiration', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        ...createUserDto,
      });

      await service.createUser(createUserDto, 'tenant-123');

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          temporaryPasswordExpiresAt: new Date(now + 24 * 60 * 60 * 1000),
        }),
      });

      jest.restoreAllMocks();
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle database connection errors', async () => {
      mockPrismaService.user.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        service.getUsers('tenant-123')
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle concurrent user operations', async () => {
      // First operation: suspend user successfully
      mockPrismaService.user.findFirst.mockResolvedValueOnce(mockUser);
      mockPrismaService.user.update.mockResolvedValueOnce({ ...mockUser, status: 'SUSPENDED' });

      // Second operation: try to reactivate a user that's not suspended (should fail)
      mockPrismaService.user.findFirst.mockResolvedValueOnce(mockUser); // Still active

      const promise1 = service.suspendUser('user-123', 'tenant-123', 'admin-456', 'Violation');
      const promise2 = service.reactivateUser('user-456', 'tenant-123', 'admin-456');

      const results = await Promise.allSettled([promise1, promise2]);
      
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      if (results[1].status === 'rejected') {
        expect(results[1].reason).toBeInstanceOf(BadRequestException);
      }
    });

    it('should handle malformed tenant IDs', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.getUsers('');

      expect(result).toEqual([]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { tenantId: '' },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should handle large result sets', async () => {
      const largeUserSet = Array(1000).fill(null).map((_, index) => ({
        ...mockUser,
        id: `user-${index}`,
        email: `user${index}@example.com`,
      }));
      
      mockPrismaService.user.findMany.mockResolvedValue(largeUserSet);

      const result = await service.getUsers('tenant-123');

      expect(result).toHaveLength(1000);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'user-0',
        email: 'user0@example.com',
      }));
    });
  });

  describe('private methods', () => {
    describe('generateTemporaryPassword', () => {
      it('should generate password with all required character types', () => {
        const password = (service as any).generateTemporaryPassword();

        expect(typeof password).toBe('string');
        expect(password.length).toBe(12);
        expect(/[A-Z]/.test(password)).toBe(true);
        expect(/[a-z]/.test(password)).toBe(true);
        expect(/[0-9]/.test(password)).toBe(true);
        expect(/[!@#$%^&*]/.test(password)).toBe(true);
      });

      it('should generate different passwords on multiple calls', () => {
        const password1 = (service as any).generateTemporaryPassword();
        const password2 = (service as any).generateTemporaryPassword();
        const password3 = (service as any).generateTemporaryPassword();

        expect(password1).not.toBe(password2);
        expect(password2).not.toBe(password3);
        expect(password1).not.toBe(password3);
      });
    });
  });
});