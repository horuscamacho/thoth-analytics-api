import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from '../../database/prisma.service';
import { IJwtPayload } from '../auth.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    role: 'DIRECTOR_COMUNICACION',
    tenantId: 'tenant-123',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPayload: IJwtPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    tenantId: 'tenant-123',
    role: 'DIRECTOR_COMUNICACION',
  };

  const mockRequest = {
    headers: {
      'x-tenant-id': 'tenant-123',
    },
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-jwt-secret'),
    };

    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error if JWT_SECRET is missing', async () => {
      const mockConfigServiceNoSecret = {
        get: jest.fn().mockReturnValue(undefined),
      };

      const mockPrismaServiceEmpty = {
        user: {
          findUnique: jest.fn(),
        },
      };

      await expect(async () => {
        await Test.createTestingModule({
          providers: [
            JwtStrategy,
            {
              provide: ConfigService,
              useValue: mockConfigServiceNoSecret,
            },
            {
              provide: PrismaService,
              useValue: mockPrismaServiceEmpty,
            },
          ],
        }).compile();
      }).rejects.toThrow('JWT_SECRET is required');
    });

    it('should throw error if JWT_SECRET is empty string', async () => {
      const mockConfigServiceEmptySecret = {
        get: jest.fn().mockReturnValue(''),
      };

      const mockPrismaServiceEmpty = {
        user: {
          findUnique: jest.fn(),
        },
      };

      await expect(async () => {
        await Test.createTestingModule({
          providers: [
            JwtStrategy,
            {
              provide: ConfigService,
              useValue: mockConfigServiceEmptySecret,
            },
            {
              provide: PrismaService,
              useValue: mockPrismaServiceEmpty,
            },
          ],
        }).compile();
      }).rejects.toThrow('JWT_SECRET is required');
    });
  });

  describe('validate', () => {
    it('should validate user successfully', async () => {
      const prismaServiceMock = { user: { findUnique: jest.fn().mockResolvedValue(mockUser) } };
      (strategy as any).prismaService = prismaServiceMock;

      const result = await strategy.validate(mockRequest, mockPayload);

      expect(prismaServiceMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockPayload.sub },
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

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        role: mockUser.role,
        tenantId: mockUser.tenantId,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const prismaServiceMock = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
      (strategy as any).prismaService = prismaServiceMock;

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow('User not found');
    });

    it('should throw UnauthorizedException if user is not active', async () => {
      const inactiveUser = { ...mockUser, status: 'INACTIVE' };
      const prismaServiceMock = { user: { findUnique: jest.fn().mockResolvedValue(inactiveUser) } };
      (strategy as any).prismaService = prismaServiceMock;

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        'User account is not active',
      );
    });

    it('should throw UnauthorizedException if user is suspended', async () => {
      const suspendedUser = { ...mockUser, status: 'SUSPENDED' };
      const prismaServiceMock = {
        user: { findUnique: jest.fn().mockResolvedValue(suspendedUser) },
      };
      (strategy as any).prismaService = prismaServiceMock;

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        'User account is not active',
      );
    });

    it('should throw UnauthorizedException if tenant mismatch', async () => {
      const userWithDifferentTenant = { ...mockUser, tenantId: 'different-tenant' };
      const prismaServiceMock = {
        user: { findUnique: jest.fn().mockResolvedValue(userWithDifferentTenant) },
      };
      (strategy as any).prismaService = prismaServiceMock;

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow('Tenant mismatch');
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      const prismaServiceMock = { user: { findUnique: jest.fn().mockRejectedValue(dbError) } };
      (strategy as any).prismaService = prismaServiceMock;

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should validate user with different roles', async () => {
      const roles = ['DIRECTOR_COMUNICACION', 'LIDER', 'DIRECTOR_AREA', 'ASISTENTE'];

      for (const role of roles) {
        const userWithRole = { ...mockUser, role };
        const payloadWithRole = { ...mockPayload, role };

        const prismaServiceMock = {
          user: { findUnique: jest.fn().mockResolvedValue(userWithRole) },
        };
        (strategy as any).prismaService = prismaServiceMock;

        const result = await strategy.validate(mockRequest, payloadWithRole);

        expect(result.role).toBe(role);
      }
    });

    it('should validate user with different tenants', async () => {
      const tenantIds = ['tenant-1', 'tenant-2', 'tenant-3'];

      for (const tenantId of tenantIds) {
        const userWithTenant = { ...mockUser, tenantId };
        const payloadWithTenant = { ...mockPayload, tenantId };
        const requestWithTenant = {
          headers: {
            'x-tenant-id': tenantId,
          },
        };

        const prismaServiceMock = {
          user: { findUnique: jest.fn().mockResolvedValue(userWithTenant) },
        };
        (strategy as any).prismaService = prismaServiceMock;

        const result = await strategy.validate(requestWithTenant, payloadWithTenant);

        expect(result.tenantId).toBe(tenantId);
      }
    });

    it('should return only necessary user fields', async () => {
      const userWithExtraFields = {
        ...mockUser,
        password: 'hashedPassword',
        resetToken: 'resetToken123',
        lastLoginAt: new Date(),
      };

      const prismaServiceMock = {
        user: { findUnique: jest.fn().mockResolvedValue(userWithExtraFields) },
      };
      (strategy as any).prismaService = prismaServiceMock;

      const result = await strategy.validate(mockRequest, mockPayload);

      // Should only return the expected fields
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        role: mockUser.role,
        tenantId: mockUser.tenantId,
      });

      // Should not include sensitive fields
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('resetToken');
      expect(result).not.toHaveProperty('lastLoginAt');
    });
  });
});
